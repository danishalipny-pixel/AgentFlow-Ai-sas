import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  FileCode,
  Search,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { ApprovalStatus } from '@agentflow/shared';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Decision State
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/approvals${query}`);
      if (res.data?.success) {
        setApprovals(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const openDecisionModal = (approval: any, dec: 'approved' | 'rejected') => {
    setSelectedApproval(approval);
    setDecision(dec);
    setComment('');
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    try {
      setIsSubmitting(true);
      const res = await api.post(`/approvals/${selectedApproval.id}/resolve`, {
        decision,
        comment,
      });

      if (res.data?.success) {
        success(`Action ${decision.toUpperCase()} successfully. Execution has been updated.`);
        setSelectedApproval(null);
        fetchApprovals();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to resolve approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Human Approval Center</h1>
          <p className="text-xs text-gray-400 mt-1">
            Supervisory authorization gates for external communications, data mutations, and sensitive operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-gold text-black shadow-glow'
                  : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-gold" />}
          title="All Clear — No Pending Approvals"
          description={
            statusFilter === 'pending'
              ? 'No sensitive agent operations are currently awaiting authorization.'
              : 'No approvals found for this filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const isPending = approval.status === ApprovalStatus.PENDING;
            const badgeVariant =
              approval.status === ApprovalStatus.APPROVED
                ? 'emerald'
                : approval.status === ApprovalStatus.REJECTED
                ? 'rose'
                : 'amber';

            return (
              <Card key={approval.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Badge variant={badgeVariant} size="md" className="uppercase">
                        {approval.status}
                      </Badge>
                      <Badge variant="violet" size="sm" className="uppercase">
                        {approval.actionType.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        Requested: {new Date(approval.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {approval.actionTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                      <Bot className="w-3.5 h-3.5 text-gold" />
                      <span>
                        Requesting Agent: <strong className="text-white">{approval.requestingAgentName}</strong>
                      </span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => openDecisionModal(approval, 'rejected')}
                      >
                        Reject Action
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => openDecisionModal(approval, 'approved')}
                      >
                        Approve & Resume
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reason Rationale */}
                <div className="p-3.5 rounded-xl bg-surface-card border border-white/5 space-y-2 mb-4">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Agent Justification & Safety Rationale:
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed">{approval.reason}</p>
                </div>

                {/* Action Payload Preview */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Proposed Payload / Action Parameters:
                  </span>
                  <pre className="p-3.5 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                    {JSON.stringify(approval.actionPayload, null, 2)}
                  </pre>
                </div>

                {/* Decision Comment if already resolved */}
                {approval.decisionComment && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2 text-xs text-gray-400">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white font-semibold">Supervisor Feedback:</span>{' '}
                      <span>{approval.decisionComment}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Resolution Modal */}
      <Modal
        isOpen={Boolean(selectedApproval)}
        onClose={() => setSelectedApproval(null)}
        title={decision === 'approved' ? 'Authorize Proposed Action' : 'Reject Proposed Action'}
        description={`Confirm your decision for: ${selectedApproval?.actionTitle}`}
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <p className="text-xs text-gray-300">
            {decision === 'approved'
              ? 'Approving this action will immediately resume task execution and allow the agent to execute the requested outbound mutation.'
              : 'Rejecting this action will halt the task execution in a failed status and notify the user.'}
          </p>

          <Textarea
            label="Decision Note / Audit Justification (Optional)"
            placeholder="e.g. Verified target recipients and approved pricing terms."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedApproval(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decision === 'approved' ? 'gold' : 'danger'}
              size="sm"
              isLoading={isSubmitting}
            >
              Confirm {decision.toUpperCase()}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
