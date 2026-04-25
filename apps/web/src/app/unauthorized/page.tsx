import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-indigo-600 mb-4">403</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-sm text-gray-500 mb-8">
          You don&apos;t have permission to view this page. Contact your admin if you think this is a mistake.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
