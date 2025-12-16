export type TimePeriod = "current_week" | "previous_week" | "mtd" | "ytd" | "next_week";

export type KPITrend = "up" | "down" | "neutral";

export type KPIStatus = "success" | "warning" | "danger" | "neutral";

export interface KPIValue {
  value: number | string;
  formatted: string;
  trend?: KPITrend;
  trendValue?: string;
  goal?: number;
  goalFormatted?: string;
  percentToGoal?: number;
  status?: KPIStatus;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description?: string;
  format: "number" | "currency" | "percentage" | "days";
  availablePeriods: TimePeriod[];
  isHighlighted?: boolean;
  showGoal?: boolean;
}

export interface KPISection {
  id: string;
  title: string;
  description?: string;
  kpis: KPIDefinition[];
}

// Dashboard sections based on docs/dashboard-layout.md
export const DASHBOARD_SECTIONS: KPISection[] = [
  {
    id: "sales_pipeline",
    title: "Sales & Approval Pipeline",
    description: "High-level snapshot of sales performance and approval efficiency",
    kpis: [
      {
        id: "total_sales",
        name: "Total Sales",
        description: "Number of residential contracts sold",
        format: "number",
        availablePeriods: ["current_week", "mtd", "ytd"],
        showGoal: true,
      },
      {
        id: "total_sales_goal",
        name: "Total Sales Goal",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
      },
      {
        id: "aveyo_approved",
        name: "Aveyo Approved",
        description: "Sales that passed internal QA/validation",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
      },
      {
        id: "pull_through_rate",
        name: "Pull Through Rate",
        description: "Aveyo Approved / Total Sales",
        format: "percentage",
        availablePeriods: ["current_week", "mtd"],
      },
    ],
  },
  {
    id: "install_operations",
    title: "Install Operations",
    description: "Operational throughput and bottleneck indicators",
    kpis: [
      {
        id: "jobs_on_hold",
        name: "Jobs Placed ON HOLD",
        description: "Jobs paused due to outstanding requirements",
        format: "number",
        availablePeriods: ["current_week", "previous_week"],
        isHighlighted: true,
      },
      {
        id: "installs_complete",
        name: "Installs Complete",
        description: "Total installations completed",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        showGoal: true,
      },
      {
        id: "install_completion_goal",
        name: "Install Completion Goal",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
      },
      {
        id: "install_complete_no_pto",
        name: "Install Complete NO PTO",
        description: "Installs finished but awaiting Permission to Operate",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        isHighlighted: true,
      },
      {
        id: "install_scheduled",
        name: "Install Scheduled",
        description: "Future installations on calendar",
        format: "number",
        availablePeriods: ["current_week", "next_week"],
      },
    ],
  },
  {
    id: "cycle_times",
    title: "Cycle Times",
    description: "Speed of progression through the project pipeline",
    kpis: [
      {
        id: "avg_days_pp_to_install",
        name: "Avg Days PP → Install Start",
        description: "Time from Perfect Packet to install start",
        format: "days",
        availablePeriods: ["current_week", "previous_week", "mtd"],
        showGoal: true,
      },
      {
        id: "avg_days_install_to_m2",
        name: "Avg Days Install → M2 Approved",
        description: "Time from install completion to M2 milestone",
        format: "days",
        availablePeriods: ["previous_week", "ytd"],
        showGoal: true,
      },
      {
        id: "avg_days_pp_to_pto",
        name: "Avg Days PP → PTO",
        description: "Total time from PP submission to PTO",
        format: "days",
        availablePeriods: ["previous_week", "mtd", "ytd"],
        showGoal: true,
      },
    ],
  },
  {
    id: "residential_financials",
    title: "Residential Financials",
    description: "Financial state including cash flow and pending payments",
    kpis: [
      {
        id: "ar_m2_m3",
        name: "A/R (M2/M3 Submitted Not Received)",
        description: "Outstanding accounts receivable",
        format: "currency",
        availablePeriods: ["current_week", "previous_week", "mtd"],
      },
      {
        id: "revenue_received",
        name: "Revenue Received",
        description: "Payments received in period",
        format: "currency",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
      },
      {
        id: "install_m2_not_approved",
        name: "Install Complete M2 Not Approved",
        description: "Financial backlog - install done but M2 incomplete",
        format: "currency",
        availablePeriods: ["ytd"],
        isHighlighted: true,
      },
      {
        id: "total_holdback",
        name: "Total Holdback Outstanding",
        description: "Money withheld until milestones pass",
        format: "currency",
        availablePeriods: [],
      },
      {
        id: "total_dca",
        name: "Total DCA Outstanding",
        description: "Amount in Document Control Audit",
        format: "currency",
        availablePeriods: [],
        isHighlighted: true,
      },
    ],
  },
  {
    id: "active_pipeline",
    title: "Active Pipeline",
    description: "Projects actively progressing toward PTO",
    kpis: [
      {
        id: "active_no_pto",
        name: "Active Pipeline (Active NO PTO)",
        description: "Active jobs that haven't achieved PTO",
        format: "number",
        availablePeriods: ["current_week", "previous_week"],
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial Division",
    description: "Commercial KPIs based on KW capacity",
    kpis: [
      {
        id: "total_kw_scheduled",
        name: "Total KW Scheduled",
        description: "KW capacity scheduled",
        format: "number",
        availablePeriods: ["current_week", "next_week"],
        showGoal: true,
      },
      {
        id: "kw_scheduled_goal",
        name: "KW Scheduled Goal",
        format: "number",
        availablePeriods: ["previous_week"],
      },
      {
        id: "total_kw_installed",
        name: "Total KW Installed",
        description: "KW capacity actually installed",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        showGoal: true,
      },
      {
        id: "kw_installed_goal",
        name: "KW Installed Goal",
        format: "number",
        availablePeriods: [],
      },
      {
        id: "ar_commercial",
        name: "A/R (Commercial)",
        description: "Outstanding commercial receivables",
        format: "currency",
        availablePeriods: ["current_week"],
      },
      {
        id: "revenue_received_commercial",
        name: "Revenue Received (Commercial)",
        description: "Commercial revenue collected",
        format: "currency",
        availablePeriods: ["mtd"],
      },
    ],
  },
];

