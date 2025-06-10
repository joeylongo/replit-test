// Imports
import type { FieldConfig, SalesforceRecordData } from "@shared/schema";
import { FIELD_PROMPT_CONFIG } from "@shared/schema";
import ollama from 'ollama'
import pLimit from 'p-limit'

// Chat wrapper
const chat = async (messages: any, format: any) => {
  const res = await ollama.chat({
    model: 'gemma3:12b',
    messages,
    format
  });
  return res.message.content;
};

// Interfaces
export interface AnalysisStep {
  step: number;
  type: 'analysis' | 'suggestion' | 'complete';
  message: string;
  data?: any;
}

export interface MissingDataSuggestion {
  field: string;
  currentValue: string | undefined;
  suggestedValue: string;
  confidence: number;
  reasoning: string;
  isDiscrepancy: boolean;
  improvementStyle: string;
  isEmpty?: boolean;
}

export interface ExecutionDetailsRewrite {
  currentText: string;
  rewrittenText: string;
  improvements: string[];
  confidence: number;
}

// Main Workflow Class
export class RAGWorkflow {
  private recordContext: string = "";
  private executionDetails: string = "";

  async initializeWithRecord(recordData: SalesforceRecordData): Promise<void> {
    const { DEFAULT_FIELD_CONFIG } = await import('../shared/schema');
    const fieldLines = DEFAULT_FIELD_CONFIG.map(field => {
      const value = recordData[field.key];
      return `- ${field.label}: ${value || 'Not specified'}`;
    }).join('\n');
    this.executionDetails = recordData.Product_Price_Execution_Direction__c || '';
    this.recordContext = `Record Context:\n${fieldLines}\n\nExecution Details: ${this.executionDetails}`.trim();
  }

  async *analyzeRecordForMissingData(recordData: SalesforceRecordData): AsyncGenerator<AnalysisStep> {
    yield { step: 1, type: 'analysis', message: 'Initializing analysis workflow...' };
    if (!this.recordContext) await this.initializeWithRecord(recordData);
    yield { step: 1, type: 'complete', message: 'Analysis workflow initialized successfully' };

    yield { step: 2, type: 'analysis', message: 'Scanning record fields for missing data...' };
    const { empty, populated } = await this.identifyFieldsForAnalysis(recordData);
    yield { step: 2, type: 'complete', message: `Found ${empty.length} empty fields and ${populated.length} populated fields to verify` };

    yield { step: 3, type: 'analysis', message: 'Analyzing execution details for contextual insights...' };
    yield { step: 3, type: 'complete', message: 'Execution details analyzed successfully' };

    yield { step: 4, type: 'analysis', message: 'Generating AI-powered suggestions in parallel...' };
    const fieldList = [...empty, ...populated];
    const limit = pLimit(1);
    const results = await Promise.allSettled(fieldList.map(field =>
      limit(() => this.suggestFieldValue(field, recordData))
    ));
    //const results = await Promise.allSettled(fieldList.map(field => this.suggestFieldValue(field, recordData)));

    const suggestions: MissingDataSuggestion[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const field = fieldList[i];
      const promptConfig = FIELD_PROMPT_CONFIG[field.key];
      if (result.status === 'fulfilled' && result.value && result.value.confidence >= 90) {
        suggestions.push({
          ...result.value,
          improvementStyle: promptConfig.improvementStyle,
          isEmpty: empty.includes(field),
          isDiscrepancy: promptConfig.improvementStyle === 'literal'
        });
      }
    }

    yield { step: 4, type: 'complete', message: `Generated ${suggestions.length} high-confidence suggestions` };

    if (suggestions.length > 0) {
      yield {
        step: 5,
        type: 'suggestion',
        message: `Found ${suggestions.filter(s => !s.isDiscrepancy).length} missing data suggestions and ${suggestions.filter(s => s.isDiscrepancy).length} discrepancies`,
        data: { suggestions }
      };
      yield { step: 6, type: 'complete', message: 'Please resolve field suggestions first, then execution details will be analyzed with updated data' };
    } else {
      yield* this.analyzeExecutionDetails(recordData);
    }
  }

