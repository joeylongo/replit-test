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

// Default field configuration - customize this for your use case
export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
  { key: 'Activity_Name__c', label: 'Activity Name', type: 'text', required: true },
  { key: 'Id', label: 'Id', type: 'text' },
  { key: 'Activity_type__c', label: 'Activity Type', type: 'text' },
  { key: 'Pricing__c', label: 'Pricing', type: 'text' },
  { key: 'Sell_Enablers__c', label: 'Sell Enablers', type: 'text' },
  { key: 'Start_Date__c', label: 'Start Date', type: 'date' },
  { key: 'End_Date__c', label: 'End Date', type: 'date' },
  { key: 'Get_Quantity__c', label: 'Get Quantity', type: 'text' },
  { key: 'Promo_Offer__c', label: 'Promo Offer', type: 'text' },
  { key: 'EDV__c', label: 'EDV', type: 'text' },
  { key: 'Channel_Picklist__c', label: 'Channel', type: 'text' },
  { key: 'POI_Picklist__c', label: 'POI', type: 'text' },
  { key: 'Save_Quantity__c', label: 'Save', type: 'text' },
  { key: 'Price_Type__c', label: 'Price Type', type: 'text' },
  { key: 'Purchase_Quantity__c', label: 'Purchase Quantity', type: 'text' },
  { key: 'Market_Street_Challenge__c', label: 'Market Street Challenge', type: 'text' },
  { key: 'Late_break__c', label: 'Late-break', type: 'text' },
  { key: 'Promo_Type__c', label: 'Promo Type', type: 'text' },
  { key: 'Of_Stores__c', label: '% Of Stores', type: 'text' },
  { key: 'Package_Detail__c', label: 'Package Detail', type: 'text' },
  { key: 'Packaging_Comments__c', label: 'Promotion Summary', type: 'text' },
  { key: 'Product_Price_Execution_Direction__c', label: 'Product_Price_Execution_Direction__c', type: 'text', hide: true },
  { key: 'CCNA_Marketing_or_Innovation_Program__c', label: 'CCNA_Marketing_or_Innovation_Program__c', type: 'text' },

  // ExecutionDetails is handled separately in the AI component
];
