import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Users,
  GitBranch,
  CheckSquare,
  ShieldCheck,
  BookOpen,
  BarChart3,
  Plug,
  CreditCard,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user } = useAuth();

  const mainNavItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Agent Studio', icon: Bot, path: '/agents' },
    { label: 'Multi-Agent Teams', icon: Users, path: '/teams' },
    { label: 'Workflow Builder', icon: GitBranch, path: '/workflows' },
    { label: 'Tasks Center', icon: CheckSquare, path: '/tasks' },
    { label: 'Human Approvals', icon: ShieldCheck, path: '/approvals' },
    { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
    { label: 'Analytics & Usage', icon: BarChart3, path: '/analytics' },
  ];

  const manageNavItems = [
    { label: 'Integrations', icon: Plug, path: '/integrations' },
    { label: 'Billing & Plans', icon: CreditCard, path: '/billing' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside
      className={cn(
        'h-screen bg-surface border-r border-surface-border flex flex-col transition-all duration-300 z-30 flex-shrink-0 select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-surface-border">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-glow group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-extrabold text-base tracking-wider gold-gradient-text block leading-none">
                AGENTFLOW
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                AI Workforce
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-2">
              Autonomous Core
            </p>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/30 shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0 transition-colors group-hover:text-gold" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Management Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-2">
              Workspace & Operations
            </p>
          )}
          <nav className="space-y-1">
            {manageNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0 transition-colors group-hover:text-gold" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}

            {user?.isPlatformAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group text-rose-400 hover:bg-rose-500/10',
                    isActive && 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  )
                }
                title={isCollapsed ? 'Platform Admin' : undefined}
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>Platform Admin</span>}
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      {/* Footer / User Preview */}
      {!isCollapsed && (
        <div className="p-3 border-t border-surface-border">
          <div className="p-2 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center font-bold text-xs text-gold flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
