import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SalesforceRecordData } from "@shared/schema";

interface RecordSelectorProps {
  onRecordSelected: (record: {
    id: string;
    name: string;
    type: string;
    data: SalesforceRecordData;
  }) => void;
  onError: (error: string) => void;
}

export default function RecordSelector({ onRecordSelected, onError }: RecordSelectorProps) {
  const { toast } = useToast();

  const { data: samples = [] } = useQuery({
    queryKey: ["/api/samples"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/samples");
      return response.json();
    },
  });

  const fetchRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("GET", `/api/record/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      onRecordSelected(data);
      toast({
        title: "Success",
        description: "Record loaded successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to load record";
      onError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSampleSelect = (value: string) => {
    if (value) {
      fetchRecordMutation.mutate(value);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Select Sample Record
        </h2>
        
        <div className="max-w-md">
          <Label htmlFor="sampleRecords" className="text-sm font-medium text-slate-700 mb-2">
            Choose a sample record to load
          </Label>
          <Select onValueChange={handleSampleSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a sample record" />
            </SelectTrigger>
            <SelectContent>
              {samples.map((record: any) => (
                <SelectItem key={record.id} value={record.id}>
                  {record.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
