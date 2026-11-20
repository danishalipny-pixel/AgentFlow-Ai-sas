import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Layers,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { PlanTier } from '@agentflow/shared';

const PLANS = [
  {
    tier: PlanTier.FREE,
    name: 'Free Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individual builders experimenting with multi-agent automation.',
    features: ['3 Active Agents', '50 Tasks / month', '50 MB Document Storage', '2 Team Members', 'Standard LLM Models'],
  },
  {
    tier: PlanTier.STARTER,
    name: 'Team Starter',
    price: '$49',
    period: 'per month',
    description: 'For growing teams requiring continuous task execution and basic tools.',
    features: ['10 Active Agents', '500 Tasks / month', '500 MB Document Storage', '5 Team Members', 'All Standard Tools', 'SSRF Guarded Web Fetch'],
  },
  {
    tier: PlanTier.PRO,
    name: 'Professional',
    price: '$149',
    period: 'per month',
    popular: true,
    description: 'Comprehensive workforce management with advanced human approvals.',
    features: ['25 Active Agents', '2,500 Tasks / month', '2 GB Document Storage', '15 Team Members', 'Custom Python Tools', 'Priority Execution Queues'],
  },
  {
    tier: PlanTier.BUSINESS,
    name: 'Business',
    price: '$399',
    period: 'per month',
    description: 'High-throughput agent orchestration for established organizations.',
    features: ['100 Active Agents', '10,000 Tasks / month', '10 GB Document Storage', '50 Team Members', 'Dedicated BullMQ Concurrency', 'Custom Domain Allowlisting'],
  },
  {
    tier: PlanTier.ENTERPRISE,
    name: 'Enterprise VIP',
    price: 'Custom',
    period: 'annual billing',
    description: 'Bespoke agent architecture with custom SLAs and air-gapped deployment.',
    features: ['Unlimited Agents', 'Unlimited Tasks', '100 GB+ Storage', 'Unlimited Team Members', 'On-Premise / VPC Option', '24/7 Dedicated Architect Support'],
  },
];

export const BillingPage: React.FC = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  const { success, error, warning } = useToast();

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/subscriptions');
      if (res.data?.success) {
        setSubscriptionData(res.data.data);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleSelectPlan = async (targetTier: PlanTier) => {
    try {
      setUpdatingPlan(targetTier);
      const res = await api.post('/subscriptions/change-plan', { plan: targetTier });
      if (res.data?.success) {
        success(`Workspace plan updated to ${targetTier.toUpperCase()}`);
        fetchSubscription();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update plan');
    } finally {
      setUpdatingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const sub = subscriptionData?.subscription;
  const isStripeConfigured = subscriptionData?.isStripeConfigured;
  const currentPlan = sub?.plan || PlanTier.FREE;
  const limits = sub?.limits || { maxAgents: 3, maxTasksPerMonth: 50, maxStorageMb: 50, maxTeamMembers: 2 };
  const usage = sub?.currentUsage || { agentsCount: 0, tasksThisMonth: 0, storageUsedMb: 0, teamMembersCount: 1 };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Subscription & Quota Management</h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor resource utilization against your active subscription tier.
        </p>
      </div>

      {!isStripeConfigured && (
        <div className="p-4 rounded-xl glass-panel border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-white">Stripe Payments Not Configured</h4>
            <p className="text-gray-300 mt-0.5">
              To process live customer credit card payments and webhooks, configure <code className="text-gold">STRIPE_SECRET_KEY</code> in your environment. Plan switching is operating in development entitlement mode.
            </p>
          </div>
        </div>
      )}

      {/* Current Quota Consumption Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Active Workspace Plan</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-white uppercase">{currentPlan}</h2>
              <Badge variant="emerald" size="sm">Active Subscription</Badge>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Billing Cycle Renews: <strong className="text-white">{new Date(sub?.currentPeriodEnd).toLocaleDateString()}</strong>
          </div>
        </div>

        {/* 4 Usage Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Agents */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Agents Created</span>
              <span className="font-mono text-white font-bold">{usage.agentsCount} / {limits.maxAgents}</span>
            </div>
            <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.agentsCount / limits.maxAgents) * 100)}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Tasks This Month</span>
              <span className="font-mono text-white font-bold">{usage.tasksThisMonth} / {limits.maxTasksPerMonth}</span>
            </div>
            <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.tasksThisMonth / limits.maxTasksPerMonth) * 100)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Knowledge Storage</span>
              <span className="font-mono text-white font-bold">{usage.storageUsedMb} MB / {limits.maxStorageMb} MB</span>
            </div>
            <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-violet-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.storageUsedMb / limits.maxStorageMb) * 100)}%` }}
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Team Members</span>
              <span className="font-mono text-white font-bold">{usage.teamMembersCount} / {limits.maxTeamMembers}</span>
            </div>
            <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.teamMembersCount / limits.maxTeamMembers) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Available Plans Comparison Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-4">Available Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentPlan;
            const isUpdating = updatingPlan === plan.tier;

            return (
              <Card
                key={plan.tier}
                className={`p-5 flex flex-col justify-between ${
                  plan.popular ? 'border-gold shadow-glow' : 'border-white/10'
                }`}
              >
                <div>
                  {plan.popular && (
                    <Badge variant="gold" size="sm" className="mb-2">
                      Most Popular
                    </Badge>
                  )}
                  <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-[11px] text-gray-500 block">{plan.period}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{plan.description}</p>

                  <ul className="space-y-2 text-xs text-gray-300 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={isCurrent ? 'outline' : 'gold'}
                  size="sm"
                  className="w-full text-xs"
                  disabled={isCurrent}
                  isLoading={isUpdating}
                  onClick={() => handleSelectPlan(plan.tier)}
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
