import Link from 'next/link';
import { LogoMark, BRAND_TAGLINE } from '@/components/Logo';

// TODO: wire to POST /api/auth/forgot-password once that endpoint is implemented
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-slate-900 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-4 shadow-lg">
            <LogoMark size={44} />
          </div>
          <p className="text-accent-400 text-sm font-medium italic mb-2">{BRAND_TAGLINE}</p>
          <h1 className="text-xl font-bold text-white">Reset password</h1>
          <p className="text-brand-300 text-sm mt-1">
            Contact your admin to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-sm text-gray-600 mb-6">
            Password reset is managed by your system administrator. Please reach out to them directly.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
