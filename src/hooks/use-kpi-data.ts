"use client";

import { useState, useEffect } from 'react';
import { TimePeriod, KPIValue, KPISection } from '@/types/kpi';

interface KPIDataState {
  [kpiId: string]: {
    [period: string]: KPIValue;
  };
}

interface UseKPIDataReturn {
  data: KPIDataState;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch KPI data from the API
 * 
 * @param sections - Array of KPI sections to fetch
 * @param period - Time period for the KPIs
 * @returns Object with data, loading state, error, and refetch function
 */
export function useKPIData(sections: KPISection[], period: TimePeriod): UseKPIDataReturn {
  const [data, setData] = useState<KPIDataState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchKPIData = async (bustCache = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build list of all KPIs to fetch
      const kpisToFetch: Array<{ kpiId: string; period: TimePeriod }> = [];
      
      sections.forEach((section) => {
        section.kpis.forEach((kpi) => {
          // Only fetch if the KPI is available for this period
          if (kpi.availablePeriods.includes(period)) {
            kpisToFetch.push({ kpiId: kpi.id, period });
          }
        });
      });
      
      // Add cache-busting parameter if needed
      const url = bustCache ? `/api/kpi?t=${Date.now()}` : '/api/kpi';
      
      // Fetch all KPIs in batch
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bustCache ? { 'Cache-Control': 'no-cache' } : {}),
        },
        body: JSON.stringify({ kpis: kpisToFetch }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Process successful results
      const newData: KPIDataState = {};
      
      result.successful?.forEach((item: any) => {
        if (!newData[item.kpiId]) {
          newData[item.kpiId] = {};
        }
        newData[item.kpiId][item.period] = item.data;
      });
      
      // Log any failures
      if (result.failed?.length > 0) {
        console.warn('Some KPIs failed to load:', result.failed);
      }
      
      setData(newData);
      
    } catch (err: any) {
      console.error('Error fetching KPI data:', err);
      setError(err.message || 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when sections or period changes
  useEffect(() => {
    fetchKPIData();
  }, [period]); // Only refetch when period changes
  
  return {
    data,
    loading,
    error,
    refetch: () => fetchKPIData(true), // Always bust cache on manual refetch
  };
}

/**
 * Get a specific KPI value from the data state
 */
export function getKPIValue(
  data: KPIDataState,
  kpiId: string,
  period: TimePeriod
): KPIValue | null {
  return data[kpiId]?.[period] || null;
}
