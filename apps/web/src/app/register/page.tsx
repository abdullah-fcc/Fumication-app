'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Eye, EyeOff } from '@/components/icons';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

// Roles a user can self-register as.
// Admin and manager accounts are created by an admin only.
const SELF_REGISTER_ROLES = [
  { value: 'worker', label: 'Field Worker — I carry out fumigation jobs' },
  { value: 'client', label: 'Client — I own a restaurant or business' },
] as const;

function validate(fields: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = 'Full name is required.';
  }
  if (!fields.email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!fields.role) {
    errors.role = 'Please select your role.';
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPw]     = useState('');
  const [role, setRole]                     = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [showConfirmPw, setShowConfirmPw]   = useState(false);
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate({ name, email, password, confirmPassword, role });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/api/auth/register', { name, email, password, role });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setErrors({ general: err.response?.data?.error ?? 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-8">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl font-bold">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account created</h2>
          <p className="text-sm text-gray-500">Redirecting you to sign in&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — form */}
      <div className="flex flex-col w-full lg:w-1/2 px-8 sm:px-16 py-10 bg-white justify-center">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">FumiGuard Pro</span>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create an account</h1>
          <p className="text-gray-500 text-sm">Fill in your details to get started.</p>
        </div>

        {errors.general && (
          <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-sm">
          <Input
            label="Full name"
            type="text"
            id="name"
            autoComplete="name"
            placeholder="Ahmed Khan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Email address"
            type="email"
            id="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            endAdornment={
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((v) => !v)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Input
            label="Confirm password"
            type={showConfirmPw ? 'text' : 'password'}
            id="confirm-password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPw(e.target.value)}
            error={errors.confirmPassword}
            endAdornment={
              <button
                type="button"
                aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPw((v) => !v)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Role selection */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">I am a&hellip;</label>
            <div className="space-y-2">
              {SELF_REGISTER_ROLES.map(({ value, label }) => (
                <label
                  key={value}
                  className={[
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    role === value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {errors.role && (
              <p role="alert" className="text-xs text-red-600">{errors.role}</p>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create account
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      {/* Right — brand panel (same as login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col items-center justify-center px-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500 opacity-40" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-700 opacity-50" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Join FumiGuard<br />Pro today.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Pakistan&apos;s first digital platform for professional fumigation and pest control management.
          </p>
        </div>
      </div>

    </div>
  );
}
