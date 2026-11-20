import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Building2,
  CheckCircle2,
  LogOut,
  User as UserIcon,
  Settings,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface TopNavProps {
  onToggleSidebar: () => void;
  onOpenNewTaskModal?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar, onOpenNewTaskModal }) => {
  const { user, activeOrg, organizations, switchOrganization, logout } = useAuth();
  const navigate = useNavigate();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data?.success) {
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch (err) {
        // Silently catch in polling
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Sidebar toggle & Workspace Selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOrgDropdownOpen(!isOrgDropdownOpen);
              setIsNotificationsOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border hover:border-gray-600 transition-colors"
          >
            <Building2 className="w-4 h-4 text-gold" />
            <span className="text-xs sm:text-sm font-semibold text-white max-w-[140px] sm:max-w-[180px] truncate">
              {activeOrg?.name || 'Workspace'}
            </span>
            <Badge variant="gold" size="sm" className="hidden sm:inline-flex uppercase">
              {activeOrg?.plan || 'Free'}
            </Badge>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl glass-panel border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
                Your Workspaces
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      switchOrganization(org.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      org.id === activeOrg?.id
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{org.name}</span>
                    </div>
                    {org.id === activeOrg?.id && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsOrgDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Quick Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents, tasks, workflows, approvals... (Ctrl+K)"
            className="w-full bg-surface-card/60 border border-surface-border rounded-lg pl-10 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/tasks?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {onOpenNewTaskModal && (
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onOpenNewTaskModal}
            className="hidden sm:inline-flex"
          >
            New Task
          </Button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsOrgDropdownOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-background animate-pulse" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && <Badge variant="rose" size="sm">{unreadCount} New</Badge>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-gold hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors border ${
                        n.isRead
                          ? 'bg-transparent border-white/5 text-gray-400'
                          : 'bg-white/5 border-gold/30 text-white'
                      }`}
                    >
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsOrgDropdownOpen(false);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center font-bold text-xs text-gold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span>Profile & Account</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Workspace Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/billing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span>Plan & Usage</span>
                </button>
                {user?.isPlatformAdmin && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Portal</span>
                  </button>
                )}
              </div>

              <div className="pt-1 mt-1 border-t border-white/5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
