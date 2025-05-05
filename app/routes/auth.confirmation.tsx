import { Link } from "@remix-run/react";

export default function Confirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Account Created Successfully!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your TaskMaster account has been confirmed. You can now sign in to start managing your tasks.
          </p>
          
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 