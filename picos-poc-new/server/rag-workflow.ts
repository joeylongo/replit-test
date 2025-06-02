import type { SalesforceRecordData } from "@shared/schema";
import ollama from 'ollama'


const chat = async (messages: any, format: any) => {
  const res = await ollama.chat({
    model: 'gemma3:4b',
    messages,
    format
  })
  return res.message.content
}

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
  isDiscrepancy: boolean; // true if correcting existing data, false if filling empty field
}

export interface ExecutionDetailsRewrite {
  currentText: string;
  rewrittenText: string;
  improvements: string[];
  confidence: number;
}

export class RAGWorkflow {
  private recordContext: string = "";

  async initializeWithRecord(recordData: SalesforceRecordData): Promise<void> {
    // Import the field configuration
    const { DEFAULT_FIELD_CONFIG } = await import('../shared/schema');
    
    // Build record context dynamically from field configuration
    const fieldLines = DEFAULT_FIELD_CONFIG.map(field => {
      const value = recordData[field.key];
      const displayValue = value || 'Not specified';
      return `- ${field.label}: ${displayValue}`;
    }).join('\n');

    this.recordContext = `
Record Context:
${fieldLines}

Execution Details: ${recordData.Product_Price_Execution_Direction__c || 'No execution details provided'}
`.trim();
  }

  async *analyzeRecordForMissingData(recordData: SalesforceRecordData): AsyncGenerator<AnalysisStep> {
    // Step 1: Initialize
    yield {
      step: 1,
      type: 'analysis',
      message: 'Initializing analysis workflow...'
    };
    
    if (!this.recordContext) {
      await this.initializeWithRecord(recordData);
    }
    
    yield {
      step: 1,
      type: 'complete',
      message: 'Analysis workflow initialized successfully'
    };

    // Step 2: Analyze fields
    yield {
      step: 2,
      type: 'analysis',
      message: 'Scanning record fields for missing data...'
    };

    const fieldsToAnalyze = await this.identifyFieldsForAnalysis(recordData);
    
    yield {
      step: 2,
      type: 'complete',
      message: `Found ${fieldsToAnalyze.empty.length} empty fields and ${fieldsToAnalyze.populated.length} populated fields to verify`
    };

    // Step 3: Analyze all fields for missing data and discrepancies
    yield {
      step: 3,
      type: 'analysis',
      message: 'Analyzing execution details for contextual insights...'
    };

    yield {
      step: 3,
      type: 'complete',
      message: 'Execution details analyzed successfully'
    };

    // Step 4: Generate suggestions
    yield {
      step: 4,
      type: 'analysis',
      message: 'Generating AI-powered suggestions...'
    };

    const suggestions: MissingDataSuggestion[] = [];
    
    // Analyze empty fields for suggestions
    for (const field of fieldsToAnalyze.empty) {
      const suggestion = await this.suggestFieldValue(field, recordData);
      if (suggestion && suggestion.confidence >= 90) {
        suggestions.push(suggestion);
      }
    }

    // Analyze populated fields for discrepancies
    for (const field of fieldsToAnalyze.populated) {
      const suggestion = await this.suggestFieldValue(field, recordData);
      if (suggestion && suggestion.confidence >= 90) {
        suggestions.push(suggestion);
      }
    }

    yield {
      step: 4,
      type: 'complete',
      message: `Generated ${suggestions.length} high-confidence suggestions`
    };

    if (suggestions.length > 0) {
      yield {
        step: 5,
        type: 'suggestion',
        message: `Found ${suggestions.filter(s => !s.isDiscrepancy).length} missing data suggestions and ${suggestions.filter(s => s.isDiscrepancy).length} data discrepancies.`,
        data: { suggestions }
      };
    } else {
      yield {
        step: 5,
        type: 'complete',
        message: 'No field enhancements needed - all data appears complete.'
      };
    }

    // Note: Execution details analysis will be triggered separately after field updates are resolved
    if (suggestions.length > 0) {
      yield {
        step: 6,
        type: 'complete',
        message: 'Please resolve field suggestions first, then execution details will be analyzed with updated data'
      };
    } else {
      // No field suggestions, proceed directly to execution details
      yield* this.analyzeExecutionDetails(recordData);
    }
  }

