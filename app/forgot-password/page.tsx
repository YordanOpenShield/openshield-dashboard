"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const { error: reqError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (reqError) {
        setError(reqError.message ?? "Failed to send reset email. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md mx-auto px-4">
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <Link
              href="/"
              className="inline-block text-2xl font-bold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent"
            >
              OpenShield
            </Link>
            <p className="text-gray-400 text-sm">
              Reset your password
            </p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg p-4 text-center">
                <p className="font-medium mb-1">Check your inbox</p>
                <p className="text-emerald-400/70">
                  If an account exists for <strong className="text-emerald-300">{email}</strong>,
                  you'll receive a password reset link shortly.
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center">
                  {error}
                </div>
              )}

              {/* Info */}
              <p className="text-gray-500 text-sm text-center mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                    placeholder="admin@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  Remember your password? <span className="text-violet-400 hover:text-violet-300">Sign in</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
