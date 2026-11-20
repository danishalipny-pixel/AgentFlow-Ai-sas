import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const { error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        setIsSubmitted(true);
        if (res.data.devResetUrl) {
          setDevResetUrl(res.data.devResetUrl);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/15 border border-gold/40 text-gold shadow-glow mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AGENTFLOW AI</h1>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Reset Link Dispatched</h2>
              <p className="text-xs text-gray-400">
                If an account exists with <span className="text-white font-medium">{email}</span>, we have dispatched password reset instructions.
              </p>
              {devResetUrl && (
                <div className="p-3 rounded-lg bg-surface-card border border-gold/30 text-left mt-4">
                  <p className="text-[11px] font-semibold text-gold uppercase tracking-wider">Local Dev Reset Link:</p>
                  <a href={devResetUrl} className="text-xs text-cyan-400 hover:underline break-all block mt-1">
                    {devResetUrl}
                  </a>
                </div>
              )}
              <Link to="/login" className="inline-block mt-4 text-xs text-gold font-semibold hover:underline">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Reset Your Password</h2>
                <p className="text-xs text-gray-400 mt-0.5">Enter your email and we'll send a secure reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="operator@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Button type="submit" variant="gold" className="w-full mt-2" isLoading={isLoading}>
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
