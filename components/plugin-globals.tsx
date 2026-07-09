/**
 * ─── Plugin Globals ─────────────────────────────────────────────────────────
 *
 * Exposes React as a global variable so plugin UI bundles (loaded via <script>
 * tags) can access React, React.createElement, and the JSX runtime without
 * needing to bundle their own copy.
 *
 * Plugin bundles built with @open_shield/plugin-builder externalize "react"
 * and "react/jsx-runtime", mapping them to the global "React" object.
 *
 * This component must be a client component because it accesses React's
 * internal module to expose it on `window`.
 */

"use client";

import { useEffect } from "react";
import React from "react";

export function PluginGlobals() {
  useEffect(() => {
    // Expose React globally for plugin bundles loaded via <script> tags
    (window as any).React = React;
  }, []);

  // This component doesn't render anything visible
  return null;
}