import React, { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Search,
  Sparkles,
  Sliders,
  Copy,
  Trash2,
  Play,
  Check,
  Shield,
  Layers,
  Wrench,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_TOOLS = [
  { id: 'calculator', name: 'Precision Calculator', desc: 'Evaluates arithmetic and mathematical calculations' },
  { id: 'datetime_tool', name: 'Date & Time Utility', desc: 'Timestamps, timezone conversion, and day deltas' },
  { id: 'text_summarizer', name: 'Text Summarizer', desc: 'Distills long texts into executive summaries' },
  { id: 'csv_reader', name: 'CSV Data Parser', desc: 'Parses tabular CSV records and calculates statistics' },
  { id: 'structured_parser', name: 'JSON & Data Validator', desc: 'Validates payloads and extracts properties' },
  { id: 'web_fetch', name: 'Secure Web Fetch (SSRF Guarded)', desc: 'Inspects authorized external HTTP resources' },
  { id: 'knowledge_search', name: 'Knowledge Base Search', desc: 'Queries internal organizational documents' },
];

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Drawers
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Research Agent');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('qwen2.5:7b');
  const [temperature, setTemperature] = useState(0.2);
  const [maxExecutionSteps, setMaxExecutionSteps] = useState(15);
  const [timeoutSeconds, setTimeoutSeconds] = useState(180);
  const [tokenBudget, setTokenBudget] = useState(16000);
  const [toolsAllowed, setToolsAllowed] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/agents');
      if (res.data?.success) {
        setAgents(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/agent-templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchTemplates();
  }, []);

  const openCreateDrawer = () => {
    setEditingAgent(null);
    setName('');
    setRole('Custom Specialist');
    setDescription('');
    setSystemPrompt('You are a bespoke autonomous specialist for AgentFlow AI.\nFollow organization security rules and fulfill user objectives accurately.');
    setModel('gpt-4o-mini');
    setTemperature(0.2);
    setMaxExecutionSteps(15);
    setTimeoutSeconds(180);
    setTokenBudget(16000);
    setToolsAllowed(['calculator', 'text_summarizer']);
    setIsAgentDrawerOpen(true);
  };

  const openEditDrawer = (agent: any) => {
    setEditingAgent(agent);
    setName(agent.name);
    setRole(agent.role);
    setDescription(agent.description);
    setSystemPrompt(agent.systemPrompt);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxExecutionSteps(agent.maxExecutionSteps);
    setTimeoutSeconds(agent.timeoutSeconds);
    setTokenBudget(agent.tokenBudget);
    setToolsAllowed(agent.toolsAllowed || []);
    setIsAgentDrawerOpen(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !systemPrompt.trim()) {
      error('Please complete all required fields.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name,
        role,
        description,
        systemPrompt,
        model,
        temperature: Number(temperature),
        maxExecutionSteps: Number(maxExecutionSteps),
        timeoutSeconds: Number(timeoutSeconds),
        tokenBudget: Number(tokenBudget),
        toolsAllowed,
      };

      if (editingAgent) {
        await api.patch(`/agents/${editingAgent.id}`, payload);
        success(`Agent '${name}' updated successfully`);
      } else {
        await api.post('/agents', payload);
        success(`Agent '${name}' created in workspace`);
      }

      setIsAgentDrawerOpen(false);
      fetchAgents();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstantiateTemplate = async (tmpl: any) => {
    try {
      const res = await api.post('/agent-templates/instantiate', { templateRole: tmpl.role });
      if (res.data?.success) {
        success(`Instantiated '${tmpl.name}' into your workforce!`);
        setIsTemplateDrawerOpen(false);
        fetchAgents();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to instantiate template');
    }
  };

  const handleToggleStatus = async (agent: any) => {
    try {
      const res = await api.post(`/agents/${agent.id}/toggle-status`);
      if (res.data?.success) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, isActive: !a.isActive } : a))
        );
        success(`Agent ${agent.isActive ? 'paused' : 'activated'}`);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to toggle status');
    }
  };

  const handleDuplicate = async (agent: any) => {
    try {
      const res = await api.post(`/agents/${agent.id}/duplicate`);
      if (res.data?.success) {
        success(`Cloned copy of '${agent.name}' created`);
        fetchAgents();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to duplicate agent');
    }
  };

  const handleDelete = async (agent: any) => {
    if (!window.confirm(`Are you sure you want to delete agent '${agent.name}'?`)) return;
    try {
      await api.delete(`/agents/${agent.id}`);
      success(`Agent '${agent.name}' removed`);
      fetchAgents();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete agent');
    }
  };

  const toggleTool = (toolId: string) => {
    if (toolsAllowed.includes(toolId)) {
      setToolsAllowed(toolsAllowed.filter((t) => t !== toolId));
    } else {
      setToolsAllowed([...toolsAllowed, toolId]);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && a.isActive) ||
      (statusFilter === 'inactive' && !a.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Agent Studio</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure, deploy, and inspect autonomous AI agents, tool registries, and execution parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-gold" />}
            onClick={() => setIsTemplateDrawerOpen(true)}
          >
            Built-in Templates
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateDrawer}
          >
            New Agent
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-3 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-10 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="all">All Agents</option>
            <option value="active">Active Only</option>
            <option value="inactive">Paused Only</option>
          </select>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-8 h-8 text-gold" />}
          title="No Agents Found"
          description={search ? 'No agents match your search criteria.' : 'No agents exist in this workspace. Create one or instantiate a built-in template.'}
          actionLabel="Choose from Templates"
          onAction={() => setIsTemplateDrawerOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} hoverEffect className="flex flex-col justify-between p-5">
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow flex-shrink-0">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{agent.name}</h3>
                      <p className="text-xs text-gray-400 font-medium">{agent.role}</p>
                    </div>
                  </div>
                  <Badge variant={agent.isActive ? 'emerald' : 'gray'} size="sm">
                    {agent.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Specs Pill List */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                    {agent.model}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    $0.00 Local
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                    temp: {agent.temperature}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                    {agent.toolsAllowed?.length || 0} tools
                  </span>
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title={agent.isActive ? 'Pause Agent' : 'Activate Agent'}
                  >
                    {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(agent)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Clone Agent"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditDrawer(agent)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Configure Settings"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="gold"
                  size="sm"
                  className="py-1 px-3 text-xs"
                  onClick={() => navigate('/tasks')}
                >
                  Delegate Task
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Built-in Templates Drawer */}
      <Drawer
        isOpen={isTemplateDrawerOpen}
        onClose={() => setIsTemplateDrawerOpen(false)}
        title="Built-in Agent Templates"
        description="Select from verified enterprise agent configurations."
        width="xl"
      >
        <div className="space-y-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.role}
              className="p-4 rounded-xl glass-panel border border-white/10 hover:border-gold/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{tmpl.name}</span>
                  <Badge variant="gold" size="sm">
                    {tmpl.role}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-lg">{tmpl.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                  <span>Model: {tmpl.model}</span>
                  <span>•</span>
                  <span>Max Steps: {tmpl.maxExecutionSteps}</span>
                  <span>•</span>
                  <span>Tools: {tmpl.toolsAllowed.join(', ')}</span>
                </div>
              </div>

              <Button
                variant="gold"
                size="sm"
                className="flex-shrink-0"
                onClick={() => handleInstantiateTemplate(tmpl)}
              >
                Instantiate Agent
              </Button>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Create / Edit Custom Agent Drawer */}
      <Drawer
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
        title={editingAgent ? `Edit: ${editingAgent.name}` : 'Create Custom AI Agent'}
        description="Tune instructions, execution parameters, tool authorizations, and security constraints."
        width="xl"
      >
        <form onSubmit={handleSaveAgent} className="space-y-5">
          <Input
            label="Agent Name"
            placeholder="e.g. Lead Qualification Specialist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Functional Role"
              placeholder="e.g. Sales Agent"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />

            <Select
              label="Local LLM Model (Ollama)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="qwen2.5:7b">Qwen 2.5 7B (Default General Purpose — Free Local)</option>
              <option value="qwen2.5-coder:7b">Qwen 2.5 Coder 7B (Code, Architecture, Debugging)</option>
              <option value="qwen2.5:3b">Qwen 2.5 3B (Lightweight & High-Speed CPU)</option>
              <option value="llama3.2:3b">Llama 3.2 3B (Fast Reasoning — Local CPU)</option>
              <option value="mistral:7b">Mistral 7B (Local Instruction Following)</option>
            </Select>
          </div>

          <Textarea
            label="Agent Description"
            placeholder="Briefly state what this agent specializes in and when to delegate tasks to it..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            required
          />

          <Textarea
            label="System Instructions & Operational Boundaries"
            placeholder="Detailed directives, constraints, output schemas, safety limits..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            required
          />

          {/* Model Hyperparameters */}
          <div className="p-4 rounded-xl bg-surface-card border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Execution Limits & Parameters
            </h4>

            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Temperature (Creativity vs Determinism)</span>
                <span className="font-mono text-gold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Execution Steps"
                type="number"
                min={1}
                max={50}
                value={maxExecutionSteps}
                onChange={(e) => setMaxExecutionSteps(parseInt(e.target.value, 10))}
              />
              <Input
                label="Timeout (seconds)"
                type="number"
                min={10}
                max={600}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          {/* Approved Tools */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-300">
              Approved Tool Permissions ({toolsAllowed.length} Selected)
            </label>
            <p className="text-[11px] text-gray-500">
              Agents can only invoke tools explicitly granted in this registry.
            </p>

            <div className="space-y-2">
              {AVAILABLE_TOOLS.map((t) => {
                const isSelected = toolsAllowed.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTool(t.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gold/10 border-gold/40 text-white'
                        : 'bg-surface-card border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{t.name}</h5>
                      <p className="text-[11px] text-gray-400">{t.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-gold border-gold text-black' : 'border-gray-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAgentDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
              {editingAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
