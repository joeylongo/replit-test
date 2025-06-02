// Salesforce API utilities and types
export interface SalesforceConnectionConfig {
  loginUrl?: string;
  instanceUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  securityToken?: string;
}

export interface SalesforceRecord {
  Id: string;
  [key: string]: any;
}

export interface SalesforceQueryResult {
  totalSize: number;
  done: boolean;
  records: SalesforceRecord[];
}

// Salesforce record type prefixes
export const RECORD_TYPE_PREFIXES = {
  ACCOUNT: '001',
  CONTACT: '003', 
  OPPORTUNITY: '006',
  LEAD: '00Q',
  CASE: '500',
  TASK: '00T',
  EVENT: '00U',
} as const;

export function getRecordTypeFromId(recordId: string): string {
  const prefix = recordId.substring(0, 3);
  
  switch (prefix) {
    case RECORD_TYPE_PREFIXES.ACCOUNT:
      return 'Account';
    case RECORD_TYPE_PREFIXES.CONTACT:
      return 'Contact';
    case RECORD_TYPE_PREFIXES.OPPORTUNITY:
      return 'Opportunity';
    case RECORD_TYPE_PREFIXES.LEAD:
      return 'Lead';
    case RECORD_TYPE_PREFIXES.CASE:
      return 'Case';
    case RECORD_TYPE_PREFIXES.TASK:
      return 'Task';
    case RECORD_TYPE_PREFIXES.EVENT:
      return 'Event';
    default:
      return 'Unknown';
  }
}

export function validateSalesforceId(recordId: string): boolean {
  // Salesforce IDs are either 15 or 18 characters
  return /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(recordId);
}

export function getSalesforceRecordUrl(instanceUrl: string, recordId: string): string {
  return `${instanceUrl}/${recordId}`;
}

// Common SOQL queries for different record types
export const SOQL_QUERIES = {
  ACCOUNT: `
    SELECT Id, Name, AccountNumber, Type, Industry, Website, Phone, 
           NumberOfEmployees, AnnualRevenue, Rating, CustomerPriority__c,
           LastActivityDate, OwnerId, Owner.Name, Territory__c, SLA__c,
           CreatedDate, BillingStreet, BillingCity, BillingState, 
           BillingPostalCode, BillingCountry
    FROM Account 
    WHERE Id = :recordId
  `,
  OPPORTUNITY: `
    SELECT Id, Name, AccountId, Account.Name, StageName, Amount, 
           Probability, CloseDate, Type, LeadSource, OwnerId, Owner.Name,
           CreatedDate, LastActivityDate, LastModifiedDate,
           Account.Industry, Account.Website, Account.Phone,
           Account.NumberOfEmployees, Account.AnnualRevenue, Account.Rating,
           Account.Territory__c
    FROM Opportunity 
    WHERE Id = :recordId
  `,
  CONTACT: `
    SELECT Id, FirstName, LastName, Email, Phone, Title, Department,
           AccountId, Account.Name, MailingStreet, MailingCity, 
           MailingState, MailingPostalCode, MailingCountry, 
           CreatedDate, LastActivityDate, OwnerId, Owner.Name,
           Account.Industry, Account.NumberOfEmployees, Account.AnnualRevenue,
           Account.Rating, Account.Territory__c
    FROM Contact 
    WHERE Id = :recordId
  `,
};
