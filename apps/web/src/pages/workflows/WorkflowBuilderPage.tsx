import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Play,
  Save,
  CheckCircle,
  AlertTriangle,
  Plus,
  Bot,
  ShieldCheck,
  Wrench,
  HelpCircle,
  Flag,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { WorkflowNodeType, ActionType } from '@agentflow/shared';

// Custom Nodes Components
const StartNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl bg-surface-card border-2 border-emerald-500/80 text-white min-w-[160px] shadow-lg">
    <div className="flex items-center gap-2 mb-1">
      <Play className="w-4 h-4 text-emerald-400" />
      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Start Node</span>
    </div>
    <p className="text-xs font-semibold">{data.label || 'Task Trigger'}</p>
    <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-emerald-400 border border-black" />
  </div>
);

const AgentNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl bg-surface-card border-2 border-gold/80 text-white min-w-[190px] shadow-glow">
    <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-gold border border-black" />
    <div className="flex items-center gap-2 mb-1">
      <Bot className="w-4 h-4 text-gold" />
      <span className="text-xs font-bold text-gold uppercase tracking-wider">Agent Node</span>
    </div>
    <p className="text-xs font-bold truncate">{data.label || 'Assigned Agent'}</p>
    <p className="text-[10px] text-gray-400 truncate">{data.role || 'Autonomous Worker'}</p>
    <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-gold border border-black" />
  </div>
);

const ApprovalNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl bg-surface-card border-2 border-amber-500/80 text-white min-w-[180px] shadow-lg">
    <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-amber-400 border border-black" />
    <div className="flex items-center gap-2 mb-1">
      <ShieldCheck className="w-4 h-4 text-amber-400" />
      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Human Checkpoint</span>
    </div>
    <p className="text-xs font-bold">{data.label || 'Authorization Gate'}</p>
    <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-amber-400 border border-black" />
  </div>
);

const ToolNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl bg-surface-card border-2 border-violet-accent/80 text-white min-w-[170px] shadow-violetGlow">
    <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-violet-400 border border-black" />
    <div className="flex items-center gap-2 mb-1">
      <Wrench className="w-4 h-4 text-violet-400" />
      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Tool Registry</span>
    </div>
    <p className="text-xs font-bold">{data.label || 'Tool Invocation'}</p>
    <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-violet-400 border border-black" />
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl bg-surface-card border-2 border-rose-500/80 text-white min-w-[160px] shadow-lg">
    <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-rose-400 border border-black" />
    <div className="flex items-center gap-2 mb-1">
      <Flag className="w-4 h-4 text-rose-400" />
      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">End Deliverable</span>
    </div>
    <p className="text-xs font-semibold">{data.label || 'Deliverables Ready'}</p>
  </div>
);

const nodeTypes = {
  start: StartNode,
  agent: AgentNode,
  approval: ApprovalNode,
  tool: ToolNode,
  end: EndNode,
  output: EndNode,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Inbound Customer Request' },
  },
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 230, y: 180 },
    data: { label: 'Research Specialist', role: 'Research Agent', agentId: 'agent_res' },
  },
  {
    id: 'tool-1',
    type: 'tool',
    position: { x: 240, y: 310 },
    data: { label: 'Secure Web Fetch Tool', toolName: 'web_fetch' },
  },
  {
    id: 'approval-1',
    type: 'approval',
    position: { x: 235, y: 440 },
    data: { label: 'Supervisor Outreach Gate', actionType: ActionType.SEND_EMAIL },
  },
  {
    id: 'end-1',
    type: 'end',
    position: { x: 250, y: 570 },
    data: { label: 'Report & Dispatch Finalized' },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1-2', source: 'start-1', target: 'agent-1' },
  { id: 'e2-3', source: 'agent-1', target: 'tool-1' },
  { id: 'e3-4', source: 'tool-1', target: 'approval-1' },
  { id: 'e4-5', source: 'approval-1', target: 'end-1' },
];

