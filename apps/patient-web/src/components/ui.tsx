import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { Language } from '../types';

/** Pick the string for the current language; Tamil and Hindi fall back to English. */
export function pick<T>(lang: Language, o: { en: T; hi: T; ta: T }): T {
  return (o as Record<string, T>)[lang] ?? o.en;
}

export const inputCls =
  'w-full h-16 rounded-2xl border-2 border-slate-400 bg-white px-4 text-xl text-slate-900 placeholder:text-slate-500 ' +
  'focus:border-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-800/20';

export const Title: React.FC<{ children: React.ReactNode; sub?: React.ReactNode }> = ({ children, sub }) => (
  <header className="mb-5">
    <h1 className="text-[30px] leading-tight font-extrabold text-slate-900">{children}</h1>
    {sub && <p className="mt-1 text-lg text-slate-700">{sub}</p>}
  </header>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-8 mb-3 text-2xl font-extrabold text-slate-900">{children}</h2>
);

type Variant = 'primary' | 'secondary' | 'danger' | 'soft' | 'quiet';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-teal-800 text-white border-teal-800 active:bg-teal-900',
  secondary: 'bg-white text-teal-900 border-teal-800 active:bg-teal-50',
  danger: 'bg-red-700 text-white border-red-700 active:bg-red-800',
  soft: 'bg-teal-50 text-teal-950 border-teal-100 active:bg-teal-100',
  quiet: 'bg-transparent text-slate-800 border-transparent underline underline-offset-4 active:bg-slate-100',
};

interface BigButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: Variant;
  icon?: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  small?: boolean;
  className?: string;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children, onClick, href, variant = 'primary', icon, busy, disabled, type = 'button', small, className = '',
}) => {
  const cls =
    `w-full inline-flex items-center justify-center gap-3 rounded-2xl border-2 font-bold text-center ` +
    `${small ? 'min-h-14 px-4 text-lg' : 'min-h-16 px-5 text-xl'} ${VARIANT[variant]} ` +
    `disabled:opacity-50 transition-colors ${className}`;
  const body = (
    <>
      {busy ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden /> : icon}
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls} {...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}>
        {body}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} className={cls}>
      {body}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; tone?: 'plain' | 'teal' | 'red'; className?: string }> = ({
  children, tone = 'plain', className = '',
}) => {
  const t = { plain: 'bg-white border-slate-300', teal: 'bg-teal-50 border-teal-200', red: 'bg-red-50 border-red-300' }[tone];
  return <section className={`rounded-3xl border-2 p-5 ${t} ${className}`}>{children}</section>;
};

const NOTICE: Record<'info' | 'warn' | 'error' | 'success', { cls: string; icon: React.ReactNode }> = {
  info: { cls: 'bg-sky-50 border-sky-300 text-sky-950', icon: <Info className="w-7 h-7 shrink-0" aria-hidden /> },
  warn: { cls: 'bg-amber-50 border-amber-400 text-amber-950', icon: <AlertTriangle className="w-7 h-7 shrink-0" aria-hidden /> },
  error: { cls: 'bg-red-50 border-red-400 text-red-950', icon: <XCircle className="w-7 h-7 shrink-0" aria-hidden /> },
  success: { cls: 'bg-emerald-50 border-emerald-400 text-emerald-950', icon: <CheckCircle2 className="w-7 h-7 shrink-0" aria-hidden /> },
};

export const Notice: React.FC<{ tone?: keyof typeof NOTICE; children: React.ReactNode }> = ({ tone = 'info', children }) => (
  <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-2xl border-2 p-4 text-lg font-semibold ${NOTICE[tone].cls}`}>
    {NOTICE[tone].icon}
    <div>{children}</div>
  </div>
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block mb-2 text-lg font-bold text-slate-900">{label}</span>
    {children}
    {hint && <span className="block mt-1 text-base text-slate-600">{hint}</span>}
  </label>
);

export const Spinner: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-6 text-xl font-semibold text-slate-800" role="status">
    <Loader2 className="w-8 h-8 animate-spin text-teal-800" aria-hidden />
    {label}
  </div>
);

/** A full-width panel that rises from the bottom; the close button is always top right and labelled. */
export const Sheet: React.FC<{ title: string; closeLabel: string; onClose: () => void; children: React.ReactNode }> = ({
  title, closeLabel, onClose, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 pb-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
        <button
          onClick={onClose}
          className="flex min-h-14 shrink-0 items-center gap-2 rounded-2xl border-2 border-slate-400 px-4 text-lg font-bold text-slate-900"
          aria-label={closeLabel}
        >
          <X className="w-6 h-6" aria-hidden />
          {closeLabel}
        </button>
      </div>
      {children}
    </div>
  </div>
);

export function rupees(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
