import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { UserDTO, OrganizationDTO } from '@agentflow/shared';

interface AuthContextType {
  user: UserDTO | null;
  organizations: OrganizationDTO[];
  activeOrg: OrganizationDTO | null;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: UserDTO, orgs?: OrganizationDTO[], defaultOrgId?: string) => void;
  logout: () => void;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);
  const [activeOrg, setActiveOrg] = useState<OrganizationDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('agentflow_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const userData = res.data.data.user;
        const orgs = res.data.data.organizations || [];
        const defaultOrgId = res.data.data.defaultOrgId;
        setUser(userData);
        setOrganizations(orgs);

        const savedOrgId = localStorage.getItem('agentflow_active_org_id');
        const currentOrg = orgs.find((o: any) => o.id === savedOrgId) || 
                           orgs.find((o: any) => o.id === defaultOrgId) || 
                           orgs[0] || null;
        if (currentOrg) {
          setActiveOrg(currentOrg);
          localStorage.setItem('agentflow_active_org_id', currentOrg.id);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid:', err);
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_refresh_token');
      localStorage.removeItem('agentflow_active_org_id');
      setUser(null);
      setActiveOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = (
    tokens: { accessToken: string; refreshToken: string },
    userData: UserDTO,
    orgs: OrganizationDTO[] = [],
    defaultOrgId?: string
  ) => {
    localStorage.setItem('agentflow_token', tokens.accessToken);
    localStorage.setItem('agentflow_refresh_token', tokens.refreshToken);
    setUser(userData);
    setOrganizations(orgs);

    const initialOrg = (defaultOrgId ? orgs.find(o => o.id === defaultOrgId) : null) || orgs[0] || null;
    if (initialOrg) {
      setActiveOrg(initialOrg);
      localStorage.setItem('agentflow_active_org_id', initialOrg.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('agentflow_token');
    localStorage.removeItem('agentflow_refresh_token');
    localStorage.removeItem('agentflow_active_org_id');
    setUser(null);
    setOrganizations([]);
    setActiveOrg(null);
    window.location.href = '/login';
  };

  const switchOrganization = async (orgId: string) => {
    try {
      await api.post(`/organizations/${orgId}/switch`);
      const targetOrg = organizations.find((o) => o.id === orgId);
      if (targetOrg) {
        setActiveOrg(targetOrg);
        localStorage.setItem('agentflow_active_org_id', targetOrg.id);
      }
      window.location.reload();
    } catch (err) {
      console.error('[AuthContext] Failed to switch organization:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        activeOrg,
        isLoading,
        login,
        logout,
        switchOrganization,
        refreshUserData: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
