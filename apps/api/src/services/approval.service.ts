import mongoose from 'mongoose';
import { ActionType, ApprovalStatus, TaskStatus } from '@agentflow/shared';
import { Approval, IApproval, Task, Execution, ExecutionStep, User } from '../models';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { AppError } from '../middlewares/errorHandler';

export interface RequestApprovalParams {
  organizationId: string;
  taskId: string;
  executionId: string;
  stepId?: string;
  requestingAgentId: string;
  requestingAgentName: string;
  actionType: ActionType;
  actionTitle: string;
  actionPayload: Record<string, any>;
  reason: string;
}

export class ApprovalService {
  /**
   * Determine if an action requires human approval
   */
  public static requiresApproval(actionType: ActionType, isOrgSettingEnforced = true): boolean {
    if (!isOrgSettingEnforced) return false;
    const sensitiveActions = [
      ActionType.SEND_EMAIL,
      ActionType.EXTERNAL_API_MUTATION,
      ActionType.DATA_DELETION,
      ActionType.UPDATE_RECORDS,
      ActionType.PAID_OPERATION,
      ActionType.CODE_EXECUTION,
    ];
    return sensitiveActions.includes(actionType);
  }

  /**
   * Create a pending human approval request
   */
  public static async createApprovalRequest(params: RequestApprovalParams): Promise<IApproval> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const approval = await Approval.create({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      taskId: new mongoose.Types.ObjectId(params.taskId),
      executionId: new mongoose.Types.ObjectId(params.executionId),
      stepId: params.stepId ? new mongoose.Types.ObjectId(params.stepId) : undefined,
      requestingAgentId: new mongoose.Types.ObjectId(params.requestingAgentId),
      requestingAgentName: params.requestingAgentName,
      actionType: params.actionType,
      actionTitle: params.actionTitle,
      actionPayload: params.actionPayload,
      reason: params.reason,
      status: ApprovalStatus.PENDING,
      expiresAt,
    });

    // Update Task status to WAITING_APPROVAL
    await Task.findByIdAndUpdate(params.taskId, {
      status: TaskStatus.WAITING_APPROVAL,
    });

    // Update Execution status to WAITING_APPROVAL
    await Execution.findByIdAndUpdate(params.executionId, {
      status: TaskStatus.WAITING_APPROVAL,
    });

    // Find organization owner/admins to notify
    const task = await Task.findById(params.taskId);
    if (task) {
      await NotificationService.notify({
        organizationId: params.organizationId,
        userId: task.creatorId.toString(),
        title: 'Action Requires Approval',
        message: `Agent ${params.requestingAgentName} requested approval for: ${params.actionTitle}`,
        type: 'approval_requested',
        link: `/approvals`,
        metadata: { approvalId: approval._id.toString(), taskId: params.taskId },
      });
    }

    await AuditService.record({
      organizationId: params.organizationId,
      actorId: params.requestingAgentId,
      action: 'APPROVAL_REQUESTED',
      resourceType: 'Approval',
      resourceId: approval._id.toString(),
      metadata: { actionType: params.actionType, actionTitle: params.actionTitle },
    });

    return approval;
  }

  /**
   * Process decision (approve or reject)
   */
  public static async resolveApproval(
    approvalId: string,
    organizationId: string,
    userId: string,
    decision: 'approved' | 'rejected',
    comment?: string
  ): Promise<IApproval> {
    const approval = await Approval.findOne({
      _id: approvalId,
      organizationId,
    });

    if (!approval) {
      throw new AppError('Approval request not found', 404, 'NOT_FOUND');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new AppError(`Approval is already in '${approval.status}' state`, 400, 'INVALID_STATE');
    }

    approval.status = decision === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    approval.decidedByUserId = new mongoose.Types.ObjectId(userId);
    approval.decisionComment = comment || '';
    approval.decidedAt = new Date();
    await approval.save();

    const user = await User.findById(userId);

    // Update task status based on resolution
    const task = await Task.findById(approval.taskId);
    if (task) {
      if (decision === 'approved') {
        task.status = TaskStatus.RUNNING;
        await task.save();

        // Create an execution step recording the approval
        await ExecutionStep.create({
          executionId: approval.executionId,
          stepNumber: 999,
          agentId: approval.requestingAgentId,
          agentName: approval.requestingAgentName,
          stepType: 'approval_request',
          title: `Human Approval Granted: ${approval.actionTitle}`,
          outputPayload: {
            decision: 'approved',
            decidedBy: user?.name,
            comment,
          },
          durationMs: 0,
        });

        // Resume execution
        const { OrchestrationService } = await import('./orchestration.service');
        OrchestrationService.resumeExecution(approval.executionId.toString(), approval._id.toString()).catch((err) =>
          console.error('[ApprovalService] Failed to resume execution:', err)
        );
      } else {
        task.status = TaskStatus.FAILED;
        task.error = `Action rejected by human supervisor (${user?.name}): ${comment || 'No comment provided'}`;
        await task.save();

        await Execution.findByIdAndUpdate(approval.executionId, {
          status: TaskStatus.FAILED,
          endTime: new Date(),
        });

        await ExecutionStep.create({
          executionId: approval.executionId,
          stepNumber: 999,
          agentId: approval.requestingAgentId,
          agentName: approval.requestingAgentName,
          stepType: 'error',
          title: `Human Approval Rejected: ${approval.actionTitle}`,
          outputPayload: {
            decision: 'rejected',
            decidedBy: user?.name,
            comment,
          },
          durationMs: 0,
        });
      }

      await NotificationService.notify({
        organizationId,
        userId: task.creatorId.toString(),
        title: `Approval ${decision.toUpperCase()}`,
        message: `Action '${approval.actionTitle}' was ${decision} by ${user?.name || 'Administrator'}`,
        type: `approval_${decision}`,
        link: `/tasks/${task._id.toString()}`,
      });
    }

    await AuditService.record({
      organizationId,
      actorId: userId,
      actorEmail: user?.email,
      action: `APPROVAL_${decision.toUpperCase()}`,
      resourceType: 'Approval',
      resourceId: approvalId,
      metadata: { comment, actionType: approval.actionType },
    });

    return approval;
  }
}
