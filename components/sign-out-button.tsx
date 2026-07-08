"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
    >
      Sign out
    </button>
  );
}
