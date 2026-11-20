import { WorkflowService } from '../src/services/workflow.service';
import { WorkflowNodeType, WorkflowNode, WorkflowEdge } from '@agentflow/shared';

describe('Visual Workflow DAG Engine Validation', () => {
  it('should pass validation for a valid DAG with Start and End nodes', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'start-1',
        type: WorkflowNodeType.START,
        position: { x: 0, y: 0 },
        data: { label: 'Start' },
      },
      {
        id: 'agent-1',
        type: WorkflowNodeType.AGENT,
        position: { x: 0, y: 100 },
        data: { label: 'Research Agent', agentId: 'agent-123' },
      },
      {
        id: 'end-1',
        type: WorkflowNodeType.END,
        position: { x: 0, y: 200 },
        data: { label: 'Deliverables' },
      },
    ];

    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start-1', target: 'agent-1' },
      { id: 'e2', source: 'agent-1', target: 'end-1' },
    ];

    const res = WorkflowService.validateWorkflow(nodes, edges);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('should fail validation if workflow lacks a Start node', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'agent-1',
        type: WorkflowNodeType.AGENT,
        position: { x: 0, y: 100 },
        data: { label: 'Research Agent', agentId: 'agent-123' },
      },
      {
        id: 'end-1',
        type: WorkflowNodeType.END,
        position: { x: 0, y: 200 },
        data: { label: 'Deliverables' },
      },
    ];

    const res = WorkflowService.validateWorkflow(nodes, []);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Start node'))).toBe(true);
  });

  it('should fail validation if workflow lacks an End node', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'start-1',
        type: WorkflowNodeType.START,
        position: { x: 0, y: 0 },
        data: { label: 'Start' },
      },
    ];

    const res = WorkflowService.validateWorkflow(nodes, []);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('End or Output node'))).toBe(true);
  });

  it('should fail validation if edge targets a non-existent node ID', () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'start-1',
        type: WorkflowNodeType.START,
        position: { x: 0, y: 0 },
        data: { label: 'Start' },
      },
      {
        id: 'end-1',
        type: WorkflowNodeType.END,
        position: { x: 0, y: 200 },
        data: { label: 'Deliverables' },
      },
    ];

    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start-1', target: 'non_existent_node_999' },
    ];

    const res = WorkflowService.validateWorkflow(nodes, edges);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('non_existent_node_999'))).toBe(true);
  });
});
