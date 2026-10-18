import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../api/client';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('kavita.nair@apexfmcg.in');
  const [password, setPassword] = useState('apex2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({ email: demoEmail, password: 'any' });
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as demo user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.oauthLogin({ provider, email });
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090d16] flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-8 shadow-2xl">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-lg mb-3">
            C28
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">LedgerLoop Desk</h1>
          <p className="text-xs text-slate-400 mt-1">Receivables Intelligence & Operations Platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#111827] px-2 text-slate-500">Or single sign-on</span>
          </div>
        </div>

        {/* SSO Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('microsoft')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
          >
            <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
              <div className="bg-[#f25022] w-1.5 h-1.5" />
              <div className="bg-[#7fba00] w-1.5 h-1.5" />
              <div className="bg-[#00a4ef] w-1.5 h-1.5" />
              <div className="bg-[#ffb900] w-1.5 h-1.5" />
            </div>
            Microsoft
          </button>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center">
            One-Click Demo Personas:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('kavita.nair@apexfmcg.in')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 rounded-lg text-[11px] text-slate-300 font-medium text-center transition-colors"
            >
              👩‍💼 Kavita (Ops)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('v.singhania@apexfmcg.in')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 rounded-lg text-[11px] text-slate-300 font-medium text-center transition-colors"
            >
              👨‍💼 Vikram (CFO)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('rajesh.m@apexfmcg.in')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 rounded-lg text-[11px] text-slate-300 font-medium text-center transition-colors"
            >
              👨‍💼 Rajesh (Risk)
            </button>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Access Control • 256-bit Encrypted</span>
        </div>
      </div>
    </div>
  );
};
