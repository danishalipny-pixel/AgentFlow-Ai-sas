import { WorkflowNode, WorkflowEdge, WorkflowNodeType, TaskPriority } from '@agentflow/shared';
import { AppError } from '../middlewares/errorHandler';
import { Workflow, Task, IWorkflow } from '../models';
import { OrchestrationService } from './orchestration.service';

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
}

export class WorkflowService {
  /**
   * Validate a visual workflow graph
   */
  public static validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowValidationResult {
    const errors: string[] = [];

    // 1. Must contain at least one START node
    const startNodes = nodes.filter((n) => n.type === WorkflowNodeType.START);
    if (startNodes.length === 0) {
      errors.push('Workflow must contain at least one Start node.');
    } else if (startNodes.length > 1) {
      errors.push('Workflow cannot contain multiple Start nodes.');
    }

    // 2. Must contain at least one END or OUTPUT node
    const endNodes = nodes.filter((n) => n.type === WorkflowNodeType.END || n.type === WorkflowNodeType.OUTPUT);
    if (endNodes.length === 0) {
      errors.push('Workflow must contain at least one End or Output node.');
    }

    // 3. Node ID uniqueness
    const nodeIds = new Set<string>();
    for (const node of nodes) {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node identifier found: '${node.id}'.`);
      }
      nodeIds.add(node.id);
    }

    // 4. Edge validation: sources and targets must exist in nodes list
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge connects from non-existent source node '${edge.source}'.`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge connects to non-existent target node '${edge.target}'.`);
      }
    }

    // 5. Node required settings check
    for (const node of nodes) {
      if (node.type === WorkflowNodeType.AGENT && !node.data?.agentId && !node.data?.label) {
        errors.push(`Agent node '${node.id}' must be configured with an assigned agent.`);
      }
      if (node.type === WorkflowNodeType.CONDITION && !node.data?.conditionExpression) {
        errors.push(`Condition node '${node.id}' is missing a condition expression.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Run a workflow
   */
  public static async executeWorkflow(
    workflowId: string,
    organizationId: string,
    userId: string,
    inputParameters: Record<string, any> = {}
  ): Promise<{ taskId: string; workflow: IWorkflow }> {
    const workflow = await Workflow.findOne({ _id: workflowId, organizationId });
    if (!workflow) {
      throw new AppError('Workflow not found', 404, 'NOT_FOUND');
    }

    // Validate workflow before execution
    const validation = this.validateWorkflow(workflow.nodes, workflow.edges);
    if (!validation.valid) {
      throw new AppError(
        `Workflow validation failed: ${validation.errors.join('; ')}`,
        400,
        'WORKFLOW_VALIDATION_FAILED'
      );
    }

    // Increment execution count
    workflow.executionCount = (workflow.executionCount || 0) + 1;
    await workflow.save();

    // Find the primary agent node if any
    const agentNode = workflow.nodes.find((n) => n.type === WorkflowNodeType.AGENT);
    const assignedAgentId = agentNode?.data?.agentId;

    // Create a Task representing this workflow run
    const task = await Task.create({
      organizationId,
      title: `Workflow Run: ${workflow.name} (v${workflow.version})`,
      description: workflow.description || `Automated execution of visual workflow graph '${workflow.name}' with ${workflow.nodes.length} nodes.`,
      priority: TaskPriority.HIGH,
      workflowId: workflow._id,
      assignedAgentId: assignedAgentId || undefined,
      inputParameters,
      creatorId: userId,
    });

    // Asynchronously begin task execution
    OrchestrationService.executeTask(task._id.toString()).catch((err) => {
      console.error('[WorkflowService] Async task execution error:', err);
    });

    return {
      taskId: task._id.toString(),
      workflow,
    };
  }
}
