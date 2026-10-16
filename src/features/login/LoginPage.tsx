// ============================================================
// SmartQEye Coastal — Login Page
// Full-screen Harbor photograph + Light yellowish gradient overlay + Centered white card
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { ROLE_CONFIG, ROLES_LIST, getRoleDisplayName } from '@/lib/roleConfig';
import { authApi } from '@/lib/api';
import type { UserRole } from '@/types';

type Step = 'credentials' | 'mfa';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [selectedRole, setSelectedRole] = useState<UserRole>('OPERATOR');
  const [username, setUsername] = useState(() => {
    const users = authApi.getMockUsers();
    return users.find(u => u.role === 'OPERATOR')?.username ?? 'op.rajan';
  });
  const [password, setPassword] = useState('admin123');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user, devRole } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const activeRole = user?.role ?? devRole ?? 'OPERATOR';
      const landing = ROLE_CONFIG[activeRole]?.landing ?? '/';
      navigate(landing, { replace: true });
    }
  }, [isAuthenticated, user, devRole, navigate]);

  function handleRoleChange(newRole: UserRole) {
    setSelectedRole(newRole);
    setError('');
    const mockUser = authApi.getMockUsers().find(u => u.role === newRole);
    if (mockUser) {
      setUsername(mockUser.username);
    }
    setPassword('admin123');
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    if (password !== ROLE_CONFIG[selectedRole].demoPassword) {
      setError('Incorrect password for the selected role.');
      return;
    }
    setStep('mfa');
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const roleMockUser = authApi.getMockUsers().find(u => u.role === selectedRole) ?? authApi.getMockUsers()[0];
      await login(roleMockUser.username, password, mfaCode);
      navigate(ROLE_CONFIG[roleMockUser.role].landing);
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSSO() {
    setLoading(true);
    try {
      const roleMockUser = authApi.getMockUsers().find(u => u.role === selectedRole) ?? authApi.getMockUsers()[0];
      await login(roleMockUser.username, 'demo', '000000');
      navigate(ROLE_CONFIG[roleMockUser.role].landing);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 pt-16 overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/coastal_harbor_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ── Top Classification banner ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 text-center py-1.5 text-xs font-semibold font-mono tracking-widest shadow-md"
        style={{
          background: '#13281E',
          color: '#7FEFA0',
          borderBottom: '1px solid rgba(127, 239, 160, 0.25)',
        }}
      >
        RESTRICTED — AUTHORISED USE ONLY — ALL ACCESS IS AUDITED AND LOGGED
      </div>

      {/* ── Gradient Color Overlay (matching light yellowish gradient layered over photo) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(254, 249, 231, 0.65) 0%, rgba(245, 236, 211, 0.60) 45%, rgba(238, 223, 181, 0.70) 100%)',
        }}
      />

      {/* ── Centered Container ── */}
      <div className="w-full max-w-md relative z-10 my-auto">
        {/* ── Centered White Login Card ── */}
        <div
          className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border"
          style={{
            borderColor: 'var(--sand-300)',
            boxShadow: '0 20px 50px -10px rgba(18, 48, 63, 0.25), 0 10px 25px -5px rgba(18, 48, 63, 0.12)',
          }}
        >
          {/* Brand header */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--sand-50)] p-2 shadow-sm border flex items-center justify-center"
              style={{ borderColor: 'var(--sand-300)' }}
            >
              <img
                src="/QW_logo.png"
                alt="Quantumweave Intelligence"
                className="w-full h-full object-contain"
              />
            </div>
            <h1
              className="font-serif text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--ink-900)' }}
            >
              SmartQEye Coastal
            </h1>
            <p
              className="text-xs font-mono tracking-wider uppercase mt-1 opacity-70"
              style={{ color: 'var(--ink-600)' }}
            >
              Authorized Personnel Portal
            </p>
          </div>

          {step === 'credentials' ? (
            <>
              <div className="mb-5 text-center">
                <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--ink-900)' }}>
                  Sign In
                </h2>
              </div>

              {/* Role selection dropdown */}
              <div className="mb-4">
                <label
                  htmlFor="login-role"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--ink-800)' }}
                >
                  Role
                </label>
                <select
                  id="login-role"
                  value={selectedRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-[var(--sea-600)] shadow-xs cursor-pointer"
                  style={{
                    background: 'var(--sand-50)',
                    borderColor: 'var(--sand-300)',
                    color: 'var(--ink-900)',
                  }}
                >
                  {ROLES_LIST.map(role => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
              </div>

              {/* SSO Button */}
              <button
                id="login-sso"
                type="button"
                onClick={handleSSO}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl mb-4 font-medium text-sm transition-all border hover:opacity-90 disabled:opacity-50 shadow-sm"
                style={{ background: 'var(--sea-600)', color: 'white', borderColor: 'var(--sea-600)' }}
              >
                <Shield className="w-4 h-4" />
                Sign in with Police SSO
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'var(--sand-300)' }} />
                <span className="text-xs uppercase font-mono tracking-wider opacity-60" style={{ color: 'var(--ink-600)' }}>
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--sand-300)' }} />
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--ink-800)' }}
                  >
                    Username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="police.username"
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-[var(--sea-600)] shadow-xs"
                    style={{
                      background: 'var(--sand-50)',
                      borderColor: 'var(--sand-300)',
                      color: 'var(--ink-900)',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--ink-800)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-[var(--sea-600)] shadow-xs"
                      style={{
                        background: 'var(--sand-50)',
                        borderColor: 'var(--sand-300)',
                        color: 'var(--ink-900)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-90"
                      style={{ color: 'var(--ink-900)' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-red-600 font-semibold">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 shadow-md"
                  style={{ background: 'var(--ink-900)', color: '#FFFFFF' }}
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-xs mb-4 flex items-center gap-1 font-semibold transition-opacity opacity-80 hover:opacity-100"
                style={{ color: 'var(--sea-600)' }}
              >
                ← Back to credentials
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--sea-100)' }}
                >
                  <Lock className="w-5 h-5" style={{ color: 'var(--sea-600)' }} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--ink-900)' }}>
                    Two-Factor Authentication
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--ink-600)' }}>
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>

              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label htmlFor="login-mfa" className="sr-only">
                    Authentication Code
                  </label>
                  <input
                    id="login-mfa"
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full text-center px-3 py-3 rounded-xl text-2xl font-mono tracking-[0.5em] border outline-none focus:ring-2 focus:ring-[var(--sea-600)] shadow-xs"
                    style={{
                      background: 'var(--sand-50)',
                      borderColor: 'var(--sand-300)',
                      color: 'var(--ink-900)',
                    }}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-center font-medium opacity-70" style={{ color: 'var(--ink-600)' }}>
                  Demo: enter any 6 digits and click Verify
                </p>

                {error && (
                  <p role="alert" className="text-xs text-red-600 text-center font-semibold">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 shadow-md"
                  style={{ background: 'var(--sea-600)', color: 'white' }}
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* ── Classification notice below card ── */}
        <div
          className="mt-4 rounded-xl p-3 text-xs text-center border backdrop-blur-md shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            color: 'var(--ink-800)',
            borderColor: 'rgba(227, 205, 147, 0.75)',
          }}
        >
          <Shield className="w-3.5 h-3.5 inline mr-1 text-emerald-700" />
          Authorised use only. All access is audited and logged per Kerala Police IT security policy.
        </div>

        {/* ── Footer ── */}
        <p className="mt-4 text-center text-xs font-semibold drop-shadow-xs" style={{ color: 'var(--ink-900)' }}>
          SmartQEye Coastal v1.0.3 · Quantumweave Intelligence Pvt. Ltd.
        </p>
      </div>
    </div>
  );
}
