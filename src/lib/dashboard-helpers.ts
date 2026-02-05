import { supabase } from './supabase';
import type { KPISection, KPIDefinition } from '@/types/kpi';
import type { CustomKPIRecord } from './supabase';

/**
 * Fetch KPI sections dynamically from database
 * 
 * This function fetches all active, non-hidden KPIs from Supabase
 * and organizes them into sections for display on the dashboard.
 * 
 * Usage: Call this instead of importing DASHBOARD_SECTIONS after migration is complete
 */
export async function getDashboardSections(): Promise<KPISection[]> {
  try {
    // Fetch all active, non-hidden KPIs from database
    const { data: kpis, error } = await supabase
      .from('custom_kpis')
      .select('*')
      .eq('is_active', true)
      .eq('is_hidden', false)
      .order('section_id', { ascending: true })
      .order('kpi_id', { ascending: true });

    if (error) {
      console.error('Error fetching dashboard KPIs:', error);
      return [];
    }

    if (!kpis || kpis.length === 0) {
      return [];
    }

    // Group KPIs by section
    const sectionMap = new Map<string, CustomKPIRecord[]>();
    
    for (const kpi of kpis) {
      if (!sectionMap.has(kpi.section_id)) {
        sectionMap.set(kpi.section_id, []);
      }
      sectionMap.get(kpi.section_id)!.push(kpi);
    }

    // Convert to KPISection format
    const sections: KPISection[] = [];
    
    for (const [sectionId, sectionKpis] of sectionMap) {
      const kpiDefinitions: KPIDefinition[] = sectionKpis.map(kpi => ({
        id: kpi.kpi_id,
        name: kpi.name,
        description: kpi.description || undefined,
        format: kpi.format,
        availablePeriods: kpi.available_periods as any[],
        isHighlighted: false, // TODO: Add to database schema if needed
        showGoal: false,      // TODO: Determine from field_mappings or database
        hidden: kpi.is_hidden,
        calculationMeta: undefined // TODO: Could be stored in field_mappings
      }));

      sections.push({
        id: sectionId,
        title: formatSectionTitle(sectionId),
        description: getSectionDescription(sectionId),
        kpis: kpiDefinitions
      });
    }

    return sections;
  } catch (error) {
    console.error('Error in getDashboardSections:', error);
    return [];
  }
}

/**
 * Get dashboard sections with fallback to hardcoded sections
 * 
 * This function first tries to fetch from database, and if no KPIs
 * are found (or on error), falls back to the hardcoded sections.
 * 
 * Use this during migration period to ensure dashboard always works.
 */
export async function getDashboardSectionsWithFallback(): Promise<KPISection[]> {
  // Try to fetch from database
  const dbSections = await getDashboardSections();
  
  // If database has KPIs, use them
  if (dbSections.length > 0) {
    return dbSections;
  }
  
  // Otherwise fall back to hardcoded sections
  const { DASHBOARD_SECTIONS } = await import('@/types/kpi');
  return DASHBOARD_SECTIONS;
}

/**
 * Format section ID to human-readable title
 */
function formatSectionTitle(sectionId: string): string {
  const titleMap: Record<string, string> = {
    'sales_stats': 'Sales Stats',
    'operations_stats': 'Operations Stats',
    'cycle_times': 'Cycle Times',
    'residential_financials': 'Residential Financials',
    'active_pipeline': 'Active Pipeline',
    'finance': 'Finance',
    'commercial': 'Commercial Division'
  };

  return titleMap[sectionId] || sectionId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get section description
 */
function getSectionDescription(sectionId: string): string | undefined {
  const descriptionMap: Record<string, string> = {
    'sales_stats': 'Sales performance, rep activity, and conversion metrics',
    'operations_stats': 'Installation throughput, cycle times, and operational bottlenecks',
    'cycle_times': 'Speed of progression through the project pipeline',
    'residential_financials': 'Financial state including cash flow and pending payments',
    'active_pipeline': 'Projects actively progressing toward PTO',
    'finance': 'Financial tracking for milestone payment milestones and receivables',
    'commercial': 'Commercial KPIs based on KW capacity'
  };

  return descriptionMap[sectionId];
}

/**
 * Merge database KPIs with hardcoded KPIs
 * 
 * During migration, some KPIs will be in database and some still in code.
 * This function merges them, with database KPIs taking precedence.
 */
export async function getMergedDashboardSections(): Promise<KPISection[]> {
  // Fetch database KPIs
  const dbSections = await getDashboardSections();
  
  // Get hardcoded KPIs
  const { DASHBOARD_SECTIONS } = await import('@/types/kpi');
  
  // If no database KPIs, return hardcoded
  if (dbSections.length === 0) {
    return DASHBOARD_SECTIONS;
  }
  
  // Create map of database KPI IDs
  const dbKpiIds = new Set<string>();
  for (const section of dbSections) {
    for (const kpi of section.kpis) {
      dbKpiIds.add(kpi.id);
    }
  }
  
  // Create merged sections
  const mergedSections: KPISection[] = [];
  const sectionMap = new Map<string, KPISection>();
  
  // Add all database sections
  for (const section of dbSections) {
    sectionMap.set(section.id, section);
  }
  
  // Add hardcoded sections and merge KPIs
  for (const section of DASHBOARD_SECTIONS) {
    if (sectionMap.has(section.id)) {
      // Section exists in database, add missing hardcoded KPIs
      const existingSection = sectionMap.get(section.id)!;
      const additionalKpis = section.kpis.filter(kpi => !dbKpiIds.has(kpi.id));
      existingSection.kpis.push(...additionalKpis);
    } else {
      // Section doesn't exist in database, add entire section
      sectionMap.set(section.id, section);
    }
  }
  
  // Convert map to array and sort by standard order
  const sectionOrder = [
    'sales_stats',
    'operations_stats',
    'cycle_times',
    'residential_financials',
    'active_pipeline',
    'finance',
    'commercial'
  ];
  
  for (const sectionId of sectionOrder) {
    if (sectionMap.has(sectionId)) {
      mergedSections.push(sectionMap.get(sectionId)!);
    }
  }
  
  // Add any remaining sections not in standard order
  for (const [sectionId, section] of sectionMap) {
    if (!sectionOrder.includes(sectionId)) {
      mergedSections.push(section);
    }
  }
  
  return mergedSections;
}
