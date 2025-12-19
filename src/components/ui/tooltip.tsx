"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spaceAbove = triggerRect.top;
      const spaceBelow = window.innerHeight - triggerRect.bottom;

      // If not enough space above and more space below, show tooltip below
      if (spaceAbove < tooltipRect.height + 10 && spaceBelow > spaceAbove) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children || (
          <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 w-80 p-4 text-sm bg-slate-900 text-white rounded-lg shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            position === 'top' 
              ? "bottom-full mb-2 right-0" 
              : "top-full mt-2 right-0",
            className
          )}
          style={{
            maxWidth: 'calc(100vw - 2rem)',
          }}
        >
          {/* Arrow */}
          <div
            className={cn(
              "absolute right-2 w-3 h-3 bg-slate-900 transform rotate-45",
              position === 'top' ? "-bottom-1.5" : "-top-1.5"
            )}
          />
          
          {/* Content */}
          <div className="relative z-10">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

interface KPITooltipContentProps {
  calculation: string;
  dataSources: {
    table: string;
    fields: string[];
  }[];
  formula: string;
  notes?: string;
}

export function KPITooltipContent({ calculation, dataSources, formula, notes }: KPITooltipContentProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold mb-1 text-white">Calculation</h4>
        <p className="text-slate-300 text-xs leading-relaxed">{calculation}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-white">Data Sources</h4>
        <div className="space-y-1">
          {dataSources.map((source, idx) => (
            <div key={idx} className="text-xs">
              <span className="text-blue-400 font-mono">{source.table}</span>
              <div className="ml-3 text-slate-300">
                {source.fields.map((field, fieldIdx) => (
                  <div key={fieldIdx} className="font-mono text-xs">
                    • {field}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-1 text-white">Formula</h4>
        <code className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded block font-mono">
          {formula}
        </code>
      </div>

      {notes && (
        <div>
          <h4 className="font-semibold mb-1 text-yellow-400">Notes</h4>
          <p className="text-slate-300 text-xs leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}
