'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { Plus, Trash2, ShieldAlert, CheckCircle, Search, Edit2, Ban, ShieldCheck, X } from 'lucide-react';

interface License {
  id: string;
  plan_name: string;
  plan?: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  max_devices: number;
  activation_count: number;
  notes: string;
  created_at: string;
  expires_at: string | null;
  admin_message?: string;
  support_url?: string;
  support_telegram?: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  
  // Form State
  const [planName, setPlanName] = useState('pro');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [maxDevices, setMaxDevices] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [customDays, setCustomDays] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const formatDatetimeLocal = (dateOrStr: Date | string | null) => {
    if (!dateOrStr) return '';
    const date = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
    if (isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [supportTelegram, setSupportTelegram] = useState('');

  const fetchLicenses = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/licenses?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenses(data.licenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      
      let parsedExpiry = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
          parsedExpiry = d.toISOString();
        } else {
          alert('Invalid expiration date.');
          return;
        }
      }

      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_name: planName,
          plan: planName,
          customer_name: customerName,
          customer_email: customerEmail,
          max_devices: maxDevices,
          expires_at: parsedExpiry,
          notes,
          admin_message: adminMessage,
          support_url: supportUrl,
          support_telegram: supportTelegram,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedKey(data.rawKey);
        setCreateModalOpen(false);
        setKeyModalOpen(true);
        fetchLicenses();
        // Reset form
        setPlanName('pro');
        setCustomerName('');
        setCustomerEmail('');
        setMaxDevices(1);
        setExpiresAt('');
        setNotes('');
        setAdminMessage('');
        setSupportUrl('');
        setSupportTelegram('');
      } else {
        alert(data.error || 'Failed to create license key.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + (err.message || 'Failed to create license key.'));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;

    try {
      const token = localStorage.getItem('admin_token');

      let parsedExpiry = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
          parsedExpiry = d.toISOString();
        } else {
          alert('Invalid expiration date.');
          return;
        }
      }

      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedLicense.id,
          plan_name: planName,
          plan: planName,
          customer_name: customerName,
          customer_email: customerEmail,
          max_devices: maxDevices,
          expires_at: parsedExpiry,
          notes,
          status,
          admin_message: adminMessage,
          support_url: supportUrl,
          support_telegram: supportTelegram,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditModalOpen(false);
        fetchLicenses();
      } else {
        alert(data.error || 'Failed to update license details.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + (err.message || 'Failed to update license details.'));
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAccess = async (id: string) => {
    if (!confirm('Remove this user\'s license access? Their extension will logout within ~30 seconds.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'remove_access' }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDevices = async (id: string) => {
    if (!confirm('Remove all devices for this license? User must re-activate.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'reset_devices' }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license? All associated devices will be unlinked.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/admin/licenses?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomDaysChange = (daysStr: string) => {
    setCustomDays(daysStr);
    setCustomMinutes('');
    if (!daysStr) {
      setExpiresAt('');
      return;
    }
    const days = parseInt(daysStr, 10);
    if (!isNaN(days) && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setExpiresAt(formatDatetimeLocal(date));
    }
  };

  const handleCustomMinutesChange = (minutesStr: string) => {
    setCustomMinutes(minutesStr);
    setCustomDays('');
    if (!minutesStr) {
      setExpiresAt('');
      return;
    }
    const minutes = parseInt(minutesStr, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + minutes);
      setExpiresAt(formatDatetimeLocal(date));
    }
  };

  const openCreateModal = () => {
    setPlanName('pro');
    setCustomerName('');
    setCustomerEmail('');
    setMaxDevices(1);
    setExpiresAt('');
    setCustomDays('');
    setCustomMinutes('');
    setNotes('');
    setAdminMessage('');
    setSupportUrl('');
    setSupportTelegram('');
    setCreateModalOpen(true);
  };

  const openEditModal = (license: License) => {
    setSelectedLicense(license);
    setPlanName(license.plan_name || license.plan || 'pro');
    setCustomerName(license.customer_name || '');
    setCustomerEmail(license.customer_email || '');
    setMaxDevices(license.max_devices);
    setExpiresAt(license.expires_at ? formatDatetimeLocal(license.expires_at) : '');
    setNotes(license.notes);
    setStatus(license.status || 'active');
    setAdminMessage(license.admin_message || '');
    setSupportUrl(license.support_url || '');
    setSupportTelegram(license.support_telegram || '');
    setCustomDays('');
    setCustomMinutes('');
    setEditModalOpen(true);
  };

  return (
    <AdminGuard>
      <div className="p-8 ml-64 bg-[#070b13] min-h-screen text-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">License Management</h1>
            <p className="text-xs text-slate-400 mt-1">Create and manage license keys for your users</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-xs font-bold rounded-xl text-white transition-all shadow-lg shadow-brand-600/25 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create License
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by license key, plan name, or notes..."
              className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm animate-pulse">Loading licenses...</div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <span className="text-sm text-slate-500">No licenses found matching your filters.</span>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Customer / Plan</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Devices (Used/Max)</th>
                    <th className="py-4 px-6">Expires At</th>
                    <th className="py-4 px-6">Notes</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">{lic.customer_name || lic.notes?.split('|')[0]?.trim() || '—'}</span>
                        <span className="text-[10px] text-slate-400 block">{lic.plan_name || lic.plan}</span>
                        {lic.customer_email && <span className="text-[10px] text-slate-500 block">{lic.customer_email}</span>}
                        <span className="text-[10px] text-slate-600 font-mono block mt-0.5">{lic.id.slice(0, 8)}…</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                          lic.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : lic.status === 'suspended'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {lic.activation_count} / {lic.max_devices}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 max-w-xs" title={lic.notes}>
                        <div className="truncate">{lic.notes || '—'}</div>
                        {lic.admin_message && (
                          <div className="text-[10px] text-amber-400 font-semibold mt-1 truncate" title={lic.admin_message}>
                            📢 {lic.admin_message}
                          </div>
                        )}
                        {lic.support_url && (
                          <div className="text-[10px] text-indigo-450 font-semibold truncate" title={lic.support_url}>
                            💬 {lic.support_url}
                          </div>
                        )}
                        {lic.support_telegram && (
                          <div className="text-[10px] text-sky-450 font-semibold truncate" title={lic.support_telegram}>
                            ✈️ {lic.support_telegram}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {lic.status === 'active' ? (
                          <button
                            onClick={() => handleStatusUpdate(lic.id, 'suspended')}
                            title="Suspend Key"
                            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors inline-block"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(lic.id, 'active')}
                            title="Activate Key"
                            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors inline-block"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleResetDevices(lic.id)}
                          title="Reset All Devices"
                          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors inline-block"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveAccess(lic.id)}
                          title="Remove User Access"
                          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors inline-block"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(lic)}
                          title="Edit Info"
                          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors inline-block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lic.id)}
                          title="Delete Key"
                          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors inline-block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create License */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-base">Generate New License Key</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-slate-350">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Customer Email</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Plan</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Max Devices</label>
                  <input
                    type="number"
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Days (Optional)</label>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => handleCustomDaysChange(e.target.value)}
                    placeholder="Enter validity days (e.g. 30)"
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Minutes (Optional)</label>
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => handleCustomMinutesChange(e.target.value)}
                    placeholder="Enter validity minutes (e.g. 10)"
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Expiration Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Broadcast Message (Realtime)</label>
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="E.g., System updates, warning banner..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Support URL (Realtime)</label>
                  <input
                    type="url"
                    value={supportUrl}
                    onChange={(e) => setSupportUrl(e.target.value)}
                    placeholder="E.g., https://t.me/your_support"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Support Telegram Username / Link</label>
                  <input
                    type="text"
                    value={supportTelegram}
                    onChange={(e) => setSupportTelegram(e.target.value)}
                    placeholder="E.g., @username or https://t.me/username"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="E.g. customer name, reseller ref..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Generate Key
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit License */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-base">Edit License Details</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-350">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Customer Email</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Plan</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Max Devices</label>
                  <input
                    type="number"
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Days (Optional)</label>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => handleCustomDaysChange(e.target.value)}
                    placeholder="Enter validity days (e.g. 30)"
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Minutes (Optional)</label>
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => handleCustomMinutesChange(e.target.value)}
                    placeholder="Enter validity minutes (e.g. 10)"
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Expiration Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended / Inactive</option>
                    <option value="revoked">Revoked</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Broadcast Message (Realtime)</label>
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="E.g., System updates, warning banner..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Custom Support URL (Realtime)</label>
                  <input
                    type="url"
                    value={supportUrl}
                    onChange={(e) => setSupportUrl(e.target.value)}
                    placeholder="E.g., https://t.me/your_support"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Support Telegram Username / Link</label>
                  <input
                    type="text"
                    value={supportTelegram}
                    onChange={(e) => setSupportTelegram(e.target.value)}
                    placeholder="E.g., @username or https://t.me/username"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Display Generated Key */}
        {keyModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-white text-base text-center">New License Key Created!</h3>
              <p className="text-xs text-slate-400 text-center mt-2">
                Copy this key now. It is only displayed once and is encrypted in our database.
              </p>
              
              <div className="my-6 p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="font-mono font-bold text-lg text-white select-all select-text tracking-wider">{generatedKey}</span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    alert('Copied to clipboard!');
                  }}
                  className="flex-1 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 font-semibold rounded-xl text-xs transition-colors"
                >
                  Copy Key
                </button>
                <button
                  onClick={() => setKeyModalOpen(false)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 font-semibold rounded-xl text-xs text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
