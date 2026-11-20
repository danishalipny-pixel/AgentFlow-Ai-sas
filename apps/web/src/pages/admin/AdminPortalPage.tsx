import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Users,
  Building2,
  Activity,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const AdminPortalPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orgs' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const { success, error } = useToast();

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, usersRes, orgsRes, auditRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/organizations'),
        api.get('/admin/audit-logs'),
      ]);

      if (overviewRes.data?.success) setData(overviewRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data || []);
      if (orgsRes.data?.success) setOrgs(orgsRes.data.data || []);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.data || []);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Admin portal access denied');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      if (res.data?.success) {
        success(res.data.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: res.data.data.status } : u))
        );
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to toggle status');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const health = data?.systemHealth || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Confidential</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Administration</h1>
          <p className="text-xs text-gray-400 mt-1">
            System health diagnostics, global tenant isolation oversight, and platform audit trail.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchAdminData}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          System Health & Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Global Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'orgs' ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Organizations ({orgs.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <span className="text-xs text-gray-400 font-medium">Total Registered Users</span>
              <p className="text-2xl font-extrabold text-white mt-1">{metrics.totalUsers || 0}</p>
            </Card>

            <Card>
              <span className="text-xs text-gray-400 font-medium">Total Organizations</span>
              <p className="text-2xl font-extrabold text-gold mt-1">{metrics.totalOrgs || 0}</p>
            </Card>

            <Card>
              <span className="text-xs text-gray-400 font-medium">Total Tasks Executed</span>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">{metrics.totalTasks || 0}</p>
            </Card>

            <Card>
              <span className="text-xs text-gray-400 font-medium">Audit Events Logged</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{metrics.auditLogsCount || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-white mb-4">Core Infrastructure Diagnostics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Server Status</span>
                <Badge variant="emerald" size="sm">ONLINE & HEALTHY</Badge>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Node Runtime</span>
                <span className="font-mono text-white text-sm">{health.nodeVersion || 'v20.x'}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Process Memory (RSS)</span>
                <span className="font-mono text-white text-sm">{health.memoryUsageMb || 0} MB</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Uptime</span>
                <span className="font-mono text-white text-sm">{health.uptimeSeconds || 0}s</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">User Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Admin Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                  <td className="py-3 px-4 text-gray-300 font-mono">{u.email}</td>
                  <td className="py-3 px-4">
                    {u.isPlatformAdmin ? (
                      <Badge variant="rose" size="sm">Superadmin</Badge>
                    ) : (
                      <span className="text-gray-500">User</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={u.status === 'active' ? 'emerald' : 'rose'} size="sm" className="uppercase">
                      {u.status || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!u.isPlatformAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleUserStatus(u.id)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Orgs Tab */}
      {activeTab === 'orgs' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Organization Name</th>
                <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                <th className="py-3 px-4 font-semibold">Plan Tier</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{o.name}</td>
                  <td className="py-3 px-4 text-gray-400 font-mono">{o.slug}</td>
                  <td className="py-3 px-4">
                    <Badge variant="gold" size="sm" className="uppercase">{o.plan}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Actor Email</th>
                <th className="py-3 px-4 font-semibold">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4 text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-gold">{log.action}</td>
                  <td className="py-2.5 px-4 text-gray-300">{log.actorEmail || 'System / Agent'}</td>
                  <td className="py-2.5 px-4 text-gray-400">{log.resourceType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
