import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Edit3, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { SalesforceRecordData, FieldConfig } from "@shared/schema";
import { DEFAULT_FIELD_CONFIG } from "@shared/schema";

interface FieldGroup {
  title: string;
  fields: string[];
}

interface RecordDetailsProps {
  record: {
    id: string;
    name: string;
    type: string;
    data: SalesforceRecordData;
  } | null;
  className?: string;
  onRecordUpdate?: (updatedData: SalesforceRecordData) => void;
  fieldConfig?: FieldConfig[];
  fieldGroups?: FieldGroup[];
}

export default function RecordDetails({
  record,
  className,
  onRecordUpdate,
  fieldConfig = DEFAULT_FIELD_CONFIG,
  fieldGroups
}: RecordDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<SalesforceRecordData | null>(null);
  const { toast } = useToast();

  const startEditing = () => {
    setIsEditing(true);
    setEditedData(record?.data || null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const saveChanges = () => {
    if (editedData && onRecordUpdate) {
      onRecordUpdate(editedData);
      setIsEditing(false);
      setEditedData(null);
      toast({
        title: "Record Updated",
        description: "Record details have been successfully updated",
      });
    }
  };

  const renderField = (field: FieldConfig) => {
    if (field.hide) return null;

    const currentData = isEditing ? editedData : record?.data;
    const value = currentData?.[field.key] || '';
    const isRequired = field.required && !value;

    if (isEditing) {
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <Textarea
              value={value}
              onChange={(e) =>
                setEditedData(prev => prev ? { ...prev, [field.key]: e.target.value } : null)
              }
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className={cn("resize-none text-sm", isRequired && "border-red-300 focus:border-red-500")}
              rows={3}
            />
          ) : (
            <Input
              type={field.type || 'text'}
              value={value}
              onChange={(e) =>
                setEditedData(prev => prev ? { ...prev, [field.key]: e.target.value } : null)
              }
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className={cn("text-sm", isRequired && "border-red-300 focus:border-red-500")}
            />
          )}
        </div>
      );
    }

    // View mode
    return (
      <div key={field.key} className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="border border-slate-300 rounded px-3 py-2 bg-white text-sm min-h-[40px] flex items-center">
          <span className={cn(!value && "text-slate-400 italic")}>
            {value || 'Not set'}
          </span>
        </div>
      </div>
    );
  };

  const currentData = isEditing ? editedData : record?.data;

  if (!record) {
    return (
      <Card className={className}>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Record Details</h2>
            <Badge variant="outline" className="bg-blue-50 text-primary">
              <Building2 className="w-3 h-3 mr-1.5" />
              No Record Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12 text-slate-500">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Select a Salesforce record to view details</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{record.name}</h2>
              <p className="text-sm text-slate-600">Record ID: {record.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {record.type}
            </Badge>
            {!isEditing ? (
              <Button onClick={startEditing} size="sm" variant="outline" className="h-8">
                <Edit3 className="w-3 h-3 mr-1.5" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-1">
                <Button
                  onClick={saveChanges}
                  size="sm"
                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-3 h-3 mr-1.5" />
                  Save
                </Button>
                <Button
                  onClick={cancelEditing}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <X className="w-3 h-3 mr-1.5" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-10">
        {fieldGroups ? (
          fieldGroups.map(group => {
            const groupFields = fieldConfig.filter(f => group.fields.includes(f.key));
            return (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-slate-700 mb-4">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupFields.map(renderField)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fieldConfig.map(renderField)}
          </div>
        )}

        {/* Execution Details */}
        <div className="pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Execution Details
            </label>
            {isEditing ? (
              <Textarea
                value={currentData?.Product_Price_Execution_Direction__c || ''}
                onChange={(e) =>
                  setEditedData(prev => prev ? {
                    ...prev,
                    Product_Price_Execution_Direction__c: e.target.value
                  } : null)
                }
                className="text-sm min-h-[120px] resize-none"
                placeholder="Enter execution details..."
              />
            ) : (
              <div
                className="border border-slate-300 rounded px-3 py-3 bg-white text-sm min-h-[120px] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: currentData?.Product_Price_Execution_Direction__c || 'No execution details provided'
                }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
