"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { TimeFilter } from "@/components/time-filter";
import { KPISection } from "@/components/kpi-section";
import { DASHBOARD_SECTIONS, TimePeriod } from "@/types/kpi";
import { RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useKPIData } from "@/hooks/use-kpi-data";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("current_week");
  const [lastUpdated] = useState(new Date());
  
  // Fetch KPI data from API
  const { data: kpiData, loading, error, refetch } = useKPIData(DASHBOARD_SECTIONS, selectedPeriod);
  
  // Listen for goal updates and refetch data
  useEffect(() => {
    const handleGoalsUpdated = () => {
      console.log('Goals updated, refetching KPI data...');
      refetch();
    };
    
    window.addEventListener('goals-updated', handleGoalsUpdated);
    
    return () => {
      window.removeEventListener('goals-updated', handleGoalsUpdated);
    };
  }, [refetch]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Page Header */}
      <div className="px-6 pt-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Executive Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>
              Last updated: {lastUpdated.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Time Filter */}
      <div className="sticky top-20 z-20 px-6 pb-6 bg-transparent">
        <div className="max-w-[1600px] mx-auto flex justify-center">
          <TimeFilter selected={selectedPeriod} onChange={setSelectedPeriod} />
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6 max-w-[1600px] mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
            <p className="text-slate-600">Loading KPI data...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Data</h3>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <button
                  onClick={refetch}
                  className="text-sm font-medium text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Sections */}
        {!loading && !error && (
          <div className="space-y-8">
            {DASHBOARD_SECTIONS.map((section) => (
              <KPISection
                key={section.id}
                section={section}
                period={selectedPeriod}
                kpiData={kpiData}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
          <p>Aveyo KPI Dashboard &bull; Data refreshes every 15 minutes</p>
        </footer>
      </main>
    </div>
  );
}

