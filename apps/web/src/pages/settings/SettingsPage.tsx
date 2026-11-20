import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  User,
  Key,
  Plus,
  Trash2,
  Mail,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { OrgRole } from '@agentflow/shared';

export const SettingsPage: React.FC = () => {
  const { user, activeOrg, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'org' | 'members' | 'profile'>('org');

  // Org Settings State
  const [requireApproval, setRequireApproval] = useState(true);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(5);
  const [domainAllowlist, setDomainAllowlist] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Members State
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>(OrgRole.MEMBER);
  const [isInviting, setIsInviting] = useState(false);

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { success, error } = useToast();

  const fetchOrgSettings = async () => {
    try {
      const res = await api.get('/organizations/current');
      if (res.data?.success) {
        const s = res.data.data.settings || {};
        setRequireApproval(s.requireApprovalForTools ?? true);
        setMaxConcurrentTasks(s.maxConcurrentTasks || 5);
        setDomainAllowlist(s.domainAllowlist || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      if (res.data?.success) {
        setMembers(res.data.data.members || []);
        setInvitations(res.data.data.invitations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrgSettings();
    fetchMembers();
  }, [activeOrg]);

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingOrg(true);
      await api.patch('/organizations/current/settings', {
        requireApprovalForTools: requireApproval,
        maxConcurrentTasks: Number(maxConcurrentTasks),
        domainAllowlist,
      });
      success('Workspace settings updated successfully');
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase();
    if (!domainAllowlist.includes(clean)) {
      setDomainAllowlist([...domainAllowlist, clean]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    setDomainAllowlist(domainAllowlist.filter((d) => d !== dom));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsInviting(true);
      const res = await api.post('/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      if (res.data?.success) {
        success(`Invitation dispatched to ${inviteEmail}`);
        setIsInviteModalOpen(false);
        setInviteEmail('');
        fetchMembers();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Remove this member from workspace?')) return;
    try {
      await api.delete(`/members/${memberId}`);
      success('Member removed');
      fetchMembers();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await api.patch('/users/profile', { name: profileName });
      success('Profile updated');
      refreshUserData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsChangingPassword(true);
      await api.post('/users/change-password', { currentPassword, newPassword });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings & Workspace Control</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage workspace authorization policies, team rosters, and profile security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('org')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'org' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Workspace Security & Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'members' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Account & Password</span>
        </button>
      </div>

      {/* Tab 1: Organization Settings */}
      {activeTab === 'org' && (
        <Card className="p-6">
          <form onSubmit={handleSaveOrgSettings} className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Policy & Security Configuration</h3>
              <p className="text-xs text-gray-400">
                Guardrails applied across all autonomous agents in {activeOrg?.name}.
              </p>
            </div>

            {/* Approval Gate Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card border border-white/5">
              <div>
                <h4 className="text-xs font-bold text-white">Enforce Human Approval for Sensitive Actions</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When enabled, outbound emails, data mutations, and external API calls must receive human sign-off.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-5 h-5 accent-gold cursor-pointer"
              />
            </div>

            {/* Concurrency limit */}
            <div className="max-w-xs">
              <Input
                label="Maximum Concurrent Agent Tasks"
                type="number"
                min={1}
                max={20}
                value={maxConcurrentTasks}
                onChange={(e) => setMaxConcurrentTasks(parseInt(e.target.value, 10))}
                helperText="Limits simultaneous background queue executions."
              />
            </div>

            {/* SSRF Domain Allowlist */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300">
                SSRF Web Fetch Allowed Domains
              </label>
              <p className="text-[11px] text-gray-400">
                The agent web_fetch tool will only contact domains listed here. Private IPs and localhost are always blocked.
              </p>

              <div className="flex gap-2 max-w-md">
                <Input
                  placeholder="e.g. api.stripe.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddDomain}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {domainAllowlist.map((dom) => (
                  <span
                    key={dom}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-card border border-white/10 text-xs font-mono text-gray-300"
                  >
                    <span>{dom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(dom)}
                      className="text-gray-500 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <Button type="submit" variant="gold" size="sm" isLoading={isSavingOrg}>
                Save Workspace Policies
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Team Members */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Active Members</h3>
              <p className="text-xs text-gray-400">Users with access to this workspace.</p>
            </div>

            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold/20 text-gold flex items-center justify-center font-bold text-xs">
                        {m.name?.charAt(0) || 'U'}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono">{m.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={m.role === 'owner' ? 'gold' : 'violet'} size="sm" className="uppercase">
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 3: Personal Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-white mb-4">Profile Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
              <Input label="Email Address" value={user?.email} disabled helperText="Email address cannot be changed." />
              <Button type="submit" variant="gold" size="sm" isLoading={isSavingProfile}>
                Update Profile
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-white mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isChangingPassword}>
                Save New Password
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Grant access to this workspace and its agent workforce."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Colleague Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Workspace Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as OrgRole)}
          >
            <option value={OrgRole.ADMIN}>Admin (Full control over agents & settings)</option>
            <option value={OrgRole.MANAGER}>Manager (Can dispatch tasks and approve sensitive actions)</option>
            <option value={OrgRole.MEMBER}>Member (Can create and execute tasks)</option>
            <option value={OrgRole.VIEWER}>Viewer (Read-only access)</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
