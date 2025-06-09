import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-2 text-blue-700">OpenShield Dashboard</h2>
      <p className="text-gray-600 mb-8">
        Welcome! Get started by exploring your agents, jobs, and tasks.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/agents"
          className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg shadow hover:bg-blue-100 transition group"
        >
          <span className="text-blue-600 text-4xl mb-2 group-hover:scale-110 transition">🛡️</span>
          <span className="text-lg font-semibold text-blue-700 mb-1">Agents</span>
          <span className="text-sm text-gray-500">View and manage agents</span>
        </Link>
        <Link
          href="/jobs"
          className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg shadow hover:bg-green-100 transition group"
        >
          <span className="text-green-600 text-4xl mb-2 group-hover:scale-110 transition">🗂️</span>
          <span className="text-lg font-semibold text-green-700 mb-1">Jobs</span>
          <span className="text-sm text-gray-500">Monitor and schedule jobs</span>
        </Link>
        <Link
          href="/tasks"
          className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg shadow hover:bg-purple-100 transition group"
        >
          <span className="text-purple-600 text-4xl mb-2 group-hover:scale-110 transition">✅</span>
          <span className="text-lg font-semibold text-purple-700 mb-1">Tasks</span>
          <span className="text-sm text-gray-500">Track and assign tasks</span>
        </Link>
      </div>
    </section>
  );
}