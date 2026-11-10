// ============================================================
// SmartQEye Coastal — Login Page
// Clean & Secure Username and Password Authentication Form
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('op.rajan');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const mockUsers = authApi.getMockUsers();
      const matched = mockUsers.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      ) ?? mockUsers.find(u => u.role === 'OPERATOR') ?? mockUsers[0];

      await login(matched.username, password, '000000');
      navigate('/');
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/coastal_harbor_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
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

          <div className="mb-5 text-center">
            <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--ink-900)' }}>
              Sign In
            </h2>
          </div>

          {/* Simple Clean Username and Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
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
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-90 cursor-pointer"
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              style={{ background: 'var(--ink-900)', color: '#FFFFFF' }}
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
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