  async *analyzeExecutionDetails(recordData: SalesforceRecordData): AsyncGenerator<AnalysisStep> {
    yield { step: 7, type: 'analysis', message: 'Analyzing execution details for improvement opportunities...' };
    const executionRewrite = await this.rewriteExecutionDetails(recordData);
    yield { step: 7, type: 'complete', message: 'Execution details analysis completed' };

    if (executionRewrite) {
      yield {
        step: 8,
        type: 'suggestion',
        message: 'Generated improved execution details for review.',
        data: { executionRewrite }
      };
    } else {
      yield { step: 8, type: 'complete', message: 'Execution details are already well-written.' };
    }
  }

  private async identifyFieldsForAnalysis(recordData: SalesforceRecordData): Promise<{ empty: FieldConfig[], populated: FieldConfig[] }> {
    const { DEFAULT_FIELD_CONFIG, FIELDS_TO_ANALYZE } = await import('../shared/schema');
    const empty: FieldConfig[] = [];
    const populated: FieldConfig[] = [];

    DEFAULT_FIELD_CONFIG.forEach(fieldConfig => {
      if (!FIELDS_TO_ANALYZE.includes(fieldConfig.key)) return;
      const value = recordData[fieldConfig.key];
      if (!value || value.toString().trim() === '') {
        empty.push(fieldConfig);
      } else {
        populated.push(fieldConfig);
      }
    });

    return { empty, populated };
  }

