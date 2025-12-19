import { query, queryOne } from './db';
import { TimePeriod, KPIValue, KPITrend, KPIStatus } from '@/types/kpi';
import { supabase } from './supabase';

/**
 * KPI Service Layer
 * 
 * This module provides functions to calculate all dashboard KPIs from the MySQL database.
 * Each function queries the database and returns formatted KPI values with trends and goals.
 */

// =============================================================================
// DATE RANGE HELPERS
// =============================================================================

interface DateRange {
  start: string;
  end: string;
}

/**
 * Get date range SQL for a given period
 */
function getPeriodDateRange(period: TimePeriod): DateRange {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (period) {
    case 'current_week': {
      // Monday to Sunday of current week
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      };
    }
    
    case 'previous_week': {
      const dayOfWeek = now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      
      return {
        start: lastMonday.toISOString().split('T')[0],
        end: lastSunday.toISOString().split('T')[0],
      };
    }
    
    case 'mtd': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstOfMonth.toISOString().split('T')[0],
        end: today,
      };
    }
    
    case 'ytd': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        start: firstOfYear.toISOString().split('T')[0],
        end: today,
      };
    }
    
    case 'next_week': {
      const dayOfWeek = now.getDay();
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 7);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      
      return {
        start: nextMonday.toISOString().split('T')[0],
        end: nextSunday.toISOString().split('T')[0],
      };
    }
    
    default:
      return { start: today, end: today };
  }
}

/**
 * Build SQL date filter clause
 */
