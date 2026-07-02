'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '../../components/AdminGuard';
import { ShieldAlert, RefreshCw, Key, Laptop, Globe, Info } from 'lucide-react';

interface LogItem {
  id: string;
  log_type: 'activation' | 'security';
  license_id: string;
  plan_name: string;
  device_hash: string;
  action: string;
  ip_address: string;
  country: string;
  created_at: string;
  details: any;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'activations' | 'security'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      router.push('/login?expired=true');
      throw new Error('Unauthorized');
    }
    return res;
  };

  const fetchLogs = async () => {
    try {
      const res = await fetchWithAuth(`/api/admin/logs?type=${typeFilter}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [typeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  return (
    <AdminGuard>
      <div className="p-8 ml-64 bg-[#070b13] min-h-screen text-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System & Security Logs</h1>
            <p className="text-xs text-slate-400 mt-1">Audit log records of activations, heartbeats, and threat detection events</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-300 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'activations', 'security'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setLoading(true);
                setTypeFilter(filter);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                typeFilter === filter
                  ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'all' && 'All Logs'}
              {filter === 'activations' && 'Activations & Heartbeats'}
              {filter === 'security' && 'Security & Tampering Alerts'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm animate-pulse">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <span className="text-sm text-slate-500">No logs found in this category.</span>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Event Type / ID</th>
                    <th className="py-4 px-6">Licensing Plan</th>
                    <th className="py-4 px-6">Device Fingerprint</th>
                    <th className="py-4 px-6">IP & Geolocation</th>
                    <th className="py-4 px-6">Logged Time</th>
                    <th className="py-4 px-6">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                            log.log_type === 'security'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 block mt-1 font-mono">{log.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Key className="w-3 h-3 text-brand-500" />
                          {log.plan_name}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5" title="License ID">{log.license_id}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                          {log.device_hash !== 'N/A' ? `${log.device_hash.substring(0, 12)}...` : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          {log.ip_address} <span className="text-slate-500">({log.country || 'Unknown'})</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500 max-w-xs truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                        {log.details ? (
                          <div className="flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{JSON.stringify(log.details)}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
