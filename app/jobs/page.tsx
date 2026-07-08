import { getJobsList } from "@/lib/manager-client";
import { CreateJobForm } from "./create-job-form";

// ─── Jobs Page ───────────────────────────────────────────────────────────────

export default async function JobsPage() {
  const jobs = await getJobsList().catch(() => []);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Jobs</h1>
          <p className="text-gray-400 mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <CreateJobForm />
      </div>

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Jobs</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Create a job to define a command or script that can be assigned to agents as tasks.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all duration-200">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-200">{job.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      job.type === "COMMAND"
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      {job.type}
                    </span>
                  </div>
                  {job.description && (
                    <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                  )}
                  <p className="text-xs text-gray-600 font-mono mt-2">
                    Target: {job.target}
                  </p>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {job.id.slice(0, 8)}…
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