function buildDateFilter(field: string, period: TimePeriod): string {
  const range = getPeriodDateRange(period);
  return `${field} >= '${range.start}' AND ${field} <= '${range.end}'`;
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDays(value: number): string {
  return `${Math.round(value)} days`;
}

function calculateTrend(current: number, previous: number): { trend: KPITrend; trendValue: string } {
  if (previous === 0) {
    return { trend: 'neutral', trendValue: 'N/A' };
  }
  
  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  
  if (absChange < 1) {
    return { trend: 'neutral', trendValue: '0%' };
  }
  
  return {
    trend: change > 0 ? 'up' : 'down',
    trendValue: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
  };
}

function calculateStatus(value: number, goal?: number): KPIStatus {
  if (!goal) return 'neutral';
  
  const percentOfGoal = (value / goal) * 100;
  
  if (percentOfGoal >= 100) return 'success';
  if (percentOfGoal >= 80) return 'warning';
  return 'danger';
}

// =============================================================================
// GOALS MANAGEMENT (Supabase)
// =============================================================================

// Cache goals in memory to avoid database queries on every request
let goalsCache: any = null;
let goalsCacheTime: number = 0;
const GOALS_CACHE_TTL = 60000; // 1 minute

/**
 * Invalidate the goals cache (call when goals are updated)
 */
export function invalidateGoalsCache(): void {
  goalsCache = null;
  goalsCacheTime = 0;
  console.log('Goals cache invalidated');
}

/**
 * Load goals from Supabase with caching
 */
async function loadGoals(): Promise<any> {
  const now = Date.now();
  
  // Return cached goals if still valid
  if (goalsCache && (now - goalsCacheTime) < GOALS_CACHE_TTL) {
    return goalsCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    // Transform database rows into goals object structure
    const goals: Record<string, Record<string, number>> = {};
    
    data?.forEach((row: any) => {
      if (!goals[row.kpi_id]) {
        goals[row.kpi_id] = {};
      }
      goals[row.kpi_id][row.period] = parseFloat(row.value);
    });
    
    goalsCache = goals;
    goalsCacheTime = now;
    return goals;
  } catch (error) {
    console.error('Error loading goals from Supabase:', error);
    // Return default goals as fallback
    return {
      total_sales: {
        current_week: 50,
        previous_week: 50,
        mtd: 200,
        ytd: 2400,
      },
      installs_complete: {
        current_week: 40,
        previous_week: 40,
        mtd: 160,
        ytd: 1920,
      },
      avg_days_pp_to_install: {
        current_week: 60,
        previous_week: 60,
        mtd: 60,
      },
      avg_days_install_to_m2: {
        previous_week: 30,
        ytd: 30,
      },
      avg_days_pp_to_pto: {
        previous_week: 90,
        mtd: 90,
        ytd: 90,
      },
      total_kw_scheduled: {
        current_week: 500,
        next_week: 500,
      },
      total_kw_installed: {
        current_week: 400,
        previous_week: 400,
        mtd: 1600,
        ytd: 19200,
      },
    };
  }
}

/**
 * Get goal for a specific KPI and period
 */
async function getGoal(kpiId: string, period: TimePeriod): Promise<number | undefined> {
  const goals = await loadGoals();
  return goals[kpiId]?.[period];
}

// =============================================================================
// SALES & APPROVAL PIPELINE
// =============================================================================

export async function getTotalSales(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`contract-signed`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE t.\`contract-signed\` IS NOT NULL
      AND pd.\`project-status\` != 'Cancelled'
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  // Get previous period for trend
  const prevPeriod = period === 'current_week' ? 'previous_week' : period;
  const prevDateFilter = buildDateFilter('t.`contract-signed`', prevPeriod);
  const prevSql = sql.replace(dateFilter, prevDateFilter);
  const prevResult = await queryOne<{ count: number }>(prevSql);
  const prevValue = prevResult?.count || 0;
  
  const goal = await getGoal('total_sales', period);
  const trend = calculateTrend(value, prevValue);
  
  return {
    value,
    formatted: formatNumber(value),
    trend: trend.trend,
    trendValue: trend.trendValue,
    goal,
    goalFormatted: goal ? formatNumber(goal) : undefined,
    percentToGoal: goal ? Math.round((value / goal) * 100) : undefined,
    status: calculateStatus(value, goal),
  };
}

export async function getTotalSalesGoal(period: TimePeriod): Promise<KPIValue> {
  const goal = await getGoal('total_sales', period) || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getAveyoApproved(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('cs.`sow-approved-timestamp`', period);
  
  const sql = `
    SELECT COUNT(DISTINCT cs.\`project-id\`) as count
    FROM \`customer-sow\` cs
    LEFT JOIN \`project-data\` pd ON cs.\`project-id\` = pd.\`project-id\`
    WHERE cs.\`sow-approved-timestamp\` IS NOT NULL
      AND (pd.\`project-status\` IS NULL OR pd.\`project-status\` != 'Cancelled')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  return {
    value,
    formatted: formatNumber(value),
  };
}

export async function getPullThroughRate(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`contract-signed`', period);
  
  // Get total sales count (denominator)
  const totalSales = await getTotalSales(period);
  const salesValue = typeof totalSales.value === 'number' ? totalSales.value : 0;
  
  // Get active projects count (numerator)
  const activeSql = `
    SELECT COUNT(*) as count
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE pd.\`project-status\` IN ('Active', 'Complete', 'Pre-Approvals', 'New Lender', 'Finance Hold')
      AND t.\`contract-signed\` IS NOT NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(activeSql);
  const activeValue = result?.count || 0;
  
  const rate = salesValue > 0 ? (activeValue / salesValue) * 100 : 0;
  
  return {
    value: rate,
    formatted: formatPercentage(rate),
    status: rate >= 90 ? 'success' : rate >= 75 ? 'warning' : 'danger',
  };
}

// =============================================================================
// INSTALL OPERATIONS
// =============================================================================

export async function getJobsOnHold(period: TimePeriod): Promise<KPIValue> {
  const sql = `
    SELECT COUNT(*) as count
    FROM \`project-data\` pd
    LEFT JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`project-status\` = 'On Hold'
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  return {
    value,
    formatted: formatNumber(value),
    status: value === 0 ? 'success' : value <= 5 ? 'warning' : 'danger',
  };
}

export async function getInstallsComplete(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`install-complete`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\`
    WHERE \`install-complete\` IS NOT NULL
      AND \`install-stage-status\` = 'Complete'
      AND (\`cancellation-reason\` IS NULL OR \`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  const goal = await getGoal('installs_complete', period);
  
  return {
    value,
    formatted: formatNumber(value),
    goal,
    goalFormatted: goal ? formatNumber(goal) : undefined,
    percentToGoal: goal ? Math.round((value / goal) * 100) : undefined,
    status: calculateStatus(value, goal),
  };
}

export async function getInstallCompletionGoal(period: TimePeriod): Promise<KPIValue> {
  const goal = await getGoal('installs_complete', period) || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getInstallCompleteNoPTO(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-complete`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\` t
    WHERE t.\`install-complete\` IS NOT NULL
      AND t.\`pto-received\` IS NULL
      AND t.\`install-stage-status\` = 'Complete'
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  return {
    value,
    formatted: formatNumber(value),
    status: value <= 20 ? 'success' : value <= 50 ? 'warning' : 'danger',
  };
}

export async function getInstallScheduled(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`install-appointment`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\`
    WHERE \`install-appointment\` IS NOT NULL
      AND (\`cancellation-reason\` IS NULL OR \`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  return {
    value,
    formatted: formatNumber(value),
  };
}

// =============================================================================
// CYCLE TIMES
// =============================================================================

export async function getAvgDaysPPToInstall(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`install-appointment`', period);
  
  // TODO: Update to use MEDIAN instead of AVG for more accurate cycle time representation
  const sql = `
    SELECT AVG(DATEDIFF(\`install-appointment\`, \`packet-approval\`)) as avg_days
    FROM \`timeline\`
    WHERE \`packet-approval\` IS NOT NULL
      AND \`install-appointment\` IS NOT NULL
      AND (\`cancellation-reason\` IS NULL OR \`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = await getGoal('avg_days_pp_to_install', period);
  
  // For cycle times, lower is better - calculate inverse percentage
  const percentToGoal = goal && value > 0 ? Math.round((goal / value) * 100) : undefined;
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    percentToGoal,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

export async function getAvgDaysInstallToM2(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-appointment`', period);
  
  // TODO: Update to use MEDIAN instead of AVG for more accurate cycle time representation
  const sql = `
    SELECT AVG(DATEDIFF(pd.\`m2-approved\`, t.\`install-appointment\`)) as avg_days
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE t.\`install-appointment\` IS NOT NULL
      AND pd.\`m2-approved\` IS NOT NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = await getGoal('avg_days_install_to_m2', period);
  
  // For cycle times, lower is better - calculate inverse percentage
  const percentToGoal = goal && value > 0 ? Math.round((goal / value) * 100) : undefined;
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    percentToGoal,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

export async function getAvgDaysPPToPTO(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`pto-received`', period);
  
  // TODO: Update to use MEDIAN instead of AVG for more accurate cycle time representation
  const sql = `
    SELECT AVG(DATEDIFF(\`pto-received\`, \`packet-approval\`)) as avg_days
    FROM \`timeline\`
    WHERE \`packet-approval\` IS NOT NULL
      AND \`pto-received\` IS NOT NULL
      AND (\`cancellation-reason\` IS NULL OR \`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = await getGoal('avg_days_pp_to_pto', period);
  
  // For cycle times, lower is better - calculate inverse percentage
  const percentToGoal = goal && value > 0 ? Math.round((goal / value) * 100) : undefined;
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    percentToGoal,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

// =============================================================================
// RESIDENTIAL FINANCIALS
// =============================================================================

export async function getARM2M3(period: TimePeriod): Promise<KPIValue> {
  // Calculate M2 outstanding (80% of contract price for submitted but not received)
  const m2Sql = `
    SELECT SUM(pd.\`contract-price\` * 0.8) as m2_total
    FROM \`project-data\` pd
    LEFT JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`m2-submitted\` IS NOT NULL
      AND pd.\`m2-received-date\` IS NULL
      AND pd.\`project-status\` IN ('Active', 'New Lender', 'Finance Hold', 'Pre-Approvals')
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  // Calculate M3 outstanding (20% of contract price for submitted but not received)
  const m3Sql = `
    SELECT SUM(pd.\`contract-price\` * 0.2) as m3_total
    FROM \`project-data\` pd
    LEFT JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`m3-submitted\` IS NOT NULL
      AND pd.\`m3-approved\` IS NULL
      AND pd.\`project-status\` IN ('Active', 'New Lender', 'Finance Hold', 'Pre-Approvals')
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  const m2Result = await queryOne<{ m2_total: number }>(m2Sql);
  const m3Result = await queryOne<{ m3_total: number }>(m3Sql);
  
  const m2Value = m2Result?.m2_total || 0;
  const m3Value = m3Result?.m3_total || 0;
  const value = m2Value + m3Value;
  
  return {
    value,
    formatted: formatCurrency(value),
  };
}

export async function getRevenueReceived(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('pd.`m1-received-date`', period);
  const dateFilter2 = buildDateFilter('pd.`m2-received-date`', period);
  
  // Calculate M1 revenue (20% of contract price) received in period
  const m1Sql = `
    SELECT SUM(pd.\`contract-price\` * 0.2) as m1_revenue
    FROM \`project-data\` pd
    LEFT JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`m1-received-date\` IS NOT NULL
      AND ${dateFilter}
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  // Calculate M2 revenue (80% of contract price) received in period  
  const m2Sql = `
    SELECT SUM(pd.\`contract-price\` * 0.8) as m2_revenue
    FROM \`project-data\` pd
    LEFT JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`m2-received-date\` IS NOT NULL
      AND ${dateFilter2}
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  const m1Result = await queryOne<{ m1_revenue: number }>(m1Sql);
  const m2Result = await queryOne<{ m2_revenue: number }>(m2Sql);
  
  const m1Value = m1Result?.m1_revenue || 0;
  const m2Value = m2Result?.m2_revenue || 0;
  const value = m1Value + m2Value;
  
  return {
    value,
    formatted: formatCurrency(value),
  };
}

export async function getInstallM2NotApproved(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-complete`', period);
  
  const sql = `
    SELECT SUM(pd.\`contract-price\` * 0.8) as total
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND pd.\`m2-approved\` IS NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ total: number }>(sql);
  const value = result?.total || 0;
  
  return {
    value,
    formatted: formatCurrency(value),
    status: value <= 100000 ? 'success' : value <= 500000 ? 'warning' : 'danger',
  };
}

export async function getTotalHoldback(period: TimePeriod): Promise<KPIValue> {
  // Placeholder - need to clarify data source
  return {
    value: 0,
    formatted: formatCurrency(0),
  };
}

export async function getTotalDCA(period: TimePeriod): Promise<KPIValue> {
  // Placeholder - need to clarify data source
  return {
    value: 0,
    formatted: formatCurrency(0),
  };
}

// =============================================================================
// ACTIVE PIPELINE
// =============================================================================

export async function getActiveNoPTO(period: TimePeriod): Promise<KPIValue> {
  const sql = `
    SELECT COUNT(*) as count
    FROM \`project-data\` pd
    JOIN \`timeline\` t ON pd.\`project-dev-id\` = t.\`project-dev-id\`
    WHERE pd.\`project-status\` IN ('Active', 'Complete', 'Pre-Approvals', 'New Lender', 'Finance Hold')
      AND t.\`pto-received\` IS NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  return {
    value,
    formatted: formatNumber(value),
  };
}

// =============================================================================
// COMMERCIAL DIVISION
// =============================================================================

export async function getTotalKWScheduled(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-appointment`', period);
  
  const sql = `
    SELECT SUM(pd.\`system-size\`) as total_kw
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE t.\`install-appointment\` IS NOT NULL
      AND t.\`install-complete\` IS NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ total_kw: number }>(sql);
  const value = result?.total_kw || 0;
  
  const goal = await getGoal('total_kw_scheduled', period);
  
  return {
    value,
    formatted: formatNumber(value),
    goal,
    goalFormatted: goal ? formatNumber(goal) : undefined,
    percentToGoal: goal ? Math.round((value / goal) * 100) : undefined,
    status: calculateStatus(value, goal),
  };
}

export async function getKWScheduledGoal(period: TimePeriod): Promise<KPIValue> {
  const goal = await getGoal('total_kw_scheduled', period) || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getTotalKWInstalled(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-complete`', period);
  
  const sql = `
    SELECT SUM(pd.\`system-size\`) as total_kw
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-dev-id\` = pd.\`project-dev-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND (t.\`cancellation-reason\` IS NULL OR t.\`cancellation-reason\` != 'Duplicate Project (Error)')
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ total_kw: number }>(sql);
  const value = result?.total_kw || 0;
  
  const goal = await getGoal('total_kw_installed', period);
  
  return {
    value,
    formatted: formatNumber(value),
    goal,
    goalFormatted: goal ? formatNumber(goal) : undefined,
    percentToGoal: goal ? Math.round((value / goal) * 100) : undefined,
    status: calculateStatus(value, goal),
  };
}

export async function getKWInstalledGoal(period: TimePeriod): Promise<KPIValue> {
  const goal = await getGoal('total_kw_installed', period) || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getARCommercial(period: TimePeriod): Promise<KPIValue> {
  // Same as residential for now - need to add commercial filter when available
  return await getARM2M3(period);
}

export async function getRevenueReceivedCommercial(period: TimePeriod): Promise<KPIValue> {
  // Same as residential for now - need to add commercial filter when available
  return await getRevenueReceived(period);
}

// =============================================================================
// MAIN KPI FETCHER
// =============================================================================

export async function getKPIValue(kpiId: string, period: TimePeriod): Promise<KPIValue> {
  switch (kpiId) {
    // Sales & Approval Pipeline
    case 'total_sales': return getTotalSales(period);
    case 'total_sales_goal': return getTotalSalesGoal(period);
    case 'aveyo_approved': return getAveyoApproved(period);
    case 'pull_through_rate': return getPullThroughRate(period);
    
    // Install Operations
    case 'jobs_on_hold': return getJobsOnHold(period);
    case 'installs_complete': return getInstallsComplete(period);
    case 'install_completion_goal': return getInstallCompletionGoal(period);
    case 'install_complete_no_pto': return getInstallCompleteNoPTO(period);
    case 'install_scheduled': return getInstallScheduled(period);
    
    // Cycle Times
    case 'avg_days_pp_to_install': return getAvgDaysPPToInstall(period);
    case 'avg_days_install_to_m2': return getAvgDaysInstallToM2(period);
    case 'avg_days_pp_to_pto': return getAvgDaysPPToPTO(period);
    
    // Residential Financials
    case 'ar_m2_m3': return getARM2M3(period);
    case 'revenue_received': return getRevenueReceived(period);
    case 'install_m2_not_approved': return getInstallM2NotApproved(period);
    case 'total_holdback': return getTotalHoldback(period);
    case 'total_dca': return getTotalDCA(period);
    
    // Active Pipeline
    case 'active_no_pto': return getActiveNoPTO(period);
    
    // Commercial Division
    case 'total_kw_scheduled': return getTotalKWScheduled(period);
    case 'kw_scheduled_goal': return getKWScheduledGoal(period);
    case 'total_kw_installed': return getTotalKWInstalled(period);
    case 'kw_installed_goal': return getKWInstalledGoal(period);
    case 'ar_commercial': return getARCommercial(period);
    case 'revenue_received_commercial': return getRevenueReceivedCommercial(period);
    
    default:
      throw new Error(`Unknown KPI ID: ${kpiId}`);
  }
}
