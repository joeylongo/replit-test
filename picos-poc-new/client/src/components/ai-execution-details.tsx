import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Brain, Download, Share, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesforceRecordData } from "@shared/schema";

interface AIExecutionDetailsProps {
  record: {
    recordId: string;
    recordType: string;
    data: SalesforceRecordData;
  } | null;
  className?: string;
}

interface AISummary {
  summary: string;
  confidenceScore: number;
  processingTime: number;
  tokensUsed: number;
  modelUsed: string;
  generatedAt: Date;
}

export default function AIExecutionDetails({ record, className }: AIExecutionDetailsProps) {
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const { toast } = useToast();

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!record) throw new Error("No record selected");
      
      const response = await apiRequest("POST", "/api/ai/summary", {
        recordId: record.recordId,
        recordData: record.data,
        recordType: record.recordType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiSummary({
        summary: data.summary,
        confidenceScore: data.confidenceScore,
        processingTime: data.processingTime,
        tokensUsed: data.tokensUsed,
        modelUsed: data.modelUsed,
        generatedAt: new Date(data.generatedAt),
      });
      toast({
        title: "Success",
        description: "AI summary generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI summary",
        variant: "destructive",
      });
    },
  });

  const regenerateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!record) throw new Error("No record selected");
      
      const response = await apiRequest("POST", "/api/ai/regenerate", {
        recordId: record.recordId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiSummary({
        summary: data.summary,
        confidenceScore: data.confidenceScore,
        processingTime: data.processingTime,
        tokensUsed: data.tokensUsed,
        modelUsed: data.modelUsed,
        generatedAt: new Date(data.generatedAt),
      });
      toast({
        title: "Success",
        description: "AI summary regenerated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate AI summary",
        variant: "destructive",
      });
    },
  });

  // Auto-generate summary when record changes
  useEffect(() => {
    if (record && !aiSummary) {
      generateSummaryMutation.mutate();
    }
  }, [record]);

  // Reset summary when record changes
  useEffect(() => {
    setAiSummary(null);
  }, [record?.recordId]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const handleExport = () => {
    if (!aiSummary || !record) return;
    
    const content = `Salesforce AI Analysis Report
    
Record ID: ${record.recordId}
Record Type: ${record.recordType}
Generated: ${aiSummary.generatedAt.toLocaleString()}
Model: ${aiSummary.modelUsed}
Confidence: ${aiSummary.confidenceScore}%

${aiSummary.summary}

Processing Details:
- Processing Time: ${aiSummary.processingTime}s
- Tokens Used: ${aiSummary.tokensUsed}
- Fields Analyzed: 15/15
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesforce-ai-summary-${record.recordId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Summary exported successfully",
    });
  };

  const handleShare = () => {
    if (!aiSummary) return;
    
    navigator.clipboard.writeText(aiSummary.summary).then(() => {
      toast({
        title: "Success",
        description: "Summary copied to clipboard",
      });
    });
  };

  const handleScheduleFollowUp = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Schedule follow-up functionality will be available soon",
    });
  };

  const isLoading = generateSummaryMutation.isPending || regenerateSummaryMutation.isPending;

  return (
    <div className={cn("space-y-6", className)}>
      {/* AI Execution Details */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">AI Execution Details</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateSummaryMutation.mutate()}
              disabled={!record || isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Regenerate
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {!record ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Select a record to generate AI summary</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3 text-slate-500">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span>AI generating summary...</span>
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : aiSummary ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-4">
                <Brain className="w-3 h-3" />
                <span>Generated by OpenAI</span>
                <span className="text-slate-300">•</span>
                <span>{formatTimeAgo(aiSummary.generatedAt)}</span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {aiSummary.summary}
                </div>
              </div>
              
              {/* Confidence Score */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Confidence Score</span>
                  <span className="text-xs font-semibold text-success">
                    {aiSummary.confidenceScore}%
                  </span>
                </div>
                <Progress 
                  value={aiSummary.confidenceScore} 
                  className="h-2 bg-slate-200"
                />
              </div>
              
              {/* Processing Details */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-600 mb-3">Processing Details</h4>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Fields Analyzed:</span>
                    <span>15/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{aiSummary.processingTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Used:</span>
                    <span>{aiSummary.modelUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens Used:</span>
                    <span>{aiSummary.tokensUsed}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Failed to generate summary</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => generateSummaryMutation.mutate()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Panel */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
            disabled={!aiSummary}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Summary
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleShare}
            disabled={!aiSummary}
          >
            <Share className="w-4 h-4 mr-2" />
            Share Record
          </Button>
          <Button
            className="w-full justify-start bg-primary text-white hover:bg-blue-700"
            onClick={handleScheduleFollowUp}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Schedule Follow-up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