  // You already have suggestFieldValue and rewriteExecutionDetails defined elsewhere — include them here.
  private async suggestFieldValue(field: FieldConfig, recordData: SalesforceRecordData): Promise<MissingDataSuggestion | null> {
    if (!recordData.Product_Price_Execution_Direction__c) {
      return null;
    }

    const promptConfig = FIELD_PROMPT_CONFIG[field.key]
    if (!promptConfig) {
      console.warn(`Missing prompt config for field ${field.key}`);
      return null;
    }
    const fieldHasOptions = promptConfig.options?.length
    const currentValue = recordData[field.key as keyof SalesforceRecordData];
    const hasCurrentValue = currentValue && currentValue.toString().trim() !== '' && currentValue.toString().trim() !== 'undefined' && currentValue.toString().trim() !== 'null';
// ${this.recordContext}
    let prompt: string;
      prompt = `You are a Coca-Cola analyst assistant. Analyze the following Execution Details to ${hasCurrentValue && promptConfig.improvementStyle === 'literal' ? `detect LITERAL contradictions for` : `suggest an improved value for`} the "${field.key}" field.

Execution Details:
${this.executionDetails}

${hasCurrentValue ? `Current field value: "${currentValue}"` : `The "${field.key}" field is currently empty.`}

${fieldHasOptions 
  ? `The ${field.key} enforces the following options: ${promptConfig.options?.join(', ')}.
Only suggest one of the available options. In your reasoning, take into consideration the fact that the value MUST be one of these options.`
: `The ${field.key} does not enforce a list of options.`}

${hasCurrentValue && promptConfig.improvementStyle === 'literal' ? `
IMPORTANT: For populated fields, treat the EXECUTION DETAILS as the source of truth. Only flag as a discrepancy if the execution details contain specific information that contradicts the current field value.

The execution details are always correct - update the record field to match the execution details when there's a conflict.

Examples of TRUE discrepancies (field should be updated to match execution details):
- The POI_Picklist__c (Point of Interest) field shows "Beverage Aisle" but execution details say "Perimeter Display" → Update field to "Beverage Aisle"
- The Activity_type__c (Activity Type) field shows "Execute" but execution details say "Sell: ..." → Update field to "Sell"

NOT discrepancies:
- Different levels of detail (e.g., "Front of store/Lobby" vs "Front of store")
- More or less verbose wording (e.g., Execution details say "10pk Mini Can Perimeter Display" but the POI_Picklist__c field shows "Perimeter" → there is NO discrepancy since Perimeter is one of the enforced options. )
- Execution details don't mention specific conflicting information
- Field empty and execution details provide info (that's missing data, not a discrepancy)

Only suggest updating the field value if the execution details explicitly contradict it with specific information. Always suggest the value from execution details as the correct one.
` : `
For this field, instead of being literal in your comparison, analyze the execution details to suggest an improved value.
If the value is already satisfactory and is not empty, don't provide any suggestion and set "hasSuggest": false.
`}

${promptConfig.customPrompt}

Respond with JSON in this exact format:
{
  "hasSuggestion": boolean,
  "suggestedValue": "string value or null",
  "confidence": number (0-100),
  "reasoning": "brief explanation of why you're suggesting this value or correction",
  "isDiscrepancy": boolean (true ONLY if there's a direct contradiction, false otherwise)
}

${hasCurrentValue && promptConfig.improvementStyle === 'literal'
  ? `Be very conservative - if in doubt, do not flag as discrepancy. Only flag TRUE contradictions.`
  : `Only suggest a suggestedValue if confidence is above 60 and your suggestion is clearly better given info specifically mentioned in execution details.`}
`;


    try {
      const messages = [
        {
          role: "system",
          content: `You are an AI agent with knowledge about how Coca-Cola relays promotion execution strategy to front line sales.
The company has promotions which involve setting up special product displays in-store.
You are in the execution enablement group which is responsible for keeping track of the promotions and articulating to front-line sales people about how to set up the displays.
This groups creates a PicOS (Picture of Success) record in salesforce that tracks the promotion (for example, "March Madness") and the bottlers the promotion affects.
Each PicOS has a number of activities that each relate to a specific store, a number of their doors, and specific products/displays.

Here is the guide on what makes a good activity:

**Action Item Rules of Engagement **
Our associates should have no more than 10-12 Action Items at a time
If you have activity spanning multiple months, a new AI should be submitted for each month of execution
Action Items should always describe the 5 Ps: Product, Package, Point of Sale, Price and Placement
For MSC Action Items, detail necessary products/packages necessary for execution
Action Item Prioritization should encompass:
Customer initiatives and price promotions
Channel Big Bets
Market Street Challenge priorities
Incremental Brand Partner AIs  
Use AIs to verify POS execution IF there is a price promo and should include execution direction
For example, “Execute ordering extra inventory to support Peace Tea promotion 2/$2.50 supported by poster”
Include process for replacement POS or refusal to execute
Product allocations should be considered prior to submitting an action item. If possible, include a replacement product should something be out of stock
HQM vs. LSI: If the action item requires a selling conversation with a store manager, it is an LSI
For example, a coop might have Core Power in a POG progression, but the product still needs to be sold at the outlet level
Segment HQM action items when activity is store specific

**“PicOS” Look of Success**
Action Item verbiage (Execution Details) must clearly detail the intended execution, including Brand, Package, Point of Sale, Price and ideal Location
For example, “Sell in 4x3 Merchandising Rack and/or display in the perimeter with 2L Fanta flavors at 4/$5. Activate with Fanta Halloween graphics from the POS Store."
Detail MSC specific brands/packages when applicable
For example, “Execute a 12 Pack end with including Coke, Diet Coke, Coke Zero Sugar, Sprite and Fanta Orange at 3/$12. Wing 6 Pack ½ Liter at 2/$6. Activate Big Game POS from the POS Store.”
Include baseline MSC Score in Verify
Include appropriate naming conventions (see details)
Every action item should include a picture of the desired execution
Priority HQM and ALL LSI action items should include a Sell Sheet:
Detail “Why”: Why this product? Why this program/messaging? Why this location?
Where possible, include product margin
Include link to appropriate POS on POS Store (Key Account folder or General Market  Program folder)

**Action Item Naming Conventions**
***Naming conventions allow us to track execution specific to strategic initiatives. These results are indicators of volume/revenue performance.***
MSC: Market Street Challenge
Big Bets:
  - BBIC: Immediate Consumption
  - BBW: Water
  - BBE: Energy
  - BBIso: Isotonics
  - BBFC: Future Consumption

Pillar Programs:
  - BG: Big Game
  - MM: March Madness
  - Sum: Summer
  - KOC: Coke Creations
  - FF: Fall Football
  - Hol: Holiday 
`
        },
        {
          role: "user",
          content: prompt
        }
      ]

      const response = await chat(messages, {
        type: "object",
        properties: {
          hasSuggestion: { type: 'boolean' },
          suggestedValue: { type: "string", },
          confidence: { type: "number", },
          reasoning: { type: "string", },
          isDiscrepancy: { type: "boolean", },
        },
        required: [
          "hasSuggestion",
          "suggestedValue",
          "confidence",
          "reasoning",
          "isDiscrepancy",
        ],
      })
      console.log('RESPONSE:', response)
      const parsed = JSON.parse(response?.replace(/pepsi/gi, 'Coke') || "{}");

      const current = recordData[field.key];
      const normalizedCurrent = typeof current === 'string' ? current.trim().toLowerCase() : String(current || '').trim().toLowerCase();
      const normalizedSuggestion = typeof parsed.suggestedValue === 'string' ? parsed.suggestedValue.trim().toLowerCase() : String(parsed.suggestedValue || '').trim().toLowerCase();

      if (normalizedCurrent === normalizedSuggestion) {
        return null;
      }
      const confidenceNum = Math.round(parsed.confidence);
      console.log("CONFIDENCE: " , confidenceNum);
      const threshold = promptConfig.confidenceThreshold ?? 60;
      if (parsed.hasSuggestion && confidenceNum >= threshold) {
        return {
          field: field.key,
          currentValue: recordData[field.key],
          suggestedValue: parsed.suggestedValue,
          confidence: confidenceNum,
          reasoning: parsed.reasoning,
          isDiscrepancy: parsed.isDiscrepancy || false,
          improvementStyle: promptConfig.improvementStyle,
          isEmpty: !recordData[field.key]
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error analyzing field ${field}:`, error);
      return null;
    }
  }

  private async rewriteExecutionDetails(recordData: SalesforceRecordData): Promise<ExecutionDetailsRewrite | null> {
    try {
      // const openai = new (await import('openai')).default({
      //   apiKey: process.env.OPENAI_API_KEY
      // });

      const prompt = `Please rewrite the provided Execution Details using the best practices for PicOS execution direction.

        Here is the Salesforce Activity record:
        ${Object.entries(recordData)
          .map(([key, val]) => `- ${key}: ${val || 'Not specified'}`)
          .join('\n')}

        Here are the original Execution Details:
        "${recordData.Product_Price_Execution_Direction__c}"
        
        Here is the Activity Type:
        "${recordData.Activity_type__c}"

        Tips for improving existing Execution Details:
          - Sometimes the person who originally wrote the Execution Details will include extra information that is not present in any data the Salesforce Record.
            If you identify words and phrases like this, then you should try to include them in the new rewritten Execution Details despite these terms not existing anywher else.
            The reason is that someone probably had some special knowledge not captured anywhere so that should be retained.
          - Try to prefer easy to understand layman's terminology over acronyms and jargon within reason. 
              For example: "SSD: 12x355ml" is more confusing than "12-pack Core CAN display". Simply write "12-pack Core CAN display" and omit "SSD: 12x355ml"
          - Certain words that exist only in the execution details should be weighted higher for inclusion in the newly rewritten Execution details.
            This includes words like: Shipper, pallet drop, storage bin. You are allowed to also come up with other words to weight highly if you think they belong in the same category as the given words.

        You need to ensure that there is only one product description per activity. These are some examples of product descriptions:
        - 12-pack Core CAN display
        - 20-pack Cans display
        - 6-pack Half Liters display
        - 20oz 8pack display
        - SSD: 12x355ml
        - SSD Core CAN 12x355ml 12pk
        - SSD Core CAN 12oz x 355ml (12-pack)
        - Product: SSD Core CAN 12z/355m 12pk
        Do NOT put more than one product description in the Execution Details. If there are multiple products, you should pick the most important one and use that as the product description.
        If the Execution Details already has a product description, you should not add a "Product:" description or explanation to the end of the execution details.

        IMPORTANT: For populated fields, treat the EXECUTION DETAILS as the source of truth. Only flag as a discrepancy if the execution details contain specific information that contradicts the current field value.

        Activity_type__c or "Activity Type" → How to begin Execution Details:
        - "Execute" or "Headquarter Mandated (HQM)" → Begin with "Execute:"
        - "Sell" or "Local Sell In (LSI)" → Begin with "Sell:"
        - "HUNT" or "Hunt" → Begin with "Hunt:"
        - "VERIFY" or "Verify"  → Begin with "Verify:"
        - Anything else → Do NOT begin with a verb unless it matches the Activity_type__c exactly.

        **Guide to providing layman's terms and jargon to avoid**
        Normalize any product description to the clearest layman’s version. For example:
        - Normalize "SSD Core CAN 12oz x 355ml (12-pack) to "12-pack Core CAN display"
        Once normalized, do NOT rephrase or restate it again.
        Use the following guide to use layman's terms over acronymns and jargon. Do NOT use the following terms:
        - SSD: sparkling soft drink. You dont need to include SSD because people will know which brands are SSDs.
        - 12 x 355ml: You shouldn't simply copy the package types info directly. You must instead say "12 pack of Cans" since cans are always 355ml.
        Here are some specific examples and how to improve them.

        1) Bad examples:
            ❌ BAD: Execute 12-pack Core CAN display at the Front of Store/Lobby with SSD Core CAN 12oz x 355ml (12-pack). Implement shelf talkers with a $4.99 promo.
            ❌ BAD: Execute 12-pack Core CAN display featuring SSD Core CAN 12oz x 355ml (12 pack) at $4.99. Deploy shelf talkers to the front of store/lobby. Utilize Simple Promo: 1 can for $4.99.
            ❌ BAD: Execute 12-pack Core CAN display at the front of store/lobby featuring SSD Core CAN 12oz/355ml 12pk. Implement shelf talkers with the $4.99 Simple Promo: 1 can for $4.99.
            ❌ BAD: Execute 12-pack Core CAN display at the Front of Store/Lobby with $4.99 Simple Promo: 1 can for $4.99. Deploy shelf talkers. Product: SSD Core CAN 12z/355m 12pk.
        2) Good examples:
            ✅ GOOD: Execute 12-pack Core CAN display at the Front of Store/Lobby. Implement shelf talkers with a $4.99 promo.
            ✅ GOOD: Sell: Incremental Stand-Alone Smart Water Display. 20oz Smartwater at 2/$4 TPR Activate POS (BBW) Thru 7/8
            ✅ GOOD: Verify display (running 7/20 - 8/16) TPR/AD - Team Pack Mega $5.99 (display pending - BTS program utilizing school bus display -- 68 cases 12oz 8pk pack out)
            ✅ GOOD: Execute 12-pack Core CAN display at the front of store/lobby. Implement shelf talkers with the $4.99 Simple Promo: 1 can for $4.99.
            ✅ GOOD: HUNT: Incremental 355mL Coke De Mexico Rack / Display (Must Include Sprite and/or Fanta) at $EDV or $Promo!! (MSC)
            ✅ GOOD: Execute 12-pack Core CAN display at the Front of Store/Lobby with $4.99 Simple Promo: 1 can for $4.99. Deploy shelf talkers.
       
        **Your job**
        Your job is to focus on what good "Execution Details" look like. Execution Details is another term for the Action Item verbiage or "execution direction" referred to in the guide above.
        The "“PicOS” Look of Success" section of the guide covers good execution details.
        The Execution Details should refer to the Action Item Naming Conventions in the guide where applicable. For example, if the activity is "Market Street Challenge" = Yes, then put "MSC" somwhere to track it.

        ⚠️ CRITICAL RULE: Do **NOT** include the word "Execute" in the Execution Details unless it is explicitly listed as the Activity_type__c vaue.

        ⚠️ CRITICAL RULE:
        You must include only ONE product description in the Execution Details. If you mention "12-pack Core CAN display" or similar once, DO NOT repeat it in another format later. This includes variations like:
        - SSD Core CAN 12oz x 355ml (12-pack)
        - 12-pack of 12oz cans
        - SSD Import GLS 12z/355m 1pk 24
        - 12x355ml
        - Product: SSD Core CAN 12z/355m 12pk
        - Product: SSD Core CAN 12oz/355ml (12-pack)
        - 12-pack Core CAN display
        These are all the same thing. Choose ONE clear phrase, and DO NOT restate or rephrase the product description again. 👉 Repeating the product description in a different format is redundant and unprofessional.
        Any of the following patterns are considered the same and must NOT be repeated together:
        - Any phrase that begins with “Product: …”
        - Any phrase that begins with “SSD Core …”
        - Any phrase that begins with "12-pack Core …”
        - Any phrase that contains “SSD Import GLS …”
        - Any phrase that ends with “pack of Cans”
        These all refer to the same concept. You MUST pick just one and use it once.

        Execution details need to be 265 characters or less (not counting HTML tags).
        Execution details may not include links or images, they are just a concise paragraph aimed at providing maximum execution direction in limited space.
        You should return HTML markup. Please use font weights, different font colors, and underlining to group the information in the best way, and return your response in HTML markup instead of plain text.
       
        ⚠️ CRITICAL RULES:
        - Use <strong>, <u>, and <span style="color:..."> for formatting.
        - Only ONE product description is allowed. Do NOT repeat it in another format.
        - Product descriptions must be normalized to layman’s terms, e.g., “SSD Core CAN 12oz x 355ml (12-pack)” becomes “12-pack Core CAN display”.
        - Never restate or vary the product phrase in the same output.
        - Include 5Ps: Product, Package, Point of Sale, Price, and Placement.
        - Prefer human-readable over acronyms (e.g., omit SSD if it’s clear).
        - Use color for verbs: <span style="color:red">Execute</span>, <span style="color:gray">Sell</span>, <span style="color:goldenrod">Hunt</span>.
        - Max 265 characters (excluding HTML tags).
        - Always include promotion context (e.g., MSC, MM, etc.) if available.

        Respond in this JSON format:
        {
          "rewrittenText": "<html formatted execution details>",
          "improvements": ["Short list of improvements made"],
          "confidence": 90
        }
      `;
      console.log('rewriteExecutionDetails',prompt)

    const messages = [
      {
        role: "system",
        content: `You are an AI agent responsible for rewriting and enhancing PicOS Execution Details for a beverage company. You MUST:
    - Apply layman's language over jargon.
    - Never duplicate product descriptions.
    - Format using basic HTML (bold, underline, color).
    - Include only the most relevant product and promotion info.
    - Always respond with JSON.
    - ALWAYS attempt to rewrite the Execution Details. The user can always discard your suggestion if they want.`
      },
      {
        role: "user",
        content: prompt
      }
    ];
    const response = await chat(messages, {
      type: "object",
      properties: {
        rewrittenText: { type: 'string' },
        improvements: {
          type: "array",
          items: { type: "string" }
        },
        confidence: { type: "number" }
      },
      required: ["rewrittenText", "improvements", "confidence"]
    });

      const result = JSON.parse(response?.replace(/pepsi/gi, 'Coke') || "{}");
    console.log('RESPONSE', response)
      // const response = await openai.chat.completions.create({
      //   model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      //   messages,
      //   response_format: { type: "json_object" },
      //   temperature: 0.7,
      //   max_tokens: 800
      // });

      // const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Thought maybe we could use AI to remove "Execute" from the begining if the Activity type is NOT execute:
      // const rewrittenText = recordData.Activity_type__c === 'Execute' ? result.rewrittenText : /execute/i.test(result.rewrittenText) ? await this.stripExecutePrefix(result.rewrittenText) : result.rewrittenText

      const rewrittenText = result.rewrittenText
      
      if (result.rewrittenText && result.confidence >= 60) {
        return {
          currentText: recordData.Product_Price_Execution_Direction__c || '',
          rewrittenText,
          improvements: result.improvements || [],
          confidence: result.confidence || 75
        };
      }

      // Fallback if AI doesn't provide rewritten text - should not happen with new prompt
      return {
        currentText: recordData.Product_Price_Execution_Direction__c || '',
        rewrittenText: recordData.Product_Price_Execution_Direction__c || '', // + " [Enhanced with improved formatting and clarity.]",
        improvements: ["Enhanced formatting and structure"],
        confidence: 50
      };

    } catch (error) {
      console.error('Error rewriting execution details:', error);
      return null;
    }
  }
}
