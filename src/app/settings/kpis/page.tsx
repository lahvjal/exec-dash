"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { 
  ArrowLeft, Plus, Edit, Trash2, Loader2, 
  Code, Database, TrendingUp, AlertCircle, CheckCircle, EyeOff 
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KPIFormModal from "@/components/kpi-form-modal";

interface KPI {
  id: string;
  name: string;
  description?: string;
  format: string;
  section_id: string;
  section_title?: string;
  is_built_in: boolean;
  is_custom: boolean;
  is_original: boolean;
  is_hidden: boolean;
  formula?: string;
  formula_type?: 'sql' | 'expression';
  secondary_formula?: string;
  secondary_format?: 'count' | 'breakdown' | 'text';
  availablePeriods?: string[];
  available_periods?: string[];
  created_at?: string;
  updated_at?: string;
}

interface KPIFormData {
  kpi_id: string;
  name: string;
  description: string;
  format: 'number' | 'currency' | 'percentage' | 'days';
  formula_type: 'sql' | 'expression';
  formula: string;
  field_mappings: Record<string, any>;
  available_periods: string[];
  section_id: string;
  is_original?: boolean;
  is_hidden?: boolean;
  secondary_formula?: string;
  secondary_format?: 'count' | 'breakdown' | 'text';
}

export default function KPIsAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<{ builtIn: KPI[]; custom: KPI[]; total: number } | null>(null);
  const [filteredKPIs, setFilteredKPIs] = useState<KPI[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [kpiTypeFilter, setKpiTypeFilter] = useState<'all' | 'original' | 'custom'>('all');
  const [showHiddenFilter, setShowHiddenFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIFormData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    if (kpis) {
      filterKPIs();
    }
  }, [kpis, searchQuery, selectedSection, kpiTypeFilter, showHiddenFilter]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/kpis', {
        headers,
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setKpis(data.kpis);
      } else {
        console.error('API returned error:', data.error);
        showNotification('error', `Failed to fetch KPIs: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification('error', `Failed to fetch KPIs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filterKPIs = () => {
    if (!kpis) return;
    
    const allKPIs = [...kpis.builtIn, ...kpis.custom];
    
    let filtered = allKPIs;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kpi =>
        kpi.name.toLowerCase().includes(query) ||
        kpi.id.toLowerCase().includes(query) ||
        kpi.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by section
    if (selectedSection !== 'all') {
      filtered = filtered.filter(kpi => kpi.section_id === selectedSection);
    }
    
    // Filter by KPI type (original vs custom)
    if (kpiTypeFilter === 'original') {
      filtered = filtered.filter(kpi => kpi.is_original || kpi.is_built_in);
    } else if (kpiTypeFilter === 'custom') {
      filtered = filtered.filter(kpi => !kpi.is_original && !kpi.is_built_in);
    }
    
    // Filter by visibility (hidden vs visible)
    if (showHiddenFilter === 'visible') {
      filtered = filtered.filter(kpi => !kpi.is_hidden);
    } else if (showHiddenFilter === 'hidden') {
      filtered = filtered.filter(kpi => kpi.is_hidden);
    }
    
    setFilteredKPIs(filtered);
  };

  const handleCreateKPI = () => {
    setEditingKPI(null);
    setShowModal(true);
  };

  const handleEditKPI = (kpi: KPI) => {
    // Allow editing of all KPIs (both original and custom)
    setEditingKPI({
      kpi_id: kpi.id,
      name: kpi.name,
      description: kpi.description || '',
      format: kpi.format as any,
      formula_type: kpi.formula_type || 'sql',
      formula: kpi.formula || '',
      field_mappings: {},
      available_periods: kpi.available_periods || kpi.availablePeriods || [],
      section_id: kpi.section_id,
      is_original: kpi.is_original,
      is_hidden: kpi.is_hidden,
      secondary_formula: kpi.secondary_formula,
      secondary_format: kpi.secondary_format
    });
    setShowModal(true);
  };

  const handleDeleteKPI = async (kpiId: string) => {
    if (!confirm('Are you sure you want to delete this KPI?')) {
      return;
    }
    
    setActionLoading(kpiId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/kpis?kpi_id=${kpiId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'KPI deleted successfully');
        fetchKPIs();
      } else {
        showNotification('error', data.error || 'Failed to delete KPI');
      }
    } catch (error) {
      console.error('Error deleting KPI:', error);
      showNotification('error', 'Failed to delete KPI');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveKPI = async (formData: KPIFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const isEdit = !!editingKPI;
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch('/api/kpis', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', `KPI ${isEdit ? 'updated' : 'created'} successfully`);
        fetchKPIs();
        setShowModal(false);
      } else {
        showNotification('error', data.error || `Failed to ${isEdit ? 'update' : 'create'} KPI`);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving KPI:', error);
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getUniqueSections = () => {
    if (!kpis) return [];
    
    const allKPIs = [...kpis.builtIn, ...kpis.custom];
    const sections = new Set(allKPIs.map(kpi => kpi.section_id));
    return Array.from(sections).sort();
  };

  const formatSectionName = (sectionId: string) => {
    return sectionId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'currency': return 'bg-green-100 text-green-700';
      case 'percentage': return 'bg-blue-100 text-blue-700';
      case 'days': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Settings</span>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              KPI Management
            </h1>
            <p className="text-slate-600">
              Manage custom KPI formulas and view all available metrics
            </p>
          </div>
          <button
            onClick={handleCreateKPI}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create Custom KPI
          </button>
        </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span className={`text-sm ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Search KPIs by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sections</option>
              {getUniqueSections().map(section => (
                <option key={section} value={section}>
                  {formatSectionName(section)}
                </option>
              ))}
            </select>
            <select
              value={kpiTypeFilter}
              onChange={(e) => setKpiTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="original">Original KPIs</option>
              <option value="custom">Custom KPIs</option>
            </select>
            <select
              value={showHiddenFilter}
              onChange={(e) => setShowHiddenFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Visible Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>
        </div>

      {/* Stats */}
      {kpis && (
        <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">Total KPIs</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{kpis.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <Code className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">Original</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{kpis.builtIn.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">Custom</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{kpis.custom.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <EyeOff className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Hidden</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {[...kpis.builtIn, ...kpis.custom].filter(k => k.is_hidden).length}
              </div>
            </div>
          </div>
      )}

      {/* KPI List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    KPI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Periods
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredKPIs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Database className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {searchQuery || selectedSection !== 'all' 
                          ? 'No KPIs match your filters' 
                          : 'No KPIs found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredKPIs.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{kpi.name}</div>
                          <div className="text-sm text-slate-500 font-mono">{kpi.id}</div>
                          {kpi.description && (
                            <div className="text-xs text-slate-500 mt-1">{kpi.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {formatSectionName(kpi.section_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFormatBadgeColor(kpi.format)}`}>
                          {kpi.format}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            kpi.is_original || kpi.is_built_in ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {kpi.is_original || kpi.is_built_in ? 'Original' : 'Custom'}
                          </span>
                          {kpi.is_hidden && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {(kpi.available_periods || kpi.availablePeriods || []).length} periods
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditKPI(kpi)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit KPI"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!kpi.is_original && !kpi.is_built_in ? (
                            <button
                              onClick={() => handleDeleteKPI(kpi.id)}
                              disabled={actionLoading === kpi.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete KPI"
                            >
                              {actionLoading === kpi.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 ml-2">Protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* KPI Form Modal */}
      <KPIFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingKPI(null);
        }}
        onSave={handleSaveKPI}
        editingKPI={editingKPI}
      />
    </div>
  );
}
