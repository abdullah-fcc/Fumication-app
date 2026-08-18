'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { getErrorMessage } from '@/lib/api';
import { storeAuth, type AuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Eye, EyeOff, Briefcase, Users, Package } from '@/components/icons';
import { LogoMark, BRAND_FULL_NAME, BRAND_TAGLINE } from '@/components/Logo';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

const features = [
  { Icon: Briefcase, text: 'Schedule and track fumigation jobs' },
  { Icon: Users,     text: 'Manage field workers with GPS check-in' },
  { Icon: Package,   text: 'Real-time chemical inventory tracking' },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(email, password);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      storeAuth(data.token, data.user as AuthUser, remember);
      router.push('/');
    } catch (err: any) {
      setErrors({ general: getErrorMessage(err, 'Sign in failed. Please try again.') });
    } finally {
      setLoading(false);
    }
  }

  const pwToggle = (
    <button
      type="button"
      aria-label={showPw ? 'Hide password' : 'Show password'}
      onClick={() => setShowPw((v) => !v)}
      className="text-gray-400 hover:text-gray-600 transition-colors"
    >
      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="min-h-screen flex">

      {/* Left — form */}
      <div className="flex flex-col w-full lg:w-1/2 px-8 sm:px-16 py-10 bg-white justify-center">
        <div className="flex items-center gap-2.5 mb-12">
          <LogoMark size={34} className="flex-shrink-0" />
          <div className="leading-tight">
            <span className="block font-bold text-brand-600 text-sm tracking-tight">
              {BRAND_FULL_NAME}
            </span>
            <span className="block text-accent-600 text-xs font-medium italic">
              {BRAND_TAGLINE}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm">Please enter your details to sign in.</p>
        </div>

        {errors.general && (
          <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-sm">
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            endAdornment={pwToggle}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember for 30 days"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Forgot password
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign in
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col items-center justify-center px-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500 opacity-40" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-800 opacity-60" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-lg">
            <LogoMark size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
            Pest Control,<br />Digitized.
          </h2>
          <p className="text-accent-300 text-base font-medium italic mb-4">{BRAND_TAGLINE}</p>
          <p className="text-brand-200 text-sm leading-relaxed mb-10">
            Insta Fumigation replaces paper-based workflows with a complete digital platform for Pakistan&apos;s fumigation and pest control industry.
          </p>
          <ul className="space-y-4 text-left">
            {features.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-brand-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
