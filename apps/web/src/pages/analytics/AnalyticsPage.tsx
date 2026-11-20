import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Coins,
  Bot,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/analytics/overview');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        error(err.response?.data?.error?.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const usageTrend = data?.usageTrend || [];
  const agentPerformance = data?.agentPerformance || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Analytics & Usage Telemetry</h1>
        <p className="text-xs text-gray-400 mt-1">
          Accurate execution volume, token utilization, agent efficiency metrics, and cost modeling.
        </p>
      </div>

      {/* 4 Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs text-gray-400 font-medium">Total Cumulative Tasks</span>
          <p className="text-2xl font-extrabold text-white mt-1">{data?.totalTasks || 0}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">{data?.completedTasks || 0} completed</span>
        </Card>

        <Card>
          <span className="text-xs text-gray-400 font-medium">Global Success Rate</span>
          <p className="text-2xl font-extrabold text-gold mt-1">{data?.successRate || 100}%</p>
          <span className="text-[11px] text-gray-400">{data?.failedTasks || 0} failed runs</span>
        </Card>

        <Card>
          <span className="text-xs text-gray-400 font-medium">Tokens Consumed</span>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">
            {data?.totalTokensUsed ? (data.totalTokensUsed / 1000).toFixed(1) + 'k' : '0'}
          </p>
          <span className="text-[11px] text-gray-400">Total prompt & output tokens</span>
        </Card>

        <Card>
          <span className="text-xs text-gray-400 font-medium">Estimated AI Costs</span>
          <p className="text-2xl font-extrabold text-white mt-1">
            ${data?.estimatedTotalCostUSD ? data.estimatedTotalCostUSD.toFixed(3) : '0.000'}
          </p>
          <span className="text-[11px] text-gray-400">USD provider blended rates</span>
        </Card>
      </div>

      {/* Usage Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Executed (14 Days) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">Task Execution Volume</h3>
              <p className="text-xs text-gray-400">Daily tasks dispatched over the past 14 days</p>
            </div>
            <Badge variant="gold" size="sm">14-Day View</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageTrend}>
                <defs>
                  <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1623', borderColor: '#1f293d', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="tasksCount" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#tasksGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Token Consumption Trajectory */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Token Utilization</h3>
              <p className="text-xs text-gray-400">Cumulative LLM token throughput</p>
            </div>
            <Badge variant="violet" size="sm">Tokens</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1623', borderColor: '#1f293d', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="tokensCount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Agent Performance Leaderboard */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-1">Workforce Performance Breakdown</h3>
        <p className="text-xs text-gray-400 mb-6">Efficiency, task volume, and success rate per specialized agent.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Specialist Agent</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Tasks Handled</th>
                <th className="pb-3 font-semibold">Success Rate</th>
                <th className="pb-3 font-semibold text-right">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agentPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No individual agent executions recorded yet.
                  </td>
                </tr>
              ) : (
                agentPerformance.map((a: any) => (
                  <tr key={a.agentId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>{a.name}</span>
                    </td>
                    <td className="py-3 text-gray-400">{a.role}</td>
                    <td className="py-3 font-mono text-white">{a.tasksHandled}</td>
                    <td className="py-3">
                      <Badge variant="emerald" size="sm">{a.successRate}%</Badge>
                    </td>
                    <td className="py-3 font-mono text-gray-400 text-right">{a.avgTimeMs}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