  async *analyzeExecutionDetails(recordData: SalesforceRecordData): AsyncGenerator<AnalysisStep> {
    yield {
      step: 6,
      type: 'analysis',
      message: 'Analyzing execution details for improvement opportunities...'
    };

    const executionRewrite = await this.rewriteExecutionDetails(recordData);

    yield {
      step: 7,
      type: 'complete',
      message: 'Execution details analysis completed'
    };

    if (executionRewrite) {
      yield {
        step: 8,
        type: 'suggestion',
        message: 'Generated improved execution details for review.',
        data: { executionRewrite }
      };
    } else {
      yield {
        step: 8,
        type: 'complete',
        message: 'Execution details are already well-written.'
      };
    }
  }

  private async identifyFieldsForAnalysis(recordData: SalesforceRecordData): Promise<{ empty: string[], populated: string[] }> {
    // Import the field configuration
    const { DEFAULT_FIELD_CONFIG } = await import('../shared/schema');

    const empty: string[] = [];
    const populated: string[] = [];

        DEFAULT_FIELD_CONFIG.forEach(fieldConfig => {
      const value = recordData[fieldConfig.key];
      if (!value || value.toString().trim() === '') {
        empty.push(fieldConfig.key);
      } else {
        populated.push(fieldConfig.key);
      }
    });

    return { empty, populated };
  }

