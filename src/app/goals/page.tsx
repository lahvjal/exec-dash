"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ArrowLeft, Save, Loader2, Check, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";

interface Goals {
  [kpiId: string]: {
    [period: string]: number;
  };
}

const KPI_DEFINITIONS = [
  {
    id: "total_sales",
    name: "Total Sales",
    periods: ["current_week", "previous_week", "mtd", "ytd"],
  },
  {
    id: "installs_complete",
    name: "Installs Complete",
    periods: ["current_week", "previous_week", "mtd", "ytd"],
  },
  {
    id: "avg_days_pp_to_install",
    name: "Avg Days PP → Install",
    periods: ["current_week", "previous_week", "mtd"],
  },
  {
    id: "avg_days_install_to_m2",
    name: "Avg Days Install → M2",
    periods: ["previous_week", "ytd"],
  },
  {
    id: "avg_days_pp_to_pto",
    name: "Avg Days PP → PTO",
    periods: ["previous_week", "mtd", "ytd"],
  },
  {
    id: "total_kw_scheduled",
    name: "Total KW Scheduled",
    periods: ["current_week", "next_week"],
  },
  {
    id: "total_kw_installed",
    name: "Total KW Installed",
    periods: ["current_week", "previous_week", "mtd", "ytd"],
  },
];

const PERIOD_LABELS: Record<string, string> = {
  current_week: "Current Week",
  previous_week: "Previous Week",
  mtd: "Month to Date",
  ytd: "Year to Date",
  next_week: "Next Week",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goals>({});
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load goals
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals");
      const data = await response.json();
      
      if (data.success) {
        setGoals(data.goals);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalChange = (kpiId: string, period: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setGoals((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [period]: numValue,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setMessage({ type: "error", text: "Please enter the password first" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goals, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Goals updated successfully!" });
        // Refresh to show updated values
        await fetchGoals();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update goals" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving goals" });
    } finally {
      setSaving(false);
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Page Header */}
      <div className="px-6 pt-6 max-w-[1200px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            KPI Goals Management
          </h1>
          <p className="text-slate-600">
            Set target goals for each KPI across different time periods
          </p>
        </div>

        {/* Password Protection */}
        {!isAuthenticated && (
          <form
            onSubmit={handleAuthenticate}
            className="bg-white rounded-xl border border-slate-200 p-6 mb-6 max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">
                Authentication Required
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Enter the password to edit goals
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Unlock
            </button>
            <p className="text-xs text-slate-500 mt-3">
              Default password: aveyo2025 (can be changed in .env.local as GOALS_PASSWORD)
            </p>
          </form>
        )}

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span
              className={
                message.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {message.text}
            </span>
          </div>
        )}

        {/* Goals Form */}
        {isAuthenticated && (
          <form onSubmit={handleSave}>
            <div className="space-y-6 mb-6">
              {KPI_DEFINITIONS.map((kpi) => (
                <div
                  key={kpi.id}
                  className="bg-white rounded-xl border border-slate-200 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {kpi.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {kpi.periods.map((period) => (
                      <div key={period}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {PERIOD_LABELS[period]}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={goals[kpi.id]?.[period] || 0}
                          onChange={(e) =>
                            handleGoalChange(kpi.id, period, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-6 bg-white rounded-xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Changes will be applied immediately after saving
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Goals
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="h-20"></div>
    </div>
  );
}
