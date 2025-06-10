import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const salesforceRecords = pgTable("salesforce_records", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  recordType: text("record_type").notNull(),
  data: text("data").notNull(), // JSON string of record data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiSummaries = pgTable("ai_summaries", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull(),
  summary: text("summary").notNull(),
  confidenceScore: numeric("confidence_score"),
  processingTime: numeric("processing_time"),
  tokensUsed: integer("tokens_used"),
  modelUsed: text("model_used").default("gpt-4o"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSalesforceRecordSchema = createInsertSchema(salesforceRecords).pick({
  recordId: true,
  recordType: true,
  data: true,
});

export const insertAiSummarySchema = createInsertSchema(aiSummaries).pick({
  recordId: true,
  summary: true,
  confidenceScore: true,
  processingTime: true,
  tokensUsed: true,
  modelUsed: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSalesforceRecord = z.infer<typeof insertSalesforceRecordSchema>;
export type SalesforceRecord = typeof salesforceRecords.$inferSelect;
export type InsertAiSummary = z.infer<typeof insertAiSummarySchema>;
export type AiSummary = typeof aiSummaries.$inferSelect;

// Salesforce record data structure - 16 fields (including execution details)
export const salesforceRecordDataSchema = z.object({
  Activity_Name__c: z.string().optional(),
  Id: z.string().optional(),
  Activity_type__c: z.string().optional(),
  Pricing__c: z.string().optional(),
  Sell_Enablers__c: z.string().optional(),
  Start_Date__c: z.string().optional(),
  End_Date__c: z.string().optional(),
  Get_Quantity__c: z.string().optional(),
  Promo_Offer__c: z.string().optional(),
  EDV__c: z.string().optional(),
  Channel_Picklist__c: z.string().optional(),
  POI_Picklist__c: z.string().optional(),
  Save_Quantity__c: z.string().optional(),
  Price_Type__c: z.string().optional(),
  Purchase_Quantity__c: z.string().optional(),
  Market_Street_Challenge__c: z.string().optional(),
  Late_break__c: z.string().optional(),
  Promo_Type__c: z.string().optional(),
  Of_Stores__c: z.string().optional(),
  Package_Detail__c: z.string().optional(),
  Packaging_Comments__c: z.string().optional(),
  CCNA_Marketing_or_Innovation_Program__c: z.string().optional(),
  Product_Price_Execution_Direction__c: z.string().optional(),
});

export type SalesforceRecordData = z.infer<typeof salesforceRecordDataSchema>;

// Field configuration for dynamic record details display
export interface FieldConfig {
  key: keyof SalesforceRecordData;
  label: string;
  type?: 'text' | 'email' | 'phone' | 'url' | 'number' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  hide?: boolean;
}

export const FIELD_PROMPT_CONFIG: Record<string, {
  label?: string;
  options?: string[];
  improvementStyle: 'literal' | 'suggestive' | 'enhance';
  customPrompt?: string;
  confidenceThreshold?: number;
}> = {
  POI_Picklist__c: {
    improvementStyle: 'literal',
    customPrompt: `Based on the execution details, what is the most accurate in-store display location (POI) for this activity? 
      Only choose a value from the allowed list. This field describes where the display or product is located (e.g., Front of Store,
      End Cap, Beverage Aisle, etc.). If the execution details are ambiguous, do not make assumptions. If the location is clearly
      stated (e.g., "place in perimeter" or "checkout display"), match to the closest POI value.`,
    options: [
      'Bakery',
      'Beverage Aisle',
      'Checkout',
      'Deli - Prepared & Quick Prep Meals',
      'End Cap',
      'Front of Store/Lobby',
      'Frozen',
      'Meat/Seafood',
      'Perimeter',
      'Pharmacy',
      'Pharmacy',
      'Produce',
      'Seasonal',
      'Wine Adjacency'
    ],
    confidenceThreshold: 90
  },
  Activity_type__c: {
    improvementStyle: 'literal',
    customPrompt: `Based on the execution details, what kind of activity is being described?
      Choose only from: Execute, Sell, Hunt, Verify.
        - Use "Execute" if the activity refers to carrying out a HQ directive or display setup or if the current value is "Headquarter Mandated (HQM)" or something very similar.
        - Use "Sell" if the activity is about convincing the store to take action or order product or if the current value is "Local Sell In (LSI)" or something very similar.
        - Use "Hunt" if it's exploratory or chasing whitespace.
        - Use "Verify" if it involves checking whether something was done.
      If the current value contradicts this logic, suggest the correct one. Otherwise, do not suggest any change.`,
    options: ['Execute', 'Sell', 'Hunt', 'Verify'],
    confidenceThreshold: 90
  },
  Promo_Type__c: {
    improvementStyle: 'literal',
    customPrompt: `Review the execution details and determine the type of promotion being run.
      Choose from: Buy Get, Buy Save, Each, Must Buy, Other, V Simple, N/A.
      Example mappings:
        - "Buy 2 Get 1 Free" → Buy Get
        - "2/$4" or "$5.99 for 12pk" → Buy Save
        - "Each at $0.99" → Each
        - "Buy 3 or more for a deal" → Must Buy
      Be accurate — if no pricing or mechanics are described, return N/A. Only suggest a value if you are confident based on the promo format.`,
    options: ['Buy Get', 'Buy Save', 'Each', 'Must Buy', 'Other', 'V Simple', 'N/A'],
    confidenceThreshold: 90
  },
  Pricing__c: {
    improvementStyle: 'suggestive',
    customPrompt: `Extract the price being promoted in this activity, if mentioned.
      This could be:
        - A single item price (e.g., "$1.99")
        - A bundle price (e.g., "2 for $4", "3/$10")
        - A tag like "TPR" or "EDV" if that's the only reference
      If pricing is mentioned in multiple ways, use the clearest and most consumer-facing one. If no pricing is mentioned, skip this field. Return null if nothing price-related is present.`,
    confidenceThreshold: 90
  },
  Package_Detail__c: {
    improvementStyle: 'suggestive',
    customPrompt: `Based on the execution details, extract the product packaging format being referenced.
      Examples:
        - "12-pack Core CAN"
        - "6-pack Half Liter"
        - "20oz PET"
        - "8pk mini cans"
      Do NOT include price or location. Only describe the package being featured. If multiple packages are mentioned,
      choose the most prominent. If no packaging detail is clear, return null.`,
    confidenceThreshold: 90
  },
  Activity_Name__c: {
    improvementStyle: 'suggestive',
    customPrompt: `Suggest a concise, action-oriented name for this activity based on the execution details.
      Good names summarize the key action, brand, or product — not the entire sentence.
      Examples:
        - "Fanta Halloween Display"
        - "Smartwater Summer Promo"
        - "Coke Mini Can Perimeter Sell-In"
      Avoid vague names like "Display" or "Promo." Use strong nouns, and include key brand/package terms if available.
      Keep it under 6–8 words. Only suggest a name if the current one is missing or clearly off-topic.`,
    confidenceThreshold: 90
  }
};


// Default field configuration - customize this for your use case
export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
  { key: 'Activity_Name__c', label: 'Activity Name', type: 'text', required: true },
  { key: 'Id', label: 'Id', type: 'text' },
  { key: 'Activity_type__c', label: 'Activity Type', type: 'text',  },
  { key: 'Pricing__c', label: 'Pricing', type: 'text' },
  { key: 'Sell_Enablers__c', label: 'Sell Enablers', type: 'text' },
  { key: 'Start_Date__c', label: 'Start Date', type: 'date' },
  { key: 'End_Date__c', label: 'End Date', type: 'date' },
  { key: 'Get_Quantity__c', label: 'Get Quantity', type: 'text' },
  { key: 'Promo_Offer__c', label: 'Promo Offer', type: 'text' },
  { key: 'EDV__c', label: 'EDV', type: 'text' },
  { key: 'Channel_Picklist__c', label: 'Channel', type: 'text' },
  { key: 'POI_Picklist__c', label: 'POI', type: 'text'  },
  { key: 'Save_Quantity__c', label: 'Save', type: 'text' },
  { key: 'Price_Type__c', label: 'Price Type', type: 'text' },
  { key: 'Purchase_Quantity__c', label: 'Purchase Quantity', type: 'text' },
  { key: 'Market_Street_Challenge__c', label: 'Market Street Challenge', type: 'text' },
  { key: 'Late_break__c', label: 'Late-break', type: 'text' },
  { key: 'Promo_Type__c', label: 'Promo Type', type: 'text', 
},
  { key: 'Of_Stores__c', label: '% Of Stores', type: 'text' },
  { key: 'Package_Detail__c', label: 'Package Detail', type: 'text' },
  { key: 'Packaging_Comments__c', label: 'Promotion Summary', type: 'text' },
  { key: 'Product_Price_Execution_Direction__c', label: 'Product_Price_Execution_Direction__c', type: 'text', hide: true },
  { key: 'CCNA_Marketing_or_Innovation_Program__c', label: 'CCNA_Marketing_or_Innovation_Program__c', type: 'text' },

  // ExecutionDetails is handled separately in the AI component
];

export const FIELDS_TO_ANALYZE = [
  "POI_Picklist__c",
  "Activity_type__c",
  "Promo_Type__c",
  "Pricing__c",
  "Package_Detail__c",
  "Activity_Name__c"
]