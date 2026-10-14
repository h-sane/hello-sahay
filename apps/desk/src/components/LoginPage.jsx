import { useState } from "react";
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
} from "lucide-react";
import { hospitals } from "../data/mockData";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const foundHospital = Object.values(hospitals).find(
      (h) =>
        h.email.toLowerCase() === trimmedEmail && h.password === password
    );

    if (foundHospital) {
      onLogin(foundHospital.id);
    } else {
      setError("Invalid hospital email or password. Please verify your credentials or contact facility administration.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
            <Activity className="w-7 h-7" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            Sahay Desk
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Hospital & Clinic Portal
        </h2>
        <p className="text-base text-slate-600 mt-2">
          Clinical Receptionist & Outpatient Queue Administration
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Facility Sign In</h3>
              <p className="text-sm text-slate-500 mt-0.5">Access your clinic or hospital dashboard</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secure
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Facility Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hospital@sahayhealth.org"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 border border-transparent rounded-xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors"
            >
              Sign In to Portal
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Authorized personnel only. All access is logged and encrypted.
            </p>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-slate-400">
          Sahay Health Systems · Outpatient Management System
        </div>
      </div>
    </div>
  );
}
