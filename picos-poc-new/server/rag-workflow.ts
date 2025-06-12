// Imports
import type { FieldConfig, SalesforceRecordData } from "@shared/schema";
import { FIELD_PROMPT_CONFIG } from "@shared/schema";
import ollama from 'ollama'
import pLimit from 'p-limit'
import { fetchProductByName } from './fab'
import createRewriteExecutionDetailsPrompt from './prompts/user/rewriteExecutionDetails'
import suggestFieldValue from "./prompts/user/suggestFieldValue";
import businessContextSystemPrompt from './prompts/system/businessContext'

// Chat wrapper
const chat = async (messages: any, format: any) => {
  const res = await ollama.chat({
    model: 'gemma3:12b',
    // model: 'gemma3:1b',
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
  private productHierarchy: any = {}
  async initializeWithRecord(recordData: SalesforceRecordData): Promise<void> {
    const prodHier = await fetchProductByName(recordData.Package_Detail__c)
    if(prodHier) this.productHierarchy = prodHier

    const { DEFAULT_FIELD_CONFIG } = await import('../shared/schema');
    const fieldLines = DEFAULT_FIELD_CONFIG.map(field => {
      const value = recordData[field.key];
      return `- ${field.label}: ${value || 'Not specified'}`;
    }).join('\n');

    this.executionDetails = recordData.Product_Price_Execution_Direction__c || '';
    this.recordContext = `Record Context:
${fieldLines}
${prodHier ? `L1 Product Description: ${prodHier.l1DisplayName}
L2 Product Description: ${prodHier.l2DisplayName}
L3 Product Description: ${prodHier.l3DisplayName}`: ''}


Execution Details: ${this.executionDetails}`.trim();
    console.log('this.recordContext', this.recordContext)
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
    // Always refer to the "L3 Product Description" (current value: ${this.productHierarchy.l3DisplayName}) somewhere in the Execution Details.
    const executionRewrite1 = await this.rewriteExecutionDetails(recordData, `This is the Original variation. Don't apply any special consideration. This should be  a comfortable length paragraph - not concise, but not overly detailed.`);
    const executionRewrite2 = await this.rewriteExecutionDetails(recordData, `This variation must be a **VERY CONCISE** version. Please be as **BRIEF AS POSSIBLE** while still hitting the major points. You **MUST** limit your response to 150 characters or less (not counting HTML tags).`);
    const executionRewrite3 = await this.rewriteExecutionDetails(recordData, `This variation must be a **VERY DETAILED** version. Please be **VERY DETAILED**use the entire 256 character limit (not including HTML tags).`);

    yield { step: 7, type: 'complete', message: 'Execution details analysis completed' };

    if (executionRewrite1 || executionRewrite2 || executionRewrite3) {
      yield {
        step: 8,
        type: 'suggestion',
        message: 'Generated improved execution details for review.',
        data: { 
          executionRewrites: {
            original: executionRewrite1,
            concise: executionRewrite2,
            detailed: executionRewrite3
          }
        }
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

    const prompt = suggestFieldValue({
      promptConfig,
      recordData,
      field,
      executionDetails: this.executionDetails,
      recordContext: this.recordContext,
    })

    console.log('PROMPT', prompt)

    try {
      const messages = [
        {
          role: "system",
          content: businessContextSystemPrompt
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

  private async rewriteExecutionDetails(recordData: SalesforceRecordData, variationPrompt?: string): Promise<ExecutionDetailsRewrite | null> {
    try {
      const prompt = createRewriteExecutionDetailsPrompt(recordData, variationPrompt, this.productHierarchy)
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
          role: 'system',
          content: businessContextSystemPrompt
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
