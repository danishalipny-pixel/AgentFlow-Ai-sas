import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Wrench,
  RotateCcw,
  StopCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchTaskDetails = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data?.success) {
        setTask(res.data.data);
        const stepsList = res.data.data.steps || [];
        setSteps(stepsList);

        // Auto expand all steps
        const map: Record<number, boolean> = {};
        stepsList.forEach((s: any) => {
          map[s.stepNumber] = true;
        });
        setExpandedSteps(map);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch task');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
    const interval = setInterval(fetchTaskDetails, 4000);
    return () => clearInterval(interval);
  }, [taskId]);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await api.post(`/tasks/${taskId}/retry`);
      success('Task queued for re-execution');
      fetchTaskDetails();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to retry task');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/tasks/${taskId}/cancel`);
      success('Task cancelled');
      fetchTaskDetails();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to cancel task');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-white">Task not found</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/tasks')} className="mt-4">
          Back to Tasks
        </Button>
      </div>
    );
  }

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
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Back button & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tasks Center</span>
        </button>

        <div className="flex items-center gap-3">
          {task.status === 'failed' && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleRetry}
              isLoading={isRetrying}
            >
              Retry Execution
            </Button>
          )}
          {['running', 'queued', 'waiting_approval'].includes(task.status) && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
              leftIcon={<StopCircle className="w-3.5 h-3.5" />}
              onClick={handleCancel}
            >
              Cancel Task
            </Button>
          )}
        </div>
      </div>

      {/* Task Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={statusVariant} size="md">
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="violet" size="md" className="capitalize">
                {task.priority} Priority
              </Badge>
              <span className="text-xs text-gray-400">
                Created: {new Date(task.createdAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">{task.title}</h1>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-white/5 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{task.assignedAgentId?.name || 'Supervisor Agent'}</p>
              <p className="text-[10px] text-emerald-400 font-mono font-medium">
                {task.assignedAgentId?.model || 'qwen2.5:7b'} (Local)
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed bg-surface-card p-4 rounded-xl border border-white/5 mb-6">
          {task.description}
        </p>

        {/* Telemetry row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5 text-xs">
          <div>
            <span className="text-gray-500 block mb-0.5">Execution Steps</span>
            <span className="font-bold text-white text-sm">{steps.length}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-0.5">Total Tokens</span>
            <span className="font-bold text-white text-sm">
              {task.tokenUsage?.totalTokens ? task.tokenUsage.totalTokens.toLocaleString() : '0'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-0.5">Inference Cost</span>
            <span className="font-bold text-emerald-400 text-sm">
              $0.00 (Local Free)
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-0.5">Status</span>
            <span className="font-bold text-emerald-400 text-sm capitalize">{task.status.replace('_', ' ')}</span>
          </div>
        </div>
      </Card>

      {/* Waiting Approval Alert */}
      {task.status === 'waiting_approval' && (
        <div className="p-4 rounded-xl glass-panel border border-amber-500/50 bg-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Execution Paused at Human Checkpoint</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                The agent proposed a sensitive outbound mutation requiring administrator approval before continuation.
              </p>
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={() => navigate('/approvals')}>
            Review in Approvals
          </Button>
        </div>
      )}

      {/* Step by Step Activity Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Step-by-Step Execution Trace</h2>
          <span className="text-xs text-gray-500">{steps.length} recorded events</span>
        </div>

        {steps.length === 0 ? (
          <Card className="py-12 text-center text-xs text-gray-500">
            Task is queued. Waiting for worker agent assignment...
          </Card>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => {
              const isExpanded = expandedSteps[step.stepNumber] ?? true;
              let stepIcon = <Bot className="w-4 h-4 text-gray-400" />;
              let borderColor = 'border-white/5';

              if (step.stepType === 'thought') {
                stepIcon = <Bot className="w-4 h-4 text-violet-400" />;
                borderColor = 'border-violet-500/20';
              } else if (step.stepType === 'tool_call' || step.stepType === 'tool_result') {
                stepIcon = <Wrench className="w-4 h-4 text-gold" />;
                borderColor = 'border-gold/20';
              } else if (step.stepType === 'approval_request') {
                stepIcon = <ShieldAlert className="w-4 h-4 text-amber-400" />;
                borderColor = 'border-amber-500/30';
              } else if (step.stepType === 'final_output') {
                stepIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                borderColor = 'border-emerald-500/30';
              } else if (step.stepType === 'error') {
                stepIcon = <AlertCircle className="w-4 h-4 text-rose-400" />;
                borderColor = 'border-rose-500/30';
              }

              return (
                <div
                  key={step.id || step.stepNumber}
                  className={`rounded-xl glass-panel border ${borderColor} transition-all`}
                >
                  <div
                    onClick={() => toggleStep(step.stepNumber)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        {stepIcon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-500">#{step.stepNumber}</span>
                          <span className="text-xs font-bold text-white truncate">{step.title}</span>
                          <Badge variant="gray" size="sm" className="hidden sm:inline-flex uppercase">
                            {step.stepType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{step.agentName || 'Agent'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {step.durationMs > 0 && <span>{step.durationMs}ms</span>}
                      {step.tokensUsed > 0 && <span>{step.tokensUsed} tokens</span>}
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/5 text-xs font-mono space-y-2">
                      {step.inputPayload && (
                        <div>
                          <span className="text-gray-500 block mb-1">Input Parameters:</span>
                          <pre className="p-3 rounded-lg bg-black/40 text-gray-300 overflow-x-auto text-[11px]">
                            {JSON.stringify(step.inputPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                      {step.outputPayload && (
                        <div>
                          <span className="text-emerald-400 block mb-1">Output / Deliverables:</span>
                          <pre className="p-3 rounded-lg bg-black/40 text-emerald-300 overflow-x-auto text-[11px]">
                            {JSON.stringify(step.outputPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                      {step.error && (
                        <div>
                          <span className="text-rose-400 block mb-1">Error Trace:</span>
                          <pre className="p-3 rounded-lg bg-rose-950/30 text-rose-300 overflow-x-auto text-[11px]">
                            {step.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