export const WorkflowBuilderPage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [workflowName, setWorkflowName] = useState('Customer Acquisition & Intelligence Pipeline');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);

  // Node editing state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data?.label || '');
    setIsNodeDrawerOpen(true);
  };

  const handleUpdateNode = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: nodeLabel } } : n))
    );
    setIsNodeDrawerOpen(false);
    success('Node updated');
  };

  const addNode = (type: WorkflowNodeType, label: string) => {
    const id = `${type}-${Date.now().toString().slice(-4)}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 300, y: 150 + nodes.length * 40 },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
    success(`Added ${label} to canvas`);
  };

  const validateWorkflow = () => {
    const hasStart = nodes.some((n) => n.type === 'start');
    const hasEnd = nodes.some((n) => n.type === 'end' || n.type === 'output');

    if (!hasStart) {
      error('Validation Failed: Workflow requires a Start node.');
      return false;
    }
    if (!hasEnd) {
      error('Validation Failed: Workflow requires an End or Output node.');
      return false;
    }
    if (edges.length === 0 && nodes.length > 1) {
      warning('Warning: Some nodes are disconnected.');
    }
    success('Workflow topology valid! Ready for execution.');
    return true;
  };

  const saveWorkflow = async () => {
    if (!validateWorkflow()) return;
    try {
      setIsSaving(true);
      const payload = {
        name: workflowName,
        nodes,
        edges,
      };

      if (workflowId) {
        await api.patch(`/workflows/${workflowId}`, payload);
        success('Workflow updated successfully');
      } else {
        const res = await api.post('/workflows', payload);
        if (res.data?.success) {
          setWorkflowId(res.data.data.id);
          success('Workflow saved to workspace');
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const runWorkflow = async () => {
    if (!validateWorkflow()) return;
    try {
      setIsRunning(true);
      // If unsaved, save first
      let currentId = workflowId;
      if (!currentId) {
        const res = await api.post('/workflows', { name: workflowName, nodes, edges });
        currentId = res.data?.data?.id;
        setWorkflowId(currentId);
      }

      const runRes = await api.post(`/workflows/${currentId}/run`, {
        inputParameters: { triggeredVia: 'visual_canvas' },
      });

      if (runRes.data?.success) {
        success('Workflow launched! Redirecting to task execution timeline...');
        navigate(`/tasks/${runRes.data.data.taskId}`);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to execute workflow');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-accent/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-base font-extrabold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-gold focus:outline-none px-1"
            />
            <p className="text-[11px] text-gray-400 px-1">Visual Multi-Agent Directed Acyclic Graph (DAG)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={validateWorkflow}>
            Validate
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={saveWorkflow} isLoading={isSaving}>
            Save
          </Button>
          <Button variant="gold" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />} onClick={runWorkflow} isLoading={isRunning}>
            Execute Workflow
          </Button>
        </div>
      </div>

      {/* Main Canvas & Palette */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-white/10 relative">
        {/* Floating Node Palette */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-xl glass-panel border border-white/10 shadow-2xl space-y-2 w-48">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Palette Elements</p>
          <button
            onClick={() => addNode(WorkflowNodeType.AGENT, 'Specialist Agent')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card border border-white/5 hover:border-gold/50 text-xs text-white text-left transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-gold" />
            <span>AI Agent Node</span>
          </button>
          <button
            onClick={() => addNode(WorkflowNodeType.TOOL, 'Tool Execution')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card border border-white/5 hover:border-violet-500/50 text-xs text-white text-left transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-violet-400" />
            <span>Tool Node</span>
          </button>
          <button
            onClick={() => addNode(WorkflowNodeType.APPROVAL, 'Human Approval')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card border border-white/5 hover:border-amber-500/50 text-xs text-white text-left transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Approval Gate</span>
          </button>
          <button
            onClick={() => addNode(WorkflowNodeType.END, 'Deliverable Output')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card border border-white/5 hover:border-rose-500/50 text-xs text-white text-left transition-colors"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>End Output</span>
          </button>
        </div>

        {/* React Flow Viewport */}
        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#1f293d" gap={18} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* Node Config Drawer */}
      <Drawer
        isOpen={isNodeDrawerOpen}
        onClose={() => setIsNodeDrawerOpen(false)}
        title="Configure Workflow Node"
        description={`Customizing settings for ${selectedNode?.id}`}
      >
        <div className="space-y-4">
          <Input label="Node Label" value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} />
          <Button variant="gold" size="sm" onClick={handleUpdateNode} className="w-full">
            Apply Node Settings
          </Button>
        </div>
      </Drawer>
    </div>
  );
};
