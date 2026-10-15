import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, LogIn, Shield, Users, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, login, register, switchUser } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'manager' | 'member'>('member');
  const [regDepartment, setRegDepartment] = useState('Engineering');
  const [regTitle, setRegTitle] = useState('Software Engineer');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    const success = await login(signInEmail);
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setErrorMessage('User with this email not found. Please register or select a demo account.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Name and email are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    const success = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      department: regDepartment.trim(),
      title: regTitle.trim(),
    });
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setErrorMessage('Could not register account. Email might already exist.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              TaskFlow Authentication & Multi-User Personas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sign in, register a new account, or toggle team personas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Personas Box */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-2">
            Quick Persona Switcher (For immediate testing)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  switchUser(u.id);
                  onClose();
                }}
                className={`p-2 rounded-xl text-left border transition-all text-xs flex items-center gap-2 ${
                  u.id === currentUser?.id
                    ? 'border-blue-500 bg-white shadow-xs font-semibold text-blue-900'
                    : 'border-blue-200/60 bg-white/70 hover:bg-white text-slate-700'
                }`}
              >
                <img
                  src={
                    u.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
                  }
                  alt={u.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="truncate">
                  <p className="truncate leading-tight font-medium">{u.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {u.role === 'manager' ? 'Manager (Lead)' : 'Member'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 px-6 pt-3">
          <button
            onClick={() => {
              setTab('signin');
              setErrorMessage('');
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors mr-6 ${
              tab === 'signin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In with Email
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register New User
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="alex.morgan@taskflow.dev"
                  className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Jordan Lee"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jordan.lee@taskflow.dev"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="member">Team Member</option>
                    <option value="manager">Manager / Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="Engineering"
                    className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  placeholder="QA Automation Engineer"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Account...' : 'Register Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
