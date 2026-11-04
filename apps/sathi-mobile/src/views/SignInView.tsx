import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Phone, ShieldCheck, Users } from 'lucide-react';
import { HelperProfile } from '../types';
import { sathiApi } from '../services/api';

interface SignInViewProps {
  onSignedIn: (helper: HelperProfile) => void;
  onNavigateToRegister: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignedIn,
  onNavigateToRegister,
}) => {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [shownCode, setShownCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (next: 'otp' | 'password') => {
    setMode(next);
    setError('');
    setCodeSent(false);
    setCode('');
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!codeSent) {
        const res = await sathiApi.requestOtp(identifier.trim());
        setShownCode(res.demo_code || '');
        setCodeSent(true);
      } else {
        const res = await sathiApi.verifyOtp(identifier.trim(), code.trim());
        if (!res.is_registered) {
          sathiApi.logout();
          setError('No helper profile for this number yet. Create a helper account first.');
          return;
        }
        onSignedIn(res.helper);
      }
    } catch (err: any) {
      setError(err.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent) {
      setError('Please enter your mobile number or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      const res = await sathiApi.loginPassword(cleanIdent, password);
      onSignedIn(res.helper);
    } catch (err: any) {
      setError(err.message || 'Incorrect login details');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Branding Header matching reference design */}
      <div className="pt-8 pb-3 text-center">
        <div className="w-14 h-14 rounded-full bg-[#274236] text-white mx-auto flex items-center justify-center shadow-md mb-2.5">
          <Users className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sahay Sathi</h1>
        <p className="text-sm text-slate-500 mt-0.5 max-w-xs mx-auto">
          Service Provider Application for Hello Sahay
        </p>
      </div>

      {/* Main Direct Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs my-auto">
        <h2 className="text-base font-bold text-slate-900 mb-0.5">Helper Sign In</h2>
        <p className="text-xs text-slate-500 mb-4">
          {mode === 'otp'
            ? 'Enter your registered mobile number. We will send a 6-digit code.'
            : 'Enter your registered mobile number or email and your password.'}
        </p>

        {error && (
          <div className="mb-3.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'otp' ? handleOtp : handleSignIn} className="space-y-4">
          {/* Mobile Number or Gmail */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {mode === 'otp' ? 'Mobile Number' : 'Mobile Number or Email'}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                {identifier.includes('@') ? (
                  <Mail className="w-4 h-4 text-slate-500" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-500" />
                )}
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'otp' ? '98765 43210' : '98765 43210 or you@gmail.com'}
                readOnly={codeSent}
                className="w-full h-12 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-medium text-slate-900 bg-white"
                required
              />
            </div>
          </div>

          {mode === 'otp' && codeSent && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full h-12 px-3.5 text-lg tracking-[0.4em] rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-bold text-slate-900 bg-white"
                required
              />
              {shownCode && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Demo mode: your code is <strong className="text-slate-900">{shownCode}</strong>
                </p>
              )}
            </div>
          )}

          {mode === 'password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-12 pl-10 pr-10 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] text-slate-900 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Direct Sign In Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-[#274236] text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-[#1C3228] disabled:opacity-60 transition-colors shadow-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'otp' ? (codeSent ? 'Verify & Sign In' : 'Send Code') : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => switchMode(mode === 'otp' ? 'password' : 'otp')}
            className="w-full text-center text-xs font-semibold text-[#1E3A2F] hover:underline"
          >
            {mode === 'otp' ? 'Use a password instead' : 'Use an OTP instead'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">New to Sahay Sathi?</p>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="w-full h-12 rounded-2xl border border-slate-300 bg-white text-slate-800 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Create Helper Account
          </button>
        </div>
      </div>

      {/* Trust & Verification Footer */}
      <div className="py-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#274236]" />
          <span>Government ID Verified Helper Network</span>
        </div>
      </div>
    </div>
  );
};