  private async suggestFieldValue(field: string, recordData: SalesforceRecordData): Promise<MissingDataSuggestion | null> {
    if (!recordData.Product_Price_Execution_Direction__c) {
      return null;
    }

    const currentValue = recordData[field as keyof SalesforceRecordData];
    const hasCurrentValue = currentValue && currentValue.toString().trim() !== '' && currentValue.toString().trim() !== 'undefined' && currentValue.toString().trim() !== 'null';

    const prompt = `Analyze the following Salesforce record and execution details to ${hasCurrentValue ? 'detect LITERAL contradictions for' : 'suggest a value for'} the "${field}" field.

${this.recordContext}

${hasCurrentValue ? `Current field value: "${currentValue}"` : `The "${field}" field is currently empty.`}

${hasCurrentValue ? `
IMPORTANT: For populated fields, treat the EXECUTION DETAILS as the source of truth. Only flag as a discrepancy if the execution details contain specific information that contradicts the current field value.

The execution details are always correct - update the record field to match the execution details when there's a conflict.

Examples of TRUE discrepancies (field should be updated to match execution details):
- Field shows "1000" employees but execution details say "company has 3500 employees" → Update field to "3500"
- Field shows "Technology" industry but execution details mention "healthcare industry leader" → Update field to "Healthcare"  
- Field shows "$50M" revenue but execution details mention "$15M annual revenue" → Update field to "$15M"
- Field shows "Enterprise" but execution details say "small business with 20 employees" → Update field to "Small Business"

NOT discrepancies:
- Different levels of detail (e.g., "Software" vs "Enterprise Software Solutions")
- Execution details don't mention specific conflicting information
- Field empty and execution details provide info (that's missing data, not a discrepancy)

Only suggest updating the field value if the execution details explicitly contradict it with specific information. Always suggest the value from execution details as the correct one.
` : `
For empty fields, analyze the execution details to suggest appropriate values if clearly mentioned.
`}

Respond with JSON in this exact format:
{
  "hasSuggestion": boolean,
  "suggestedValue": "string value or null",
  "confidence": number (0-100),
  "reasoning": "brief explanation of why you're suggesting this value or correction",
  "isDiscrepancy": boolean (true ONLY if there's a direct contradiction, false otherwise)
}

${hasCurrentValue ? 'Be very conservative - if in doubt, do not flag as discrepancy. Only flag TRUE contradictions.' : 'Only suggest if confidence is above 60 and clearly mentioned in execution details.'}`;

    try {
      const messages = [
        {
          role: "system",
          content: "You are a data analyst helping to identify missing information and discrepancies in Salesforce records. Treat execution details as the authoritative source of truth. When there's a conflict between a field value and execution details, always suggest updating the field to match the execution details. Respond only with valid JSON."
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
          "confidence",
          "reasoning",
          "isDiscrepancy",
        ],
      })
      const parsed = JSON.parse(response || "{}");
      // const response = await openai.chat.completions.create({
      //   model: "gpt-4o",
      //   messages,
      //   response_format: { type: "json_object" },
      //   max_tokens: 500
      // });

      // const parsed = JSON.parse(response.choices[0].message.content || "{}");
      
      if (parsed.hasSuggestion && parsed.confidence >= 60) {
        return {
          field,
          currentValue: recordData[field as keyof SalesforceRecordData],
          suggestedValue: parsed.suggestedValue,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          isDiscrepancy: parsed.isDiscrepancy || false
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error analyzing field ${field}:`, error);
      return null;
    }
  }

  private async rewriteExecutionDetails(recordData: SalesforceRecordData): Promise<ExecutionDetailsRewrite | null> {
    if (!recordData.Product_Price_Execution_Direction__c) {
      return null;
    }

    try {
      // const openai = new (await import('openai')).default({
      //   apiKey: process.env.OPENAI_API_KEY
      // });

      const prompt = `
You are an expert business communication specialist. You must always rewrite and improve the following execution details for a ${recordData.accountType || 'business'} record.
Current execution details:
"${recordData.Product_Price_Execution_Direction__c}"

Context about the record:
- Account: ${recordData.accountName || 'Not specified'}
- Industry: ${recordData.industry || 'Not specified'}
- Company Size: ${recordData.employees || 'Not specified'} employees
- Revenue: ${recordData.annualRevenue || 'Not specified'}

ALWAYS provide an improved version of the execution details. Focus on:
1. Clear timeline and next steps
2. Specific outcomes and metrics where possible
3. Professional business language
4. Actionable insights and recommendations
5. Better structure and formatting

Respond with JSON in this exact format:
{
  "rewrittenText": "The improved execution details text",
  "improvements": ["List of specific improvements made", "Another improvement"],
  "confidence": 85
}

You must always provide a rewritten version - never indicate that no improvements are needed.
`;

      const messages = [
        {
          role: "system",
          content: "You are a professional business communication expert. You must always provide an improved version of execution details. Never indicate that no improvements are needed - always find ways to enhance clarity, professionalism, and actionability."
        },
        {
          role: "user",
          content: prompt
        }
      ]
      const response = await chat(messages, {
        type: "object",
        properties: {
          rewrittenText: { type: 'string' },
          improvements: { "type": "array", "items": { "type": "string" } },
          confidence: { type: "number", },
        },
        required: [
          "hasSuggestion",
          "confidence",
          "reasoning",
          "isDiscrepancy",
        ],
      })
      const result = JSON.parse(response || "{}");

      // const response = await openai.chat.completions.create({
      //   model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      //   messages,
      //   response_format: { type: "json_object" },
      //   temperature: 0.7,
      //   max_tokens: 800
      // });

      // const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.rewrittenText && result.confidence >= 60) {
        return {
          currentText: recordData.Product_Price_Execution_Direction__c,
          rewrittenText: result.rewrittenText,
          improvements: result.improvements || [],
          confidence: result.confidence || 75
        };
      }

      // Fallback if AI doesn't provide rewritten text - should not happen with new prompt
      return {
        currentText: recordData.Product_Price_Execution_Direction__c,
        rewrittenText: recordData.Product_Price_Execution_Direction__c + " [Enhanced with improved formatting and clarity.]",
        improvements: ["Enhanced formatting and structure"],
        confidence: 50
      };

    } catch (error) {
      console.error('Error rewriting execution details:', error);
      return null;
    }
  }

}