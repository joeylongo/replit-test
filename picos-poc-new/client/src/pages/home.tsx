import { useState } from "react";
import Header from "@/components/header";
import RecordSelector from "@/components/record-selector";
import RecordDetails from "@/components/record-details";
import ExecutionDetails from "@/components/execution-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import type { SalesforceRecordData } from "@shared/schema";

export default function Home() {
  const [selectedRecord, setSelectedRecord] = useState<{
    id: string;
    name: string;
    type: string;
    data: SalesforceRecordData;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const fieldGroups = [
  {
    title: "Activity Types and Dates",
    fields: ["Activity_Name__c", "Activity_type__c", "Id", "Sell_Enablers__c", "Start_Date__c", "Of_Stores__c", "End_Date__c", "Price_Type__c"]
  },
  {
    title: "Activity Details",
    fields: ["Promo_Type__c", "Purchase_Quantity__c", "Pricing__c", "Get_Quantity__c", "EDV__c", "Save_Quantity__c", "Channel_Picklist__c", "Promo_Offer__c", "POI_Picklist__c", "Package_Detail__c", "Packaging_Comments__c", "CCNA_Marketing_or_Innovation_Program__c"]
  }
];

  const handleRecordSelected = (record: {
    id: string;
    name: string;
    type: string;
    data: SalesforceRecordData;
  }) => {
    setSelectedRecord(record);
    setError("");
  };

  const handleRecordUpdate = (updatedData: SalesforceRecordData) => {
    if (selectedRecord) {
      setSelectedRecord({
        ...selectedRecord,
        data: updatedData
      });
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSelectedRecord(null);
  };



  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* max-w-10xl mx-auto */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <RecordSelector 
          onRecordSelected={handleRecordSelected}
          onError={handleError}
        />
        
        {error && (
          <Alert className="mb-8 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}
{/* :grid-cols-xl2 */}
        <div className="grid grid-cols-1">
          <RecordDetails 
            record={selectedRecord}
            className="xl:col-span-2"
            onRecordUpdate={handleRecordUpdate}
            fieldGroups={fieldGroups}
            onAnalyzeActivity={() => setShowExecutionModal(true)}
          />

          {selectedRecord && (
            <Dialog open={showExecutionModal} onOpenChange={setShowExecutionModal}>
              <DialogTrigger asChild>
                
                {/* <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowExecutionModal(true)}
                >
                  Analyze Activity
                </button> */}
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ExecutionDetails
                  record={selectedRecord}
                  onRecordUpdate={handleRecordUpdate}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
