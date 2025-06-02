import { useState } from "react";
import Header from "@/components/header";
import RecordSelector from "@/components/record-selector";
import RecordDetails from "@/components/record-details";
import ExecutionDetails from "@/components/execution-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <RecordDetails 
            record={selectedRecord}
            className="xl:col-span-2"
            onRecordUpdate={handleRecordUpdate}
          />
          
          <ExecutionDetails 
            record={selectedRecord}
            className="xl:col-span-1"
            onRecordUpdate={handleRecordUpdate}
          />
        </div>
      </div>
    </div>
  );
}
