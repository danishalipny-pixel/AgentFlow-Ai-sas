import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bot, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      error('Invalid password reset token');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/reset-password', { token, newPassword });
      if (res.data?.success) {
        success('Password updated successfully. You can now log in.');
        navigate('/login');
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Password reset failed');
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
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Create New Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter and confirm your new secure password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="gold"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link to="/login" className="text-xs text-gold font-semibold hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
