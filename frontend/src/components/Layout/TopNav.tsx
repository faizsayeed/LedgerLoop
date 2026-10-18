import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  Building2,
  RefreshCw,
  Bell,
  CheckCircle2,
  SlidersHorizontal,
  LogOut,
  User,
  Shield,
  ChevronDown
} from 'lucide-react';
import { CompanyInfo, UserProfile } from '../../types';

interface TopNavProps {
  company: CompanyInfo | null;
  asOfDate: string;
  onUpdateAsOfDate: (newDate: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  exceptionCount: number;
  onResetData: () => void;
  currentTabName: string;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onSwitchPersona?: (email: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  company,
  asOfDate,
  onUpdateAsOfDate,
  searchQuery,
  onSearchChange,
  exceptionCount,
  onResetData,
  currentTabName,
  currentUser,
  onLogout,
  onSwitchPersona,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDatePreset = (daysToAdd: number) => {
    try {
      const dt = new Date(asOfDate);
      dt.setDate(dt.getDate() + daysToAdd);
      const iso = dt.toISOString().slice(0, 10);
      onUpdateAsOfDate(iso);
    } catch {
      // fallback
    }
  };

  return (
    <header className="h-14 bg-[#0d121f] border-b border-slate-800 px-4 flex items-center justify-between gap-3 flex-shrink-0 z-20">
      {/* Left: Breadcrumbs & Entity Pill */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Desk</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-100 font-bold">{currentTabName}</span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden md:block" />

        {/* Distributor Entity Selector */}
        <div
          title={company?.company_name || 'Apex Distribution Ltd'}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
        >
          <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="font-semibold max-w-[150px] lg:max-w-[190px] truncate text-slate-200">
            {company?.company_name || 'Apex Distribution'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">[{company?.gstin?.slice(0, 5) || '27AAA'}]</span>
        </div>
      </div>

      {/* Middle: Proportional Search Box */}
      <div className="flex-1 max-w-xs sm:max-w-sm mx-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search invoice ID, customer, PO..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:bg-[#0a0e17] focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls: Compact As-Of Date, Freshness, Reset, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* As-Of Date Selector */}
        <div className="flex items-center border border-slate-800 rounded-md text-xs bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-950/70 border-r border-slate-800 text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="hidden lg:inline text-[11px]">As of:</span>
          </div>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => {
              if (e.target.value) onUpdateAsOfDate(e.target.value);
            }}
            className="px-1.5 py-1 text-xs font-mono font-medium text-slate-200 focus:outline-none cursor-pointer bg-slate-900"
          />
          <button
            onClick={() => handleDatePreset(7)}
            title="Advance as-of date by +7 days"
            className="px-1.5 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l border-slate-800 font-medium transition-colors"
          >
            +7d
          </button>
          <button
            onClick={() => handleDatePreset(30)}
            title="Advance as-of date by +30 days"
            className="px-1.5 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l border-slate-800 font-medium transition-colors"
          >
            +30d
          </button>
        </div>

        {/* Live Freshness Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync</span>
        </div>

        {/* Reset State Action */}
        <button
          onClick={onResetData}
          title="Reset database to initial fixture"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative pl-1 border-l border-slate-800" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-800/80 transition-colors"
          >
            <div
              className="w-7 h-7 text-white font-bold rounded-full flex items-center justify-center text-xs shadow-sm ring-1 ring-slate-700"
              style={{ backgroundColor: currentUser?.avatar_color || '#0f766e' }}
            >
              {currentUser?.avatar_initials || 'KN'}
            </div>
            <div className="hidden 2xl:block text-left text-xs leading-tight">
              <span className="font-semibold text-slate-200 block truncate max-w-[120px]">
                {currentUser?.name || 'Kavita Nair'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                {currentUser?.role || 'Finance Ops Lead'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Flyout Card */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0f172a] border border-slate-800 rounded-lg shadow-2xl p-3.5 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100 text-slate-200">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                <div
                  className="w-10 h-10 text-white font-bold rounded-full flex items-center justify-center text-sm shadow-md"
                  style={{ backgroundColor: currentUser?.avatar_color || '#0f766e' }}
                >
                  {currentUser?.avatar_initials || 'KN'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-100 truncate">{currentUser?.name || 'Kavita Nair'}</h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email || 'kavita.nair@apexfmcg.in'}</p>
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-[9px] font-semibold">
                    {currentUser?.role || 'Finance Operations Lead'}
                  </span>
                </div>
              </div>

              {/* Identity & Org Metadata */}
              <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[11px] space-y-1 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Organization:</span>
                  <span className="font-medium text-slate-200 text-[10px] truncate max-w-[140px]" title={currentUser?.organization || company?.company_name}>
                    {currentUser?.organization || company?.company_name || 'Apex FMCG Logistics'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auth Identity:</span>
                  <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                    {currentUser?.auth_provider === 'google'
                      ? 'Google SSO ✓'
                      : currentUser?.auth_provider === 'microsoft'
                      ? 'Microsoft 365 ✓'
                      : 'Enterprise Local ✓'}
                  </span>
                </div>
              </div>

              {/* Persona Quick Switcher for MBA Demos */}
              {onSwitchPersona && (() => {
                let customUser: UserProfile | null = null;
                try {
                  const raw = localStorage.getItem('c28_custom_user');
                  if (raw) customUser = JSON.parse(raw);
                } catch {}

                return (
                  <div className="pt-1 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Switch Active Persona:
                      </span>
                      {customUser && (
                        <span className="text-[9px] text-emerald-400 font-semibold font-mono">My Account Active</span>
                      )}
                    </div>
                    <div className={`grid gap-1 text-[10px] ${customUser ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {customUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchPersona(customUser!.email);
                            setShowProfileMenu(false);
                          }}
                          className={`p-1.5 rounded font-medium transition-colors text-center truncate col-span-2 ${
                            currentUser?.email === customUser.email
                              ? 'bg-emerald-600 text-white font-bold shadow-sm'
                              : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          👤 My Account ({customUser.name})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchPersona('kavita.nair@apexfmcg.in');
                          setShowProfileMenu(false);
                        }}
                        className={`p-1 rounded font-medium transition-colors text-center ${
                          currentUser?.email === 'kavita.nair@apexfmcg.in'
                            ? 'bg-teal-700 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        Kavita (Ops)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchPersona('rajesh.m@apexfmcg.in');
                          setShowProfileMenu(false);
                        }}
                        className={`p-1 rounded font-medium transition-colors text-center ${
                          currentUser?.email === 'rajesh.m@apexfmcg.in'
                            ? 'bg-sky-700 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        Rajesh (Risk)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchPersona('v.singhania@apexfmcg.in');
                          setShowProfileMenu(false);
                        }}
                        className={`p-1 rounded font-medium transition-colors text-center ${
                          currentUser?.email === 'v.singhania@apexfmcg.in'
                            ? 'bg-indigo-700 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        } ${customUser ? 'col-span-2' : ''}`}
                      >
                        Vikramaditya (CFO)
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Sign Out Button */}
              {onLogout && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out Session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
