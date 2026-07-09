"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid email or password");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSsoError("");
    setSsoLoading(true);

    try {
      const { error: ssoSignInError } = await authClient.signIn.sso({
        email: ssoEmail,
        callbackURL: "/dashboard",
      });

      if (ssoSignInError) {
        setSsoError(ssoSignInError.message ?? "SSO sign-in failed. No provider found for this domain.");
      }
    } catch {
      setSsoError("An error occurred. Please try again.");
    } finally {
      setSsoLoading(false);
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
              Sign in to access your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111111] px-3 text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          {/* SSO Sign-In */}
          <form className="space-y-4" onSubmit={handleSSOLogin}>
            {ssoError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center">
                {ssoError}
              </div>
            )}

            <div>
              <label
                htmlFor="sso-email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Company email
              </label>
              <input
                id="sso-email"
                name="sso-email"
                type="email"
                autoComplete="email"
                required
                value={ssoEmail}
                onChange={(e) => setSsoEmail(e.target.value)}
                className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={ssoLoading}
              className="w-full flex justify-center py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {ssoLoading ? "Redirecting..." : "Continue with SSO"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-600">
            Contact your administrator for account access
          </div>
        </div>
      </div>
    </div>
  );
}
