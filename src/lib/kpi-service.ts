import { query, queryOne } from './db';
import { TimePeriod, KPIValue, KPITrend, KPIStatus } from '@/types/kpi';

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
// HARDCODED GOALS (to be moved to database later)
// =============================================================================

const GOALS = {
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

// =============================================================================
// SALES & APPROVAL PIPELINE
// =============================================================================

export async function getTotalSales(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`contract-signed`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-id\` = pd.\`project-id\`
    WHERE t.\`contract-signed\` IS NOT NULL
      AND pd.\`project-status\` != 'Cancelled'
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
  
  const goal = GOALS.total_sales[period as keyof typeof GOALS.total_sales];
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
  const goal = GOALS.total_sales[period as keyof typeof GOALS.total_sales] || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getAveyoApproved(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`packet-approval`', period);
  
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\`
    WHERE \`packet-approval\` IS NOT NULL
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
  const sales = await getTotalSales(period);
  const approved = await getAveyoApproved(period);
  
  const salesValue = typeof sales.value === 'number' ? sales.value : 0;
  const approvedValue = typeof approved.value === 'number' ? approved.value : 0;
  
  const rate = salesValue > 0 ? (approvedValue / salesValue) * 100 : 0;
  
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
    FROM \`work-orders\`
    WHERE \`work-order-status\` = 'On Hold'
      AND \`type\` = 'Install'
      AND \`is_deleted\` = 0
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
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ count: number }>(sql);
  const value = result?.count || 0;
  
  const goal = GOALS.installs_complete[period as keyof typeof GOALS.installs_complete];
  
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
  const goal = GOALS.installs_complete[period as keyof typeof GOALS.installs_complete] || 0;
  
  return {
    value: goal,
    formatted: formatNumber(goal),
  };
}

export async function getInstallCompleteNoPTO(period: TimePeriod): Promise<KPIValue> {
  const sql = `
    SELECT COUNT(*) as count
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-id\` = pd.\`project-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND t.\`pto-received\` IS NULL
      AND pd.\`project-status\` != 'Cancelled'
      AND t.\`is_deleted\` = 0
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
  const range = getPeriodDateRange(period);
  
  const sql = `
    SELECT COUNT(DISTINCT wo.\`project_ids\`) as count
    FROM \`work-orders\` wo
    WHERE wo.\`type\` = 'Install'
      AND wo.\`site-visit-appointment\` IS NOT NULL
      AND wo.\`site-visit-appointment\` >= '${range.start}'
      AND wo.\`site-visit-appointment\` <= '${range.end}'
      AND wo.\`is_deleted\` = 0
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
  
  const sql = `
    SELECT AVG(DATEDIFF(\`install-appointment\`, \`packet-approval\`)) as avg_days
    FROM \`timeline\`
    WHERE \`packet-approval\` IS NOT NULL
      AND \`install-appointment\` IS NOT NULL
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = GOALS.avg_days_pp_to_install[period as keyof typeof GOALS.avg_days_pp_to_install];
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

export async function getAvgDaysInstallToM2(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('t.`install-complete`', period);
  
  const sql = `
    SELECT AVG(DATEDIFF(pd.\`m2-approved\`, t.\`install-complete\`)) as avg_days
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-id\` = pd.\`project-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND pd.\`m2-approved\` IS NOT NULL
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = GOALS.avg_days_install_to_m2[period as keyof typeof GOALS.avg_days_install_to_m2];
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

export async function getAvgDaysPPToPTO(period: TimePeriod): Promise<KPIValue> {
  const dateFilter = buildDateFilter('`pto-received`', period);
  
  const sql = `
    SELECT AVG(DATEDIFF(\`pto-received\`, \`packet-approval\`)) as avg_days
    FROM \`timeline\`
    WHERE \`packet-approval\` IS NOT NULL
      AND \`pto-received\` IS NOT NULL
      AND ${dateFilter}
  `;
  
  const result = await queryOne<{ avg_days: number }>(sql);
  const value = result?.avg_days || 0;
  
  const goal = GOALS.avg_days_pp_to_pto[period as keyof typeof GOALS.avg_days_pp_to_pto];
  
  return {
    value,
    formatted: formatDays(value),
    goal,
    goalFormatted: goal ? formatDays(goal) : undefined,
    status: goal ? (value <= goal ? 'success' : value <= goal * 1.2 ? 'warning' : 'danger') : 'neutral',
  };
}

// =============================================================================
// RESIDENTIAL FINANCIALS
// =============================================================================

export async function getARM2M3(period: TimePeriod): Promise<KPIValue> {
  const sql = `
    SELECT SUM(\`contract-price\`) as total
    FROM \`project-data\`
    WHERE (
      (\`m2-submitted\` IS NOT NULL AND \`m2-received-date\` IS NULL)
      OR (\`m3-submitted\` IS NOT NULL AND \`m3-approved\` IS NULL)
    )
    AND \`project-status\` != 'Cancelled'
    AND \`is_deleted\` = 0
  `;
  
  const result = await queryOne<{ total: number }>(sql);
  const value = result?.total || 0;
  
  return {
    value,
    formatted: formatCurrency(value),
  };
}

export async function getRevenueReceived(period: TimePeriod): Promise<KPIValue> {
  const dateFilter1 = buildDateFilter('`m1-received-date`', period);
  const dateFilter2 = buildDateFilter('`m2-received-date`', period);
  
  const sql = `
    SELECT SUM(\`contract-price\`) as total
    FROM \`project-data\`
    WHERE (
      (\`m1-received-date\` IS NOT NULL AND ${dateFilter1})
      OR (\`m2-received-date\` IS NOT NULL AND ${dateFilter2})
    )
    AND \`is_deleted\` = 0
  `;
  
  const result = await queryOne<{ total: number }>(sql);
  const value = result?.total || 0;
  
  return {
    value,
    formatted: formatCurrency(value),
  };
}

export async function getInstallM2NotApproved(period: TimePeriod): Promise<KPIValue> {
  const sql = `
    SELECT SUM(pd.\`contract-price\`) as total
    FROM \`timeline\` t
    JOIN \`project-data\` pd ON t.\`project-id\` = pd.\`project-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND pd.\`m2-approved\` IS NULL
      AND pd.\`project-status\` != 'Cancelled'
      AND t.\`is_deleted\` = 0
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
    JOIN \`timeline\` t ON pd.\`project-id\` = t.\`project-id\`
    WHERE pd.\`project-status\` NOT IN ('Cancelled', 'Complete')
      AND t.\`pto-received\` IS NULL
      AND pd.\`is_deleted\` = 0
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
  const range = getPeriodDateRange(period);
  
  const sql = `
    SELECT SUM(pd.\`system-size\`) as total_kw
    FROM \`work-orders\` wo
    JOIN \`project-data\` pd ON wo.\`project_ids\` = pd.\`item_id\`
    WHERE wo.\`type\` = 'Install'
      AND wo.\`site-visit-appointment\` IS NOT NULL
      AND wo.\`site-visit-appointment\` >= '${range.start}'
      AND wo.\`site-visit-appointment\` <= '${range.end}'
      AND wo.\`is_deleted\` = 0
  `;
  
  const result = await queryOne<{ total_kw: number }>(sql);
  const value = result?.total_kw || 0;
  
  const goal = GOALS.total_kw_scheduled[period as keyof typeof GOALS.total_kw_scheduled];
  
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
  const goal = GOALS.total_kw_scheduled[period as keyof typeof GOALS.total_kw_scheduled] || 0;
  
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
    JOIN \`project-data\` pd ON t.\`project-id\` = pd.\`project-id\`
    WHERE t.\`install-complete\` IS NOT NULL
      AND ${dateFilter}
      AND t.\`is_deleted\` = 0
  `;
  
  const result = await queryOne<{ total_kw: number }>(sql);
  const value = result?.total_kw || 0;
  
  const goal = GOALS.total_kw_installed[period as keyof typeof GOALS.total_kw_installed];
  
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
  const goal = GOALS.total_kw_installed[period as keyof typeof GOALS.total_kw_installed] || 0;
  
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
