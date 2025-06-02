import { Settings, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-white" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM12 17.5L6.5 12h3V8.5h5V12h3L12 17.5z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">
              Salesforce AI Assistant
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Circle className="w-2 h-2 mr-1.5 fill-current" />
              Connected
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
