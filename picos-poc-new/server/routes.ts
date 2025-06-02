import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertSalesforceRecordSchema, salesforceRecordDataSchema } from "@shared/schema";
import { RAGWorkflow } from "./rag-workflow";
import picosSamples from './100-picos-samples.json'
const samples = picosSamples.map(s => {
      return {
        id: s.Id,
        name: s.Activity_Name__c,
        type: 'Activity',
        data: s
      }
    })

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Sample records endpoint
  app.get("/api/samples", async (req, res) => {
    // [
    //   {
    //     id: "001XX0000003DHfYAM",
    //     name: "Acme Corporation - Account",
    //     type: "Account",
    //     data: {
    //       accountName: "Acme Corporation",
    //       accountNumber: "ACC-12345",
    //       accountType: "Customer - Direct",
    //       industry: "Technology",
    //       website: "www.acme-corp.com",
    //       phone: "(555) 123-4567",
    //       employees: "1,500",
    //       annualRevenue: "$50,000,000",
    //       creditRating: "Excellent",
    //       priority: "High",
    //       lastActivity: "2024-01-15",
    //       owner: "John Smith",
    //       territory: "West Coast",
    //       sla: "Platinum",
    //       createdDate: "2023-06-15",
    //       executionDetails: "Client requested comprehensive technology audit and implementation roadmap. Key focus areas include cloud migration strategy, security framework upgrade, and staff training programs. Timeline: Q2-Q3 2024. Budget approved for $2.5M investment."
    //     }
    //   },
    //   {
    //     id: "006XX0000004C9UYAU",
    //     name: "Q4 Enterprise Deal - Activity",
    //     type: "Activity",
    //     data: {
    //       accountName: "Global Solutions Inc",
    //       accountNumber: "OPP-98765",
    //       accountType: "New Business",
    //       industry: "Manufacturing",
    //       website: "www.globalsolutions.com",
    //       phone: "(555) 987-6543",
    //       employees: "5,000",
    //       annualRevenue: "$125,000,000",
    //       creditRating: "Good",
    //       priority: "High",
    //       lastActivity: "2024-01-20",
    //       owner: "Sarah Johnson",
    //       territory: "Enterprise",
    //       sla: "Gold",
    //       createdDate: "2023-10-01",
    //       executionDetails: "Quarterly review meeting scheduled for next Tuesday. Need to present updated manufacturing efficiency metrics and discuss potential automation opportunities. Prepare cost analysis for robotic integration project. Follow up on pending contract amendments."
    //     }
    //   },
    //   {
    //     id: "003XX0000004DFfYAM",
    //     name: "Jane Doe - Contact",
    //     type: "Contact",
    //     data: {
    //       accountName: "Jane Doe",
    //       accountNumber: "CON-11111",
    //       accountType: "Decision Maker",
    //       industry: "Healthcare",
    //       website: "jane.doe@healthtech.com",
    //       phone: "(555) 456-7890",
    //       employees: "250",
    //       annualRevenue: "$15,000,000",
    //       creditRating: "Good",
    //       priority: "Medium",
    //       lastActivity: "2024-01-10",
    //       owner: "Mike Wilson",
    //       territory: "Healthcare",
    //       sla: "Standard",
    //       createdDate: "2023-08-20",
    //       executionDetails: "Initial consultation completed. Jane expressed interest in our healthcare compliance software. Next steps: schedule demo session, prepare custom pricing proposal, and coordinate with legal team for contract review. Target close date: end of Q1."
    //     }
    //   }
    // ];
    
    res.json(samples);
  });

  // Get record by ID
  app.get("/api/record/:id", async (req, res) => {
    const { id } = req.params;
    
    const record = samples.find(s => s.id === id);
    
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    res.json(record);
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for streaming RAG workflow
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'analyze_record') {
          const { recordData } = data;
          const workflow = new RAGWorkflow();
          
          // Stream analysis steps to client
          for await (const step of workflow.analyzeRecordForMissingData(recordData)) {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({
                type: 'analysis_step',
                step: step.step,
                stepType: step.type,
                message: step.message,
                data: step.data
              }));
              
              // Add delay between steps for better UX
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else if (data.type === 'analyze_execution_details') {
          const { recordData } = data;
          const workflow = new RAGWorkflow();
          
          // Stream execution details analysis steps to client
          for await (const step of workflow.analyzeExecutionDetails(recordData)) {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({
                type: 'analysis_step',
                step: step.step,
                stepType: step.type,
                message: step.message,
                data: step.data
              }));
              
              // Add delay between steps for better UX
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process request'
          }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}