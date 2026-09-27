import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { User, UserRole } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const users = CRMStorageService.getUsers();
  const [email, setEmail] = useState('rich.rubinni@kmrealestate.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const inputEmail = email.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === inputEmail ||
        (u.role === 'owner' && (inputEmail === 'owner@kmrealestate.com' || inputEmail === 'rich@kmrealestate.com'))
    );

    if (!matched) {
      setErrorMsg('No user found with this email. Please check your credentials or click a role profile below.');
      return;
    }

    if (matched.password && matched.password !== password) {
      setErrorMsg('Invalid password. Default demo password is "password123".');
      return;
    }

    if (!matched.active) {
      setErrorMsg('This staff account has been deactivated. Please contact your CRM Administrator.');
      return;
    }

    CRMStorageService.setCurrentUser(matched);
    onLoginSuccess(matched);
  };

  const handleQuickSelect = (user: User) => {
    CRMStorageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header branding */}
        <div className="p-8 bg-gradient-to-b from-slate-900 to-emerald-950 text-white text-center relative flex flex-col items-center">
          <div className="mb-3.5 transform hover:scale-105 transition-transform duration-300">
            <KMLogo size={80} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">KM REAL ESTATE CRM</h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-xs mx-auto">
            Enterprise Client Pipeline, Multi-Project Allocations & Sales Management
          </p>
        </div>

        {/* Login form */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@kmrealestate.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Sign In to CRM
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role-Based Quick Access Demo Profiles */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Quick Role-Based Login:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Auth</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-left transition"
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                        u.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'closer'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'telecaller'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[9px] text-slate-400">Click to enter</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Role permissions strictly enforced. Setters, Closers & Telecallers only see their own assigned data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
