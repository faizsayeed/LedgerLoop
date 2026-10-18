import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
  UserPlus,
  LogIn,
  X,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { UserProfile, AuthResponse } from '../../types';
import { api } from '../../api/client';
import { Card3D } from '../Common/Card3D';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('kavita.nair@apexfmcg.in');
  const [password, setPassword] = useState('apex2026');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up / Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('Finance Operations Lead');
  const [regOrg, setRegOrg] = useState('Apex FMCG & Cold-Chain Logistics Ltd.');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Interactive OAuth Modal State
  const [oauthModalProvider, setOauthModalProvider] = useState<'google' | 'microsoft' | null>(null);
  const [customOAuthEmail, setCustomOAuthEmail] = useState('');
  const [customOAuthName, setCustomOAuthName] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Standard Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Create Account (Registration)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        organization: regOrg,
      });
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth Authentication (supports custom email & persona selection)
  const handleOAuthExecute = async (provider: 'google' | 'microsoft', targetEmail?: string, targetName?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.oauthLogin({
        provider,
        email: targetEmail || customOAuthEmail,
        name: targetName || customOAuthName,
        organization: regOrg || 'Apex FMCG & Cold-Chain Logistics Ltd.',
      });
      setOauthModalProvider(null);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setAuthError(err.message || `Failed to authenticate with ${provider}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 overflow-y-auto font-sans text-slate-100 select-none">
      {/* 3D Ambient Coordinate Grid & Lighting Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 20%, rgba(15, 118, 110, 0.25) 0%, transparent 60%),
              radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.15) 0%, transparent 50%),
              linear-gradient(to right, rgba(51, 65, 85, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
          }}
        />
      </div>

      {/* Floating 3D Depth Particles */}
      <div className="absolute top-12 left-16 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-12 right-16 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Central 3D Card Portal */}
      <div className="relative z-10 w-full max-w-xl my-6">
        <Card3D
          depth={6}
          glare={true}
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-6 sm:p-8 shadow-3d-elevated"
        >
          {/* Brand Header */}
          <div className="text-center space-y-2 pb-5 border-b border-slate-800" style={{ transform: 'translateZ(14px)' }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-slate-950 font-black text-lg shadow-lg border-t border-teal-200/50">
              C28
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              LedgerLoop Receivables Desk
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h1>
            <p className="text-xs text-teal-400 font-medium">
              Know what is owed. Understand what needs attention. Decide what to do next.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
              <Building2 className="w-3 h-3 text-slate-300" />
              Apex FMCG &amp; Cold-Chain Logistics Ltd. • GSTIN: 27AAACA1234F1Z8
            </div>
          </div>

          {/* Mode Tabs: [ Sign In ] vs [ Create Account ] */}
          <div className="mt-5 flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 shadow-inner" style={{ transform: 'translateZ(12px)' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                authMode === 'signin'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded bg-red-950/80 border border-red-800 text-xs text-red-200">
              {authError}
            </div>
          )}

          {/* ================= MODE A: SIGN IN ================= */}
          {authMode === 'signin' && (
            <>
              {/* OAUTH FEDERATION SECTION */}
              <div className="mt-5 space-y-2.5" style={{ transform: 'translateZ(12px)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Single Sign-On (SSO) &amp; Federated Identity
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOauthModalProvider('google');
                      setCustomOAuthEmail('');
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md active:translate-y-[1px] disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Workspace</span>
                  </button>

                  {/* Microsoft 365 OAuth Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOauthModalProvider('microsoft');
                      setCustomOAuthEmail('');
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white font-semibold text-xs border border-slate-700 transition-all shadow-md active:translate-y-[1px] disabled:opacity-50"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                      <div className="bg-[#f25022] w-1.5 h-1.5" />
                      <div className="bg-[#7fba00] w-1.5 h-1.5" />
                      <div className="bg-[#00a4ef] w-1.5 h-1.5" />
                      <div className="bg-[#ffb900] w-1.5 h-1.5" />
                    </div>
                    <span>Microsoft 365 Entra</span>
                  </button>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="relative my-5" style={{ transform: 'translateZ(10px)' }}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-slate-900 px-3 text-slate-500">Or Corporate Credentials</span>
                </div>
              </div>

              {/* EMAIL & PASSWORD FORM */}
              <form onSubmit={handlePasswordLogin} className="space-y-3.5" style={{ transform: 'translateZ(14px)' }}>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Corporate Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@company.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-semibold text-xs rounded-md shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition-all active:translate-y-[1px] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Receivables Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ================= MODE B: CREATE ACCOUNT ================= */}
          {authMode === 'signup' && (
            <form onSubmit={handleRegister} className="mt-5 space-y-3.5" style={{ transform: 'translateZ(14px)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Afeef Ahmed"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="afeef@company.com"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Organization / Entity
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="Apex FMCG & Cold-Chain Logistics Ltd."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Operational AR Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="Finance Operations Lead">Finance Operations Lead (Full Ledger Ops)</option>
                    <option value="Credit Risk & Collections Manager">Credit Risk &amp; Collections Manager (Disputes &amp; Terms)</option>
                    <option value="CFO & Executive Director">CFO &amp; Executive Director (Executive &amp; Scenarios)</option>
                    <option value="AR & Cash Application Specialist">AR &amp; Cash Application Specialist (Payment Recon)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs rounded-md shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition-all active:translate-y-[1px] disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Registering Enterprise Profile...</span>
                ) : (
                  <>
                    <span>Create Enterprise Account &amp; Enter Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 1-CLICK DEMO PERSONAS FOR MBA EVALUATORS */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2" style={{ transform: 'translateZ(10px)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 1-Click Executive Demo Personas
              </span>
              <span className="text-[10px] text-slate-400 font-mono">For MBA Evaluators</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOAuthExecute('google', 'kavita.nair@apexfmcg.in', 'Kavita Nair');
                }}
                className="p-2 text-left bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 rounded transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-teal-800 text-teal-200 text-[10px] font-bold flex items-center justify-center">
                    KN
                  </span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 truncate">
                    Kavita Nair
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Finance Ops Lead</p>
                <span className="text-[9px] text-teal-400 font-mono block">Full Ledger Ops</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOAuthExecute('microsoft', 'rajesh.m@apexfmcg.in', 'Rajesh Mehta');
                }}
                className="p-2 text-left bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 rounded transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-sky-800 text-sky-200 text-[10px] font-bold flex items-center justify-center">
                    RM
                  </span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate">
                    Rajesh Mehta
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Credit Risk Lead</p>
                <span className="text-[9px] text-sky-400 font-mono block">Disputes &amp; Terms</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOAuthExecute('microsoft', 'v.singhania@apexfmcg.in', 'Vikramaditya Singhania');
                }}
                className="p-2 text-left bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-indigo-800 text-indigo-200 text-[10px] font-bold flex items-center justify-center">
                    VS
                  </span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                    V. Singhania
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">CFO / Director</p>
                <span className="text-[9px] text-indigo-400 font-mono block">Scenarios &amp; ROI</span>
              </button>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> AES-256 Transport Encryption
            </span>
            <span className="font-mono text-slate-400">Auditable Ledger v2.4</span>
          </div>
        </Card3D>
      </div>

      {/* ================= OAUTH MODAL DIALOG (Google / Microsoft) ================= */}
      {oauthModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {oauthModalProvider === 'google' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                ) : (
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <div className="bg-[#f25022] w-2 h-2" />
                    <div className="bg-[#7fba00] w-2 h-2" />
                    <div className="bg-[#00a4ef] w-2 h-2" />
                    <div className="bg-[#ffb900] w-2 h-2" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {oauthModalProvider === 'google' ? 'Google Workspace SSO' : 'Microsoft 365 Entra ID'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Authenticate with your corporate email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthModalProvider(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your personal or distributor email address to LedgerLoop. If this is your first time signing in with this email, your profile will be created automatically.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Enter Your {oauthModalProvider === 'google' ? 'Google' : 'Microsoft'} Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    autoFocus
                    required
                    value={customOAuthEmail}
                    onChange={(e) => setCustomOAuthEmail(e.target.value)}
                    placeholder="e.g. afeef@company.com or afeef@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Full Name / Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={customOAuthName}
                  onChange={(e) => setCustomOAuthName(e.target.value)}
                  placeholder="e.g. Afeef Ahmed"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <button
                type="button"
                disabled={!customOAuthEmail.trim() || isLoading}
                onClick={() => handleOAuthExecute(oauthModalProvider)}
                className={`w-full py-2.5 rounded-md font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:translate-y-[1px] ${
                  oauthModalProvider === 'google'
                    ? 'bg-white hover:bg-slate-100 text-slate-900'
                    : 'bg-[#00a4ef] hover:bg-[#0090d0] text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Continue with {oauthModalProvider === 'google' ? 'Google' : 'Microsoft'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setOauthModalProvider(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
