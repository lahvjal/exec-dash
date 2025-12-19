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

export interface KPICalculationMeta {
  calculation: string;
  dataSources: {
    table: string;
    fields: string[];
  }[];
  formula: string;
  notes?: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description?: string;
  format: "number" | "currency" | "percentage" | "days";
  availablePeriods: TimePeriod[];
  isHighlighted?: boolean;
  showGoal?: boolean;
  calculationMeta?: KPICalculationMeta;
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
        calculationMeta: {
          calculation: "Counts all signed contracts in the selected period, excluding cancelled projects and duplicates.",
          dataSources: [
            {
              table: "timeline",
              fields: ["contract-signed", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["project-status", "project-dev-id"]
            }
          ],
          formula: "COUNT(*) WHERE contract-signed IS NOT NULL AND project-status != 'Cancelled' AND cancellation-reason != 'Duplicate Project (Error)'",
          notes: "Filters out 161 duplicate projects and all cancelled projects."
        }
      },
      {
        id: "total_sales_goal",
        name: "Total Sales Goal",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        calculationMeta: {
          calculation: "Target number of sales for the selected period, configured in the Goals page.",
          dataSources: [
            {
              table: "goals (Supabase)",
              fields: ["value", "kpi_id", "period"]
            }
          ],
          formula: "Static value from goals table",
          notes: "Editable via the Goals management page."
        }
      },
      {
        id: "aveyo_approved",
        name: "Aveyo Approved",
        description: "Sales that passed internal QA/validation",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        calculationMeta: {
          calculation: "Counts distinct projects with an approved Scope of Work (SOW) timestamp, excluding cancelled projects.",
          dataSources: [
            {
              table: "customer-sow",
              fields: ["sow-approved-timestamp", "project-id"]
            },
            {
              table: "project-data",
              fields: ["project-status", "project-id"]
            }
          ],
          formula: "COUNT(DISTINCT project-id) WHERE sow-approved-timestamp IS NOT NULL AND project-status != 'Cancelled'",
          notes: "Uses simple project-id field (not project-dev-id) for joining."
        }
      },
      {
        id: "pull_through_rate",
        name: "Pull Through Rate",
        description: "Active projects / Total Sales",
        format: "percentage",
        availablePeriods: ["current_week", "mtd"],
        calculationMeta: {
          calculation: "Percentage of sales that remain active in the pipeline (not cancelled or pending cancel).",
          dataSources: [
            {
              table: "timeline",
              fields: ["contract-signed", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["project-status", "project-dev-id"]
            }
          ],
          formula: "(COUNT(Active + Complete + Pre-Approvals + New Lender + Finance Hold) / Total Sales) × 100",
          notes: "Measures retention rate of signed contracts through the pipeline."
        }
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
        calculationMeta: {
          calculation: "Counts all projects with 'On Hold' status, excluding duplicates.",
          dataSources: [
            {
              table: "project-data",
              fields: ["project-status", "project-dev-id"]
            },
            {
              table: "timeline",
              fields: ["cancellation-reason", "project-dev-id"]
            }
          ],
          formula: "COUNT(*) WHERE project-status = 'On Hold' AND cancellation-reason != 'Duplicate Project (Error)'",
          notes: "Currently 276 projects on hold. Highlighted to draw attention to bottlenecks."
        }
      },
      {
        id: "installs_complete",
        name: "Installs Complete",
        description: "Total installations completed",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        showGoal: true,
        calculationMeta: {
          calculation: "Counts installations marked as complete within the period, filtering out duplicates.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-complete", "install-stage-status", "cancellation-reason"]
            }
          ],
          formula: "COUNT(*) WHERE install-complete IS NOT NULL AND install-stage-status = 'Complete' AND cancellation-reason != 'Duplicate Project (Error)'",
          notes: "Only counts installs with stage status 'Complete' (3,003 total records)."
        }
      },
      {
        id: "install_completion_goal",
        name: "Install Completion Goal",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        calculationMeta: {
          calculation: "Target number of installations for the selected period.",
          dataSources: [
            {
              table: "goals (Supabase)",
              fields: ["value", "kpi_id", "period"]
            }
          ],
          formula: "Static value from goals table",
          notes: "Editable via the Goals management page."
        }
      },
      {
        id: "install_complete_no_pto",
        name: "Install Complete NO PTO",
        description: "Installs finished but awaiting Permission to Operate",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        isHighlighted: true,
        calculationMeta: {
          calculation: "Counts completed installations that have not yet received Permission to Operate (PTO).",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-complete", "pto-received", "install-stage-status", "cancellation-reason"]
            }
          ],
          formula: "COUNT(*) WHERE install-complete IS NOT NULL AND pto-received IS NULL AND install-stage-status = 'Complete'",
          notes: "Highlighted as a bottleneck indicator. Filtered by install-complete date within period."
        }
      },
      {
        id: "install_scheduled",
        name: "Install Scheduled",
        description: "Future installations on calendar",
        format: "number",
        availablePeriods: ["current_week", "next_week"],
        calculationMeta: {
          calculation: "Counts all installations scheduled within the selected period.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-appointment", "cancellation-reason"]
            }
          ],
          formula: "COUNT(*) WHERE install-appointment IS NOT NULL AND install-appointment IN [period] AND cancellation-reason != 'Duplicate Project (Error)'",
          notes: "Shows upcoming workload for installation teams."
        }
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
        calculationMeta: {
          calculation: "Average number of days between Perfect Packet approval and installation appointment. Lower is better.",
          dataSources: [
            {
              table: "timeline",
              fields: ["packet-approval", "install-appointment", "cancellation-reason"]
            }
          ],
          formula: "AVG(DATEDIFF(install-appointment, packet-approval)) WHERE both dates are NOT NULL",
          notes: "TODO: Update to MEDIAN for more accurate representation. Only 37.7% of projects have packet-approval dates (2,285 records)."
        }
      },
      {
        id: "avg_days_install_to_m2",
        name: "Avg Days Install → M2 Approved",
        description: "Time from install appointment to M2 milestone",
        format: "days",
        availablePeriods: ["previous_week", "ytd"],
        showGoal: true,
        calculationMeta: {
          calculation: "Average number of days between installation appointment and M2 milestone approval. Lower is better.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-appointment", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["m2-approved", "project-dev-id"]
            }
          ],
          formula: "AVG(DATEDIFF(m2-approved, install-appointment)) WHERE both dates are NOT NULL",
          notes: "TODO: Update to MEDIAN. M2-approved coverage: 47.7% (2,893 records)."
        }
      },
      {
        id: "avg_days_pp_to_pto",
        name: "Avg Days PP → PTO",
        description: "Total time from PP submission to PTO",
        format: "days",
        availablePeriods: ["previous_week", "mtd", "ytd"],
        showGoal: true,
        calculationMeta: {
          calculation: "Average total cycle time from Perfect Packet approval to Permission to Operate. Lower is better.",
          dataSources: [
            {
              table: "timeline",
              fields: ["packet-approval", "pto-received", "cancellation-reason"]
            }
          ],
          formula: "AVG(DATEDIFF(pto-received, packet-approval)) WHERE both dates are NOT NULL",
          notes: "TODO: Update to MEDIAN. Complete cycle time metric. PTO-received coverage: 44.8% (2,713 records)."
        }
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
        calculationMeta: {
          calculation: "Sum of M2 (80% of contract) and M3 (20% of contract) amounts that have been submitted but not yet received.",
          dataSources: [
            {
              table: "project-data",
              fields: ["m2-submitted", "m2-received-date", "m3-submitted", "m3-approved", "contract-price", "project-dev-id"]
            },
            {
              table: "timeline",
              fields: ["cancellation-reason", "project-dev-id"]
            }
          ],
          formula: "SUM(contract-price * 0.8 WHERE m2-submitted NOT NULL AND m2-received-date IS NULL) + SUM(contract-price * 0.2 WHERE m3-submitted NOT NULL AND m3-approved IS NULL)",
          notes: "M2 = 80%, M3 = 20% of contract price. Excludes cancelled and duplicate projects."
        }
      },
      {
        id: "revenue_received",
        name: "Revenue Received",
        description: "Payments received in period",
        format: "currency",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        calculationMeta: {
          calculation: "Total revenue received within the selected period from M1 (20%) and M2 (80%) milestone payments.",
          dataSources: [
            {
              table: "project-data",
              fields: ["m1-received-date", "m2-received-date", "contract-price", "project-dev-id"]
            },
            {
              table: "timeline",
              fields: ["cancellation-reason", "project-dev-id"]
            }
          ],
          formula: "SUM(contract-price * 0.2 WHERE m1-received-date IN [period]) + SUM(contract-price * 0.8 WHERE m2-received-date IN [period])",
          notes: "M1 = 20%, M2 = 80% of contract price. Excludes duplicate projects."
        }
      },
      {
        id: "install_m2_not_approved",
        name: "Install Complete M2 Not Approved",
        description: "Financial backlog - install done but M2 incomplete",
        format: "currency",
        availablePeriods: ["ytd"],
        isHighlighted: true,
        calculationMeta: {
          calculation: "Sum of M2 milestone amounts (80% of contract price) for completed installations that haven't received M2 approval.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-complete", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["contract-price", "m2-approved", "project-dev-id"]
            }
          ],
          formula: "SUM(contract-price * 0.8) WHERE install-complete IS NOT NULL AND m2-approved IS NULL",
          notes: "Highlighted to show financial bottleneck. Represents money ready to bill but paperwork incomplete."
        }
      },
      {
        id: "total_holdback",
        name: "Total Holdback Outstanding",
        description: "Money withheld until milestones pass",
        format: "currency",
        availablePeriods: [],
        calculationMeta: {
          calculation: "Total funds held back by lenders pending milestone completion or inspection.",
          dataSources: [
            {
              table: "TBD",
              fields: ["holdback_amount"]
            }
          ],
          formula: "Pending data source clarification",
          notes: "⚠️ Data source not yet identified in database schema."
        }
      },
      {
        id: "total_dca",
        name: "Total DCA Outstanding",
        description: "Amount in Document Control Audit",
        format: "currency",
        availablePeriods: [],
        isHighlighted: true,
        calculationMeta: {
          calculation: "Total funds held in Document Control Audit pending document verification.",
          dataSources: [
            {
              table: "TBD",
              fields: ["dca_amount"]
            }
          ],
          formula: "Pending data source clarification",
          notes: "⚠️ Data source not yet identified in database schema. Highlighted due to importance."
        }
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
        calculationMeta: {
          calculation: "Counts all projects with active statuses that have not yet received Permission to Operate (PTO).",
          dataSources: [
            {
              table: "project-data",
              fields: ["project-status", "project-dev-id"]
            },
            {
              table: "timeline",
              fields: ["pto-received", "cancellation-reason", "project-dev-id"]
            }
          ],
          formula: "COUNT(*) WHERE project-status IN ('Active', 'Complete', 'Pre-Approvals', 'New Lender', 'Finance Hold') AND pto-received IS NULL",
          notes: "No time period filter - shows all active projects without PTO. Excludes duplicates and cancelled projects."
        }
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
        calculationMeta: {
          calculation: "Sum of system sizes (in KW) for installations scheduled but not yet completed in the period.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-appointment", "install-complete", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["system-size", "project-dev-id"]
            }
          ],
          formula: "SUM(system-size) WHERE install-appointment IN [period] AND install-complete IS NULL",
          notes: "Measures planned installation capacity. Excludes duplicates."
        }
      },
      {
        id: "kw_scheduled_goal",
        name: "KW Scheduled Goal",
        format: "number",
        availablePeriods: ["previous_week"],
        calculationMeta: {
          calculation: "Target KW capacity to schedule for the period.",
          dataSources: [
            {
              table: "goals (Supabase)",
              fields: ["value", "kpi_id", "period"]
            }
          ],
          formula: "Static value from goals table",
          notes: "Editable via the Goals management page."
        }
      },
      {
        id: "total_kw_installed",
        name: "Total KW Installed",
        description: "KW capacity actually installed",
        format: "number",
        availablePeriods: ["current_week", "previous_week", "mtd", "ytd"],
        showGoal: true,
        calculationMeta: {
          calculation: "Sum of system sizes (in KW) for installations completed within the period.",
          dataSources: [
            {
              table: "timeline",
              fields: ["install-complete", "cancellation-reason", "project-dev-id"]
            },
            {
              table: "project-data",
              fields: ["system-size", "project-dev-id"]
            }
          ],
          formula: "SUM(system-size) WHERE install-complete IN [period] AND cancellation-reason != 'Duplicate Project (Error)'",
          notes: "Measures actual installation capacity delivered. System-size has 100% coverage."
        }
      },
      {
        id: "kw_installed_goal",
        name: "KW Installed Goal",
        format: "number",
        availablePeriods: [],
        calculationMeta: {
          calculation: "Target KW capacity to install for the period.",
          dataSources: [
            {
              table: "goals (Supabase)",
              fields: ["value", "kpi_id", "period"]
            }
          ],
          formula: "Static value from goals table",
          notes: "Editable via the Goals management page."
        }
      },
      {
        id: "ar_commercial",
        name: "A/R (Commercial)",
        description: "Outstanding commercial receivables",
        format: "currency",
        availablePeriods: ["current_week"],
        calculationMeta: {
          calculation: "Outstanding accounts receivable for commercial projects (same calculation as residential A/R).",
          dataSources: [
            {
              table: "accounting (pending)",
              fields: ["M2_Submitted_Date", "M2_Received_Date", "M3_Submitted_Date", "M3_Received_Date"]
            },
            {
              table: "project-data",
              fields: ["contract-price", "project-id"]
            }
          ],
          formula: "SUM(M2 + M3) WHERE submitted NOT received (filtered by commercial flag)",
          notes: "⚠️ Commercial filter not yet implemented. Currently shows same as residential A/R."
        }
      },
      {
        id: "revenue_received_commercial",
        name: "Revenue Received (Commercial)",
        description: "Commercial revenue collected",
        format: "currency",
        availablePeriods: ["mtd"],
        calculationMeta: {
          calculation: "Total revenue received for commercial projects in the period.",
          dataSources: [
            {
              table: "accounting (pending)",
              fields: ["revenue_received", "received_date"]
            }
          ],
          formula: "SUM(revenue_received) WHERE received_date IN [period] (filtered by commercial flag)",
          notes: "⚠️ Commercial filter not yet implemented. Currently shows same as residential revenue."
        }
      },
    ],
  },
];

