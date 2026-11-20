import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Coins,
  ArrowUpRight,
  Plus,
  Play,
  GitBranch,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { activeOrg } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [analyticsRes, agentsRes, tasksRes, approvalsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/agents?limit=6'),
          api.get('/tasks?limit=5'),
          api.get('/approvals?status=pending'),
        ]);

        if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
        if (agentsRes.data?.success) setAgents(agentsRes.data.data);
        if (tasksRes.data?.success) setRecentTasks(tasksRes.data.data);
        if (approvalsRes.data?.success) setPendingApprovals(approvalsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeOrg]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-white/10 bg-gradient-to-r from-surface-card via-surface-card to-gold/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gold tracking-widest uppercase">Command Center</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {activeOrg?.name || 'Autonomous AI Workforce'}
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Real-time multi-agent telemetry, supervisory checkpoints, and workflow execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<GitBranch className="w-4 h-4 text-violet-400" />}
            onClick={() => navigate('/workflows')}
          >
            Workflow Builder
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/agents')}
          >
            Studio Agent
          </Button>
        </div>
      </div>

      {/* Critical Pending Approvals Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl glass-panel border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {pendingApprovals.length} Sensitive Action{pendingApprovals.length > 1 ? 's' : ''} Awaiting Human Authorization
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Outbound dispatches and high-impact operations paused at security checkpoints.
              </p>
            </div>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate('/approvals')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Review Approvals
          </Button>
        </div>
      )}

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Workforce Agents</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{analytics?.totalAgents || 0}</span>
              <span className="text-xs text-emerald-400 font-semibold">{analytics?.activeAgents || 0} active</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Completed Tasks</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{analytics?.completedTasks || 0}</span>
              <span className="text-xs text-gold font-semibold">{analytics?.successRate || 100}% rate</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-accent/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Avg Execution Duration</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">
                {analytics?.avgDurationMs ? (analytics.avgDurationMs / 1000).toFixed(1) : '1.2'}s
              </span>
              <span className="text-xs text-gray-400">per task</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Estimated AI Cost</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">
                ${analytics?.estimatedTotalCostUSD ? analytics.estimatedTotalCostUSD.toFixed(3) : '0.000'}
              </span>
              <span className="text-xs text-gray-400">
                {analytics?.totalTokensUsed ? (analytics.totalTokensUsed / 1000).toFixed(1) + 'k tokens' : '0 tokens'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Active Agents + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents Roster (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Active Agent Roster</h3>
              <p className="text-xs text-gray-400">Autonomous specialists ready for task delegation.</p>
            </div>
            <Link to="/agents" className="text-xs font-semibold text-gold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.slice(0, 4).map((agent) => (
              <Card key={agent.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                        <p className="text-xs text-gray-400">{agent.role}</p>
                      </div>
                    </div>
                    <Badge variant={agent.isActive ? 'emerald' : 'gray'} size="sm">
                      {agent.isActive ? 'Ready' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {agent.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono text-[11px]">{agent.model}</span>
                  <div className="flex items-center gap-2">
                    <span>{agent.toolsAllowed?.length || 0} tools</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gold p-1 h-auto"
                      onClick={() => navigate(`/tasks`)}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Execution Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Tasks</h3>
              <p className="text-xs text-gray-400">Live execution timeline.</p>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-gold hover:underline flex items-center gap-1">
              <span>All Tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="space-y-3 p-4">
            {recentTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No recent tasks executed yet.
              </div>
            ) : (
              recentTasks.map((task) => {
                const statusVariant =
                  task.status === 'completed'
                    ? 'emerald'
                    : task.status === 'running'
                    ? 'cyan'
                    : task.status === 'waiting_approval'
                    ? 'amber'
                    : task.status === 'failed'
                    ? 'rose'
                    : 'gray';

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="p-3 rounded-xl bg-surface-card border border-white/5 hover:border-gold/30 hover:bg-surface-cardHover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="text-xs font-bold text-white line-clamp-1">{task.title}</h5>
                      <Badge variant={statusVariant} size="sm">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                      <span className="capitalize">{task.priority} priority</span>
                      <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
