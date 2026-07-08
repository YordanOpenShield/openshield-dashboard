import type { NextConfig } from "next";

const MANAGER_API = process.env.MANAGER_API_URL ?? "http://localhost:9000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Agent endpoints
      {
        source: "/api/agents/:path*",
        destination: `${MANAGER_API}/api/agents/:path*`,
      },
      // Job endpoints
      {
        source: "/api/jobs/:path*",
        destination: `${MANAGER_API}/api/jobs/:path*`,
      },
      // Task endpoints
      {
        source: "/api/tasks/:path*",
        destination: `${MANAGER_API}/api/tasks/:path*`,
      },
      // Tool endpoints
      {
        source: "/api/tools/:path*",
        destination: `${MANAGER_API}/api/tools/:path*`,
      },
      // Certificate endpoints
      {
        source: "/api/certs/:path*",
        destination: `${MANAGER_API}/api/certs/:path*`,
      },
      // Query endpoints
      {
        source: "/api/queries/:path*",
        destination: `${MANAGER_API}/api/queries/:path*`,
      },
      // Query execution endpoints
      {
        source: "/api/query-executions/:path*",
        destination: `${MANAGER_API}/api/query-executions/:path*`,
      },
      // Group endpoints
      {
        source: "/api/groups/:path*",
        destination: `${MANAGER_API}/api/groups/:path*`,
      },
      // Bulk operation endpoints
      {
        source: "/api/bulk-operations/:path*",
        destination: `${MANAGER_API}/api/bulk-operations/:path*`,
      },
      // SSE event streams
      {
        source: "/events/:path*",
        destination: `${MANAGER_API}/events/:path*`,
      },
    ];
  },
};

export default nextConfig;
