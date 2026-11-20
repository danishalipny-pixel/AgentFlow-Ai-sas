import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Bot,
  Clock,
  ArrowRight,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (priorityFilter !== 'all') queryParams.append('priority', priorityFilter);
      if (search) queryParams.append('search', search);

      const res = await api.get(`/tasks?${queryParams.toString()}`);
      if (res.data?.success) {
        setTasks(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleRetry = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/tasks/${taskId}/retry`);
      if (res.data?.success) {
        success('Task queued for re-execution');
        fetchTasks();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to retry task');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tasks Center</h1>
          <p className="text-xs text-gray-400 mt-1">
            Dispatch, track, inspect, and supervise autonomous agent task executions.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            const btn = document.querySelector('header button:has(svg.lucide-plus)') as HTMLButtonElement;
            if (btn) btn.click();
          }}
        >
          Dispatch Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-3 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-10 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-gold" />}
          title="No Tasks Found"
          description={search ? 'No tasks match your filters.' : 'No tasks have been executed yet in this workspace.'}
          actionLabel="Dispatch Your First Task"
          onAction={() => {
            const btn = document.querySelector('header button:has(svg.lucide-plus)') as HTMLButtonElement;
            if (btn) btn.click();
          }}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
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

            const priorityVariant =
              task.priority === 'urgent'
                ? 'rose'
                : task.priority === 'high'
                ? 'amber'
                : task.priority === 'medium'
                ? 'violet'
                : 'gray';

            return (
              <Card
                key={task.id}
                hoverEffect
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{task.title}</h3>
                      <Badge variant={statusVariant} size="sm">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={priorityVariant} size="sm" className="capitalize">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-gray-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-gray-300">
                      {task.assignedAgentId?.name || 'Supervisor Agent'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()} at{' '}
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {task.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleRetry(e, task.id)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Retry
                    </Button>
                  )}

                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
