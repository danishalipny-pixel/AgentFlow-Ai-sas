import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TaskPriority } from '@agentflow/shared';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assignedAgentId, setAssignedAgentId] = useState('');

  const { success, error } = useToast();
  const navigate = useNavigate();

  const openNewTaskModal = async () => {
    try {
      const res = await api.get('/agents?status=active');
      if (res.data?.success) {
        setAgents(res.data.data || []);
      }
    } catch (e) {
      // ignore
    }
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      error('Please provide a task title and description');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/tasks', {
        title,
        description,
        priority,
        assignedAgentId: assignedAgentId || undefined,
      });

      if (res.data?.success) {
        success('Task dispatched successfully to agent workforce');
        setIsNewTaskModalOpen(false);
        setTitle('');
        setDescription('');
        navigate(`/tasks/${res.data.data.id}`);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to dispatch task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenNewTaskModal={openNewTaskModal}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Quick New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Dispatch Autonomous Task"
        description="Assign a goal, mission, or analytical objective to your autonomous AI workforce."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Research competitor pricing & draft sales battlecard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Instructions & Requirements"
            placeholder="Detail the specific parameters, data sources, constraints, or actions to take..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Specialist Agent"
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
            >
              <option value="">Auto-Assign via Supervisor Agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </Select>

            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isSubmitting}>
              Launch Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
