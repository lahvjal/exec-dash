"use client";

import { cn } from "@/lib/utils";
import { KPIValue, KPIStatus, KPITrend, KPICalculationMeta } from "@/types/kpi";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Tooltip, KPITooltipContent } from "./ui/tooltip";

interface KPICardProps {
  title: string;
  description?: string;
  data: KPIValue | null;
  isHighlighted?: boolean;
  showGoal?: boolean;
  className?: string;
  calculationMeta?: KPICalculationMeta;
}

function getTrendIcon(trend?: KPITrend) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4" />;
    case "down":
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
}

function getStatusStyles(status?: KPIStatus, isHighlighted?: boolean) {
  if (isHighlighted && status === "warning") {
    return {
      card: "border-warning-500/30 bg-warning-50/50",
      badge: "bg-warning-100 text-warning-700",
    };
  }
  if (isHighlighted && status === "danger") {
    return {
      card: "border-danger-500/30 bg-danger-50/50",
      badge: "bg-danger-100 text-danger-700",
    };
  }
  switch (status) {
    case "success":
      return {
        card: "border-slate-200 bg-white",
        badge: "bg-success-100 text-success-700",
      };
    case "warning":
      return {
        card: "border-slate-200 bg-white",
        badge: "bg-warning-100 text-warning-700",
      };
    case "danger":
      return {
        card: "border-slate-200 bg-white",
        badge: "bg-danger-100 text-danger-700",
      };
    default:
      return {
        card: "border-slate-200 bg-white",
        badge: "bg-slate-100 text-slate-600",
      };
  }
}

function getTrendStyles(trend?: KPITrend) {
  switch (trend) {
    case "up":
      return "text-success-600";
    case "down":
      return "text-danger-600";
    default:
      return "text-slate-500";
  }
}

export function KPICard({
  title,
  description,
  data,
  isHighlighted,
  showGoal,
  className,
  calculationMeta,
}: KPICardProps) {
  const styles = getStatusStyles(data?.status, isHighlighted);

  if (!data) {
    return (
      <div
        className={cn(
          "rounded-card border p-5 transition-all duration-200 min-h-[160px] h-full flex flex-col",
          "border-slate-200 bg-slate-50/50",
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Not available for this period</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card border p-5 transition-all duration-200 hover:shadow-md min-h-[160px] h-full flex flex-col",
        styles.card,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
            {calculationMeta && (
              <Tooltip
                content={
                  <KPITooltipContent
                    calculation={calculationMeta.calculation}
                    dataSources={calculationMeta.dataSources}
                    formula={calculationMeta.formula}
                    notes={calculationMeta.notes}
                  />
                }
              />
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        {data.trend && data.trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ml-2 shrink-0",
              styles.badge
            )}
          >
            {getTrendIcon(data.trend)}
            <span>{data.trendValue}</span>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex-1">
        <span className="text-3xl font-bold text-slate-900">{data.formatted}</span>
      </div>

      {/* Goal Progress */}
      {showGoal && data.goal && data.percentToGoal !== undefined && (
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Goal: {data.goalFormatted || data.goal}
            </span>
            <span
              className={cn(
                "font-medium",
                data.percentToGoal >= 90
                  ? "text-success-600"
                  : data.percentToGoal >= 70
                  ? "text-warning-600"
                  : "text-danger-600"
              )}
            >
              {data.percentToGoal.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                data.percentToGoal >= 90
                  ? "bg-success-500"
                  : data.percentToGoal >= 70
                  ? "bg-warning-500"
                  : "bg-danger-500"
              )}
              style={{ width: `${Math.min(data.percentToGoal, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Trend without goal */}
      {!showGoal && data.trend && (
        <div className={cn("flex items-center gap-1 text-sm mt-auto", getTrendStyles(data.trend))}>
          {getTrendIcon(data.trend)}
          <span>vs previous period</span>
        </div>
      )}
    </div>
  );
}

