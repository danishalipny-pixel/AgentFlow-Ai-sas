import React, { useState, useEffect } from 'react';
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  RefreshCw,
  Sliders,
  Unplug,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { IntegrationProvider, IntegrationStatus } from '@agentflow/shared';

const INTEGRATION_INFO: Record<string, { name: string; desc: string; icon: string }> = {
  openai: {
    name: 'OpenAI API',
    desc: 'Power agent reasoning and completion models with GPT-4o and GPT-4o-mini.',
    icon: 'Brain',
  },
  smtp: {
    name: 'SMTP Email Service',
    desc: 'Dispatch verified system notifications and approval alerts to team members.',
    icon: 'Mail',
  },
  slack: {
    name: 'Slack Integration',
    desc: 'Send interactive human approval notifications directly into Slack channels.',
    icon: 'MessageSquare',
  },
  webhook: {
    name: 'Custom Outbound Webhooks',
    desc: 'Dispatch JSON event payloads to external REST API webhooks on task events.',
    icon: 'Webhook',
  },
  stripe: {
    name: 'Stripe Billing Gateway',
    desc: 'Manage SaaS customer subscriptions, tier quotas, and automated invoicing.',
    icon: 'CreditCard',
  },
};

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configure modal
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});

  const { success, error, warning } = useToast();

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/integrations');
      if (res.data?.success) {
        setIntegrations(res.data.data || []);
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to fetch integrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const openConfigure = (provider: string) => {
    setSelectedProvider(provider);
    setSecretKey('');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      setIsConfiguring(true);
      const res = await api.post(`/integrations/${selectedProvider}/configure`, {
        secretKey,
      });

      if (res.data?.success) {
        success(`${INTEGRATION_INFO[selectedProvider]?.name || selectedProvider} configured`);
        setSelectedProvider(null);
        fetchIntegrations();
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Configuration failed');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTestingMap((prev) => ({ ...prev, [provider]: true }));
      const res = await api.post(`/integrations/${provider}/test`);
      if (res.data?.success) {
        success(`Connection test succeeded for ${INTEGRATION_INFO[provider]?.name || provider}!`);
      } else {
        warning(res.data?.message || 'Connection test returned an error');
      }
      fetchIntegrations();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Connection test failed');
    } finally {
      setTestingMap((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!window.confirm(`Disconnect and purge credentials for ${INTEGRATION_INFO[provider]?.name || provider}?`)) return;

    try {
      await api.post(`/integrations/${provider}/disconnect`);
      success(`Disconnected ${INTEGRATION_INFO[provider]?.name || provider}`);
      fetchIntegrations();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to disconnect');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">External Integrations</h1>
        <p className="text-xs text-gray-400 mt-1">
          Securely manage credentials for AI providers, email gateways, messaging channels, and payment systems.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((item) => {
            const info = INTEGRATION_INFO[item.provider] || {
              name: item.provider.toUpperCase(),
              desc: 'Third party integration',
            };
            const isConnected = item.status === IntegrationStatus.CONNECTED;
            const isTesting = testingMap[item.provider] || false;

            return (
              <Card key={item.provider} hoverEffect className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                      <Plug className="w-5 h-5" />
                    </div>
                    <Badge variant={isConnected ? 'emerald' : item.status === 'error' ? 'rose' : 'gray'} size="sm">
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{info.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{info.desc}</p>

                  {item.lastTestedAt && (
                    <p className="text-[11px] text-gray-500 mb-2">
                      Last Tested: {new Date(item.lastTestedAt).toLocaleString()}
                    </p>
                  )}

                  {item.errorMessage && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 mb-2">
                      {item.errorMessage}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTestConnection(item.provider)}
                        isLoading={isTesting}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-400 hover:bg-rose-500/10"
                        onClick={() => handleDisconnect(item.provider)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      className="w-full"
                      leftIcon={<Key className="w-3.5 h-3.5" />}
                      onClick={() => openConfigure(item.provider)}
                    >
                      Connect & Authorize
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Configure Modal */}
      <Modal
        isOpen={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={`Connect ${selectedProvider ? INTEGRATION_INFO[selectedProvider]?.name || selectedProvider : ''}`}
        description="Credentials are encrypted at rest with AES-256-GCM and never returned in plain text."
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <Input
            label="API Key / Secret Token"
            type="password"
            placeholder="Paste your secret key here..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedProvider(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isConfiguring}>
              Save & Test Connection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
