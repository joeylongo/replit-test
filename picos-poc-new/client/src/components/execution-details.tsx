import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Zap, CheckCircle, AlertCircle, RefreshCw, X, ChevronDown, ChevronRight, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { SalesforceRecordData } from "@shared/schema";

interface ExecutionDetailsProps {
  record: {
    id: string;
    name: string;
    type: string;
    data: SalesforceRecordData;
  } | null;
  className?: string;
  onRecordUpdate?: (updatedData: SalesforceRecordData) => void;
}

interface AnalysisStep {
  step: number;
  type: 'analysis' | 'suggestion' | 'complete';
  message: string;
  data?: any;
}

interface MissingDataSuggestion {
  field: string;
  currentValue: string | undefined;
  suggestedValue: string;
  confidence: number;
  reasoning: string;
  isDiscrepancy: boolean; // true if correcting existing data, false if filling empty field
}

interface ExecutionDetailsRewrite {
  currentText: string;
  rewrittenText: string;
  improvements: string[];
  confidence: number;
}

interface ExecutionDetailsOption {
  id: number;
  text: string;
  improvements: string[];
  confidence: number;
  isRejected: boolean;
}

export default function ExecutionDetails({ record, className, onRecordUpdate }: ExecutionDetailsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [suggestions, setSuggestions] = useState<MissingDataSuggestion[]>([]);
  const [executionRewrite, setExecutionRewrite] = useState<ExecutionDetailsRewrite | null>(null);
  const [executionOptions, setExecutionOptions] = useState<ExecutionDetailsOption[]>([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [error, setError] = useState<string>("");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Helper function to generate text variations
  const generateVariation = (baseText: string, style: 'concise' | 'detailed'): string => {
    if (style === 'concise') {
      // Create a more concise version by shortening sentences
      return baseText
        .split('. ')
        .map(sentence => {
          if (sentence.length > 50) {
            const words = sentence.split(' ');
            return words.slice(0, Math.ceil(words.length * 0.7)).join(' ');
          }
          return sentence;
        })
        .join('. ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      // Create a more detailed version by expanding key points
      return baseText
        .replace(/\b(completed|finished|done)\b/gi, 'successfully completed')
        .replace(/\b(analyzed|reviewed)\b/gi, 'thoroughly analyzed')
        .replace(/\b(identified|found)\b/gi, 'clearly identified')
        .replace(/\b(next steps?)\b/gi, 'recommended next steps and action items');
    }
  };

  useEffect(() => {
    // Clean up WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const clearAnalysis = () => {
    setAnalysisSteps([]);
    setSuggestions([]);
    setExecutionRewrite(null);
    setExecutionOptions([]);
    setShowExecutionModal(false);
    setError("");
    setCompletedSteps(new Set());
    setIsHistoryExpanded(false);
  };

  const triggerExecutionDetailsAnalysis = (recordData: SalesforceRecordData) => {
    // Set analyzing state to show progress
    setIsAnalyzing(true);
    setError("");
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({
          type: 'analyze_execution_details',
          recordData: recordData
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'analysis_step') {
          const step = {
            step: data.step,
            type: data.stepType,
            message: data.message,
            data: data.data
          };
          
          setAnalysisSteps(prev => [...prev, step]);
          
          // Track completed steps
          if (data.stepType === 'complete') {
            setCompletedSteps(prev => new Set([...prev, step.step]));
          }
          
          if (data.stepType === 'suggestion' && data.data?.executionRewrite) {
            // Convert single rewrite into 3 options with variations
            const baseRewrite = data.data.executionRewrite;
            const options: ExecutionDetailsOption[] = [
              {
                id: 1,
                text: baseRewrite.rewrittenText,
                improvements: baseRewrite.improvements,
                confidence: baseRewrite.confidence,
                isRejected: false
              },
              {
                id: 2,
                text: generateVariation(baseRewrite.rewrittenText, 'concise'),
                improvements: [...baseRewrite.improvements, 'More concise presentation'],
                confidence: Math.max(0.6, baseRewrite.confidence - 0.1),
                isRejected: false
              },
              {
                id: 3,
                text: generateVariation(baseRewrite.rewrittenText, 'detailed'),
                improvements: [...baseRewrite.improvements, 'Enhanced detail and context'],
                confidence: Math.max(0.6, baseRewrite.confidence - 0.05),
                isRejected: false
              }
            ];
            setExecutionOptions(options);
            setShowExecutionModal(true);
            setIsAnalyzing(false);
            // Clear analysis steps after completion
            setTimeout(() => {
              setAnalysisSteps([]);
            }, 5000);
            toast({
              title: "Analysis Complete",
              description: "Execution details analysis finished successfully",
            });
          }
        } else if (data.type === 'error') {
          setError(data.message);
          setIsAnalyzing(false);
          toast({
            title: "Analysis Error",
            description: "Failed to analyze execution details",
          });
        }
      };
    } else {
      wsRef.current.send(JSON.stringify({
        type: 'analyze_execution_details',
        recordData: recordData
      }));
    }
  };

  const applySuggestion = (suggestion: MissingDataSuggestion) => {
    if (record && onRecordUpdate) {
      // Clean up the suggested value to extract relevant data
      let cleanValue = suggestion.suggestedValue;
      
      // For numeric fields, extract just the number
      if (['employees', 'annualRevenue'].includes(suggestion.field)) {
        const numberMatch = cleanValue.match(/[\d,]+/);
        if (numberMatch) {
          cleanValue = numberMatch[0].replace(/,/g, '');
        }
      }
      
      // For phone numbers, extract just the digits and format
      if (suggestion.field === 'phone') {
        const phoneMatch = cleanValue.match(/[\d\-\(\)\s\+\.]+/);
        if (phoneMatch) {
          cleanValue = phoneMatch[0].trim();
        }
      }
      
      // For URLs, ensure it's just the domain
      if (suggestion.field === 'website') {
        const urlMatch = cleanValue.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})/);
        if (urlMatch) {
          cleanValue = urlMatch[1];
        }
      }
      
      // For other text fields, clean up extra descriptive text
      if (['industry', 'accountType', 'territory', 'priority', 'creditRating', 'sla'].includes(suggestion.field)) {
        // Remove common prefixes and keep the core value
        cleanValue = cleanValue
          .replace(/^(is|are|was|were)\s+/i, '')
          .replace(/^(a|an|the)\s+/i, '')
          .replace(/\s+(company|business|organization|firm)$/i, '')
          .trim();
      }
      
      const updatedData = {
        ...record.data,
        [suggestion.field]: cleanValue
      };
      onRecordUpdate(updatedData);
      
      // Remove this suggestion from the list
      setSuggestions(prev => {
        const newSuggestions = prev.filter(s => s.field !== suggestion.field);
        
        // If this was the last suggestion, trigger execution details analysis with updated data
        if (newSuggestions.length === 0) {
          setTimeout(() => {
            triggerExecutionDetailsAnalysis(updatedData);
          }, 1000);
        }
        
        return newSuggestions;
      });
      
      toast({
        title: "Field Updated",
        description: `${suggestion.field.charAt(0).toUpperCase() + suggestion.field.slice(1)} has been updated`,
      });
    }
  };

  const dismissSuggestion = (field: string) => {
    setSuggestions(prev => {
      const newSuggestions = prev.filter(s => s.field !== field);
      
      // If this was the last suggestion, trigger execution details analysis
      if (newSuggestions.length === 0 && record) {
        setTimeout(() => {
          triggerExecutionDetailsAnalysis(record.data);
        }, 1000);
      }
      
      return newSuggestions;
    });
    toast({
      title: "Suggestion Dismissed",
      description: "Suggestion has been removed",
    });
  };

  const applyExecutionRewrite = () => {
    if (record && onRecordUpdate && executionRewrite) {
      const updatedData = {
        ...record.data,
        Product_Price_Execution_Direction__c: executionRewrite.rewrittenText
      };
      onRecordUpdate(updatedData);
      setExecutionRewrite(null);
      
      toast({
        title: "Execution Details Updated",
        description: "The improved execution details have been applied",
      });
    }
  };

  const dismissExecutionRewrite = () => {
    setExecutionRewrite(null);
    toast({
      title: "Rewrite Dismissed",
      description: "Execution details rewrite has been dismissed",
    });
  };

  const useExecutionOption = (option: ExecutionDetailsOption) => {
    if (record && onRecordUpdate) {
      const updatedData = {
        ...record.data,
        Product_Price_Execution_Direction__c: option.text
      };
      onRecordUpdate(updatedData);
      setShowExecutionModal(false);
      setExecutionOptions([]);
      toast({
        title: "Execution Details Updated",
        description: "The selected execution details have been applied",
      });
    }
  };

  const rejectExecutionOption = (optionId: number) => {
    setExecutionOptions(prev => 
      prev.map(option => 
        option.id === optionId 
          ? { ...option, isRejected: true }
          : option
      )
    );
    // TODO: Store rejection feedback for model improvement
    toast({
      title: "Option Rejected",
      description: "This option will help improve future suggestions",
    });
  };

  const startAnalysis = () => {
    if (!record) return;
    
    setIsAnalyzing(true);
    setAnalysisSteps([]);
    setSuggestions([]);
    setExecutionRewrite(null);
    setError("");
    setCompletedSteps(new Set());

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to analysis workflow');
      // Send record data for analysis
      wsRef.current?.send(JSON.stringify({
        type: 'analyze_record',
        recordData: record.data
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'analysis_step') {
        const step = {
          step: data.step,
          type: data.stepType,
          message: data.message,
          data: data.data
        };
        
        setAnalysisSteps(prev => [...prev, step]);
        
        // Track completed steps
        if (data.stepType === 'complete') {
          setCompletedSteps(prev => new Set([...prev, step.step]));
        }
        
        if (data.stepType === 'suggestion' && data.data?.suggestions) {
          setSuggestions(data.data.suggestions);
        }
        
        if (data.stepType === 'suggestion' && data.data?.executionRewrite) {
          // Convert single rewrite into 3 options with variations
          const baseRewrite = data.data.executionRewrite;
          const options: ExecutionDetailsOption[] = [
            {
              id: 1,
              text: baseRewrite.rewrittenText,
              improvements: baseRewrite.improvements,
              confidence: baseRewrite.confidence,
              isRejected: false
            },
            {
              id: 2,
              text: generateVariation(baseRewrite.rewrittenText, 'concise'),
              improvements: [...baseRewrite.improvements, 'More concise presentation'],
              confidence: Math.max(0.6, baseRewrite.confidence - 0.1),
              isRejected: false
            },
            {
              id: 3,
              text: generateVariation(baseRewrite.rewrittenText, 'detailed'),
              improvements: [...baseRewrite.improvements, 'Enhanced detail and context'],
              confidence: Math.max(0.6, baseRewrite.confidence - 0.05),
              isRejected: false
            }
          ];
          setExecutionOptions(options);
          setShowExecutionModal(true);
          setIsAnalyzing(false);
          // Clear analysis steps after completion
          setTimeout(() => {
            setAnalysisSteps([]);
          }, 5000);
          toast({
            title: "Analysis Complete",
            description: "Record analysis finished successfully",
          });
        }
      } else if (data.type === 'error') {
        setError(data.message);
        setIsAnalyzing(false);
        toast({
          title: "Analysis Error",
          description: data.message,
          variant: "destructive",
        });
      }
    };

    wsRef.current.onerror = () => {
      setError("Connection error occurred");
      setIsAnalyzing(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to analysis service",
        variant: "destructive",
      });
    };

    wsRef.current.onclose = () => {
      setIsAnalyzing(false);
    };
  };

  const getStepIcon = (step: AnalysisStep) => {
    // Show checkmark if step is completed
    if (completedSteps.has(step.step)) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    switch (step.type) {
      case 'analysis':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'suggestion':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Brain className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      <Card className={className}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">AI Analysis</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-primary">
              <Brain className="w-3 h-3 mr-1.5" />
              {isAnalyzing ? 'Analyzing' : 'Ready'}
            </Badge>
            {record && (
              <div className="flex space-x-1">
                <Button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  size="sm"
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  <Zap className="w-3 h-3 mr-1.5" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Record'}
                </Button>
                {(analysisSteps.length > 0 || suggestions.length > 0 || executionRewrite) && (
                  <Button
                    onClick={clearAnalysis}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    <X className="w-3 h-3 mr-1.5" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {!record ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Select a record to start AI analysis</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Analysis Steps */}
            {analysisSteps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Analysis Progress</h3>
                
                {/* Current and most recent completed step */}
                {(() => {
                  const currentStep = analysisSteps[analysisSteps.length - 1];
                  const completedRecentSteps = analysisSteps.filter(step => completedSteps.has(step.step)).slice(-2);
                  const visibleSteps = [
                    ...completedRecentSteps.slice(-1), // Most recent completed
                    ...(currentStep && !completedSteps.has(currentStep.step) ? [currentStep] : []) // Current if in progress
                  ].filter((step, index, arr) => arr.findIndex(s => s.step === step.step) === index);
                  
                  return visibleSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      {getStepIcon(step)}
                      <div className="flex-1">
                        <div className="text-sm text-slate-700">{step.message}</div>
                        <div className="text-xs text-slate-500 mt-1">Step {step.step}</div>
                      </div>
                    </div>
                  ));
                })()}

                {/* Collapsed history */}
                {analysisSteps.length > 2 && (
                  <div className="border-t pt-2">
                    <button
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className="flex items-center text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {isHistoryExpanded ? (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1" />
                      )}
                      {isHistoryExpanded ? 'Hide' : 'Show'} completed steps ({Math.max(0, analysisSteps.length - 2)})
                    </button>
                    
                    {isHistoryExpanded && (
                      <div className="mt-2 space-y-2">
                        {analysisSteps.slice(0, -2).map((step, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 bg-slate-25 rounded text-xs opacity-75">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-slate-600">{step.message}</div>
                              <div className="text-slate-400 text-xs">Step {step.step}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Data Analysis Results</h3>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className={cn(
                    "border rounded-lg p-4",
                    suggestion.isDiscrepancy 
                      ? "border-red-200 bg-red-50" 
                      : "border-orange-200 bg-orange-50"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-slate-800">
                          {suggestion.field.charAt(0).toUpperCase() + suggestion.field.slice(1)}
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          suggestion.isDiscrepancy 
                            ? "bg-red-100 text-red-700 border-red-200" 
                            : "bg-orange-100 text-orange-700 border-orange-200"
                        )}>
                          {suggestion.isDiscrepancy ? 'Data Discrepancy' : 'Missing Data'}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="bg-slate-100 text-slate-700">
                        {Math.round(suggestion.confidence > 1 ? suggestion.confidence : suggestion.confidence * 100)}% confident
                      </Badge>
                    </div>
                    
                    {suggestion.isDiscrepancy && suggestion.currentValue && (
                      <div className="text-sm text-slate-600 mb-2">
                        <strong>Current:</strong> {suggestion.currentValue}
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-600 mb-2">
                      <strong>{suggestion.isDiscrepancy ? 'Suggested correction:' : 'Suggested:'}</strong> {suggestion.suggestedValue}
                    </div>
                    
                    <div className="text-xs text-slate-500 mb-3">
                      {suggestion.reasoning}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className={cn(
                          "text-white",
                          suggestion.isDiscrepancy 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion.isDiscrepancy ? 'Apply Correction' : 'Apply Update'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => dismissSuggestion(suggestion.field)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Execution Details Rewrite */}
            {executionRewrite && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Improved Execution Details</h3>
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-800">
                      Enhanced Professional Summary
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {executionRewrite.confidence}% confident
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Current Version:</div>
                      <div className="text-sm text-slate-700 bg-white border rounded p-2 max-h-20 overflow-y-auto">
                        {executionRewrite.currentText}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Improved Version:</div>
                      <div className="text-sm text-slate-700 bg-white border rounded p-2 max-h-32 overflow-y-auto">
                        {executionRewrite.rewrittenText}
                      </div>
                    </div>
                    
                    {executionRewrite.improvements.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-600 mb-1">Key Improvements:</div>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {executionRewrite.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-1">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={applyExecutionRewrite}
                    >
                      Apply Improved Version
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={dismissExecutionRewrite}
                    >
                      Keep Current
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isAnalyzing && analysisSteps.length === 0 && !suggestions.length && !executionRewrite && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-700 leading-relaxed">
                  Click "Analyze Record" to use AI to identify missing data and enhance execution details.
                  The system will analyze the record and suggest improvements.
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      </Card>

      {/* Execution Details Options Modal */}
      <Dialog open={showExecutionModal} onOpenChange={setShowExecutionModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Execution Details Enhancement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select the execution details option that best fits your needs, or reject options to help improve future suggestions.
          </p>
          
          {executionOptions.map((option, index) => (
            <div 
              key={option.id} 
              className={cn(
                "border rounded-lg p-4 transition-all",
                option.isRejected 
                  ? "bg-red-50 border-red-200 opacity-60" 
                  : "bg-white border-slate-200 hover:border-blue-300"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-slate-800">
                    Option {option.id}
                    {index === 0 && " (Original)"}
                    {index === 1 && " (Concise)"}
                    {index === 2 && " (Detailed)"}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(option.confidence > 1 ? option.confidence : option.confidence * 100)}% confident
                  </Badge>
                  {option.isRejected && (
                    <Badge variant="destructive" className="text-xs">
                      Rejected
                    </Badge>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 rounded p-3 mb-3">
                <p
                  className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: option.text }}
                />
              </div>
              <div className="mb-3">
                <h4 className="text-xs font-medium text-slate-600 mb-1">Improvements:</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  {option.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => useExecutionOption(option)}
                  disabled={option.isRejected}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Use This
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectExecutionOption(option.id)}
                  disabled={option.isRejected}
                  className="text-slate-600 hover:text-red-600 hover:border-red-300"
                >
                  <ThumbsDown className="w-3 h-3 mr-1" />
                  Not helpful
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowExecutionModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}