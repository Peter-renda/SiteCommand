import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const isNew = params.new === "1";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {isNew ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Your account has been created!
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Your subscription is active. Sign in to access your dashboard.
            </p>
            <Link
              href="/login"
              className="inline-block py-2 px-6 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              You&apos;re all set!
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Your company subscription is active. Head to your dashboard to get started.
            </p>
            <Link
              href="/dashboard"
              className="inline-block py-2 px-6 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
