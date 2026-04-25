import Link from 'next/link';
import { Shield } from '@/components/icons';

// TODO: wire to POST /api/auth/forgot-password once that endpoint is implemented
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Reset password</h1>
          <p className="text-indigo-300 text-sm mt-1">
            Contact your admin to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-sm text-gray-600 mb-6">
            Password reset is managed by your system administrator. Please reach out to them directly.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
