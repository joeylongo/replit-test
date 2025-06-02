import { users, salesforceRecords, aiSummaries, type User, type InsertUser, type SalesforceRecord, type InsertSalesforceRecord, type AiSummary, type InsertAiSummary } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getSalesforceRecord(recordId: string): Promise<SalesforceRecord | undefined>;
  createSalesforceRecord(record: InsertSalesforceRecord): Promise<SalesforceRecord>;
  updateSalesforceRecord(recordId: string, data: string): Promise<SalesforceRecord | undefined>;
  
  getAiSummary(recordId: string): Promise<AiSummary | undefined>;
  createAiSummary(summary: InsertAiSummary): Promise<AiSummary>;
  updateAiSummary(recordId: string, summary: Partial<InsertAiSummary>): Promise<AiSummary | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private salesforceRecords: Map<string, SalesforceRecord>;
  private aiSummaries: Map<string, AiSummary>;
  private currentUserId: number;
  private currentRecordId: number;
  private currentSummaryId: number;

  constructor() {
    this.users = new Map();
    this.salesforceRecords = new Map();
    this.aiSummaries = new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
    this.currentSummaryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSalesforceRecord(recordId: string): Promise<SalesforceRecord | undefined> {
    return this.salesforceRecords.get(recordId);
  }

  async createSalesforceRecord(insertRecord: InsertSalesforceRecord): Promise<SalesforceRecord> {
    const id = this.currentRecordId++;
    const now = new Date();
    const record: SalesforceRecord = {
      id,
      ...insertRecord,
      createdAt: now,
      updatedAt: now,
    };
    this.salesforceRecords.set(insertRecord.recordId, record);
    return record;
  }

  async updateSalesforceRecord(recordId: string, data: string): Promise<SalesforceRecord | undefined> {
    const record = this.salesforceRecords.get(recordId);
    if (record) {
      const updatedRecord = { ...record, data, updatedAt: new Date() };
      this.salesforceRecords.set(recordId, updatedRecord);
      return updatedRecord;
    }
    return undefined;
  }

  async getAiSummary(recordId: string): Promise<AiSummary | undefined> {
    return this.aiSummaries.get(recordId);
  }

  async createAiSummary(insertSummary: InsertAiSummary): Promise<AiSummary> {
    const id = this.currentSummaryId++;
    const summary: AiSummary = {
      id,
      ...insertSummary,
      createdAt: new Date(),
    };
    this.aiSummaries.set(insertSummary.recordId, summary);
    return summary;
  }

  async updateAiSummary(recordId: string, summaryUpdate: Partial<InsertAiSummary>): Promise<AiSummary | undefined> {
    const summary = this.aiSummaries.get(recordId);
    if (summary) {
      const updatedSummary = { ...summary, ...summaryUpdate };
      this.aiSummaries.set(recordId, updatedSummary);
      return updatedSummary;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
