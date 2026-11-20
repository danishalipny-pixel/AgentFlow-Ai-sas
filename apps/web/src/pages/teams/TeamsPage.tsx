import React, { useState } from 'react';
import { Users, Bot, GitBranch, ArrowRight, ShieldCheck, Play, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface AgentSquad {
  id: string;
  name: string;
  category: string;
  description: string;
  supervisor: string;
  workers: Array<{ role: string; name: string; tools: string[] }>;
  approvalRequired: boolean;
  status: 'active' | 'ready';
}

const DEFAULT_SQUADS: AgentSquad[] = [
  {
    id: 'squad-1',
    name: 'Growth & Account Outreach Squad',
    category: 'Sales & Marketing',
    description: 'Researches prospective accounts, scores buyer intent, and drafts bespoke multi-touch outreach sequences with human gatekeeper approval.',
    supervisor: 'Enterprise Project Manager',
    workers: [
      { role: 'Research Specialist', name: 'Market Intelligence Bot', tools: ['web_fetch', 'text_summarizer'] },
      { role: 'Data Analyst', name: 'Lead Scoring Engine', tools: ['csv_reader', 'calculator'] },
      { role: 'Sales Executive', name: 'Strategic Outreach Agent', tools: ['text_summarizer'] },
    ],
    approvalRequired: true,
    status: 'active',
  },
  {
    id: 'squad-2',
    name: 'Software Quality & Security Review Team',
    category: 'Engineering & DevSecOps',
    description: 'Performs static code review, scans pull request diffs for OWASP vulnerabilities, and drafts architectural refactoring pull requests.',
    supervisor: 'Senior Developer Agent',
    workers: [
      { role: 'Developer Specialist', name: 'Static Code Inspector', tools: ['structured_parser'] },
      { role: 'Developer Specialist', name: 'Security Vulnerability Auditor', tools: ['calculator'] },
    ],
    approvalRequired: true,
    status: 'active',
  },
  {
    id: 'squad-3',
    name: 'Customer Support Escalation Squad',
    category: 'Customer Operations',
    description: 'Answers customer inquiries strictly grounded in organization documentation, with automated tier-2 human escalation.',
    supervisor: 'Customer Support Lead',
    workers: [
      { role: 'Knowledge Assistant', name: 'Knowledge Retrieval Worker', tools: ['knowledge_search'] },
      { role: 'Summarizer Specialist', name: 'Ticket Resolution Drafter', tools: ['text_summarizer'] },
    ],
    approvalRequired: false,
    status: 'ready',
  },
];

export const TeamsPage: React.FC = () => {
  const [squads] = useState<AgentSquad[]>(DEFAULT_SQUADS);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Multi-Agent Teams</h1>
          <p className="text-xs text-gray-400 mt-1">
            Orchestrate collaborative agent squads with supervisor coordination and shared context handoffs.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={() => navigate('/workflows')}
        >
          Design Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {squads.map((squad) => (
          <Card key={squad.id} hoverEffect className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-violet-accent/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-violetGlow">
                  <Users className="w-6 h-6" />
                </div>
                <Badge variant={squad.status === 'active' ? 'emerald' : 'cyan'} size="sm">
                  {squad.status === 'active' ? 'Autonomous Ready' : 'Standby'}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{squad.name}</h3>
              <p className="text-xs text-gold font-medium mb-3">{squad.category}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">{squad.description}</p>

              {/* Hierarchy */}
              <div className="p-3.5 rounded-xl bg-surface-card border border-white/5 space-y-3 mb-6">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Supervisor Node
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Bot className="w-3.5 h-3.5 text-gold" />
                    <span>{squad.supervisor}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Specialized Workers ({squad.workers.length})
                  </span>
                  <div className="space-y-1.5">
                    {squad.workers.map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-300">
                        <span className="truncate">{w.name}</span>
                        <span className="text-[10px] text-gray-500">{w.tools.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {squad.approvalRequired && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-amber-400">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Human Approval Checkpoint Mandated</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="gold"
              size="sm"
              className="w-full"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              onClick={() => navigate('/tasks')}
            >
              Dispatch Squad Mission
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
