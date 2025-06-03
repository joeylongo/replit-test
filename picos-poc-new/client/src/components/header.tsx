"use client";

import {
  Grid,
  ChevronDown,
  Star,
  Plus,
  Rocket,
  HelpCircle,
  Bell,
  CircleUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b-4 border-red-600">
      {/* ───────────────────────────── 1 st row ───────────────────────────── */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-8">
        {/* left – title */}
        <h1 className="text-xl font-semibold text-slate-900">Activity Tool</h1>

        {/* middle – search box */}
        <div className="flex-1 flex justify-center">
          <input
            type="search"
            placeholder="Search…"
            className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* right – icon buttons */}
        <div className="flex items-center space-x-3">
          <IconOutline>
            <Star className="w-4 h-4" />
          </IconOutline>
          <IconSolid>
            <Plus className="w-4 h-4" />
          </IconSolid>
          <IconGhost>
            <Rocket className="w-4 h-4" />
          </IconGhost>
          <IconGhost>
            <HelpCircle className="w-4 h-4" />
          </IconGhost>
          <IconGhost>
            <Bell className="w-4 h-4" />
          </IconGhost>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <CircleUser className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* ───────────────────────────── 2 nd row ───────────────────────────── */}
      <div className="flex items-center h-10 px-4 lg:px-8 space-x-6 border-t border-slate-200">
        {/* 9-dot grid */}
        <Button variant="ghost" size="icon" className="p-0 hover:bg-transparent">
          <Grid className="w-5 h-5 text-slate-500" />
        </Button>

        {/* “Reports ▾” */}
        <button className="flex items-center text-lg font-medium text-slate-900">
          Reports
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>

        {/* “Activities ▾” – active / highlighted */}
        <button className="relative flex items-center text-sm font-medium text-slate-900 bg-red-50 px-4 h-full">
          <span className="absolute -top-px left-0 w-full h-0.5 bg-red-600" />
          Activities
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>
      </div>
    </header>
  );
}

/* —————————————————— small icon-button helpers —————————————————— */

function IconGhost({ children }: { children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 text-slate-500 hover:bg-slate-100"
    >
      {children}
    </Button>
  );
}

function IconSolid({ children }: { children: React.ReactNode }) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="w-8 h-8 bg-slate-200 text-slate-700 hover:bg-slate-300"
    >
      {children}
    </Button>
  );
}

function IconOutline({ children }: { children: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="w-8 h-8 border-slate-400 text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Button>
  );
}
