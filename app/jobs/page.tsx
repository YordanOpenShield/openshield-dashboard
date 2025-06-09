import Link from "next/link";

async function getJobs() {
  const res = await fetch('http://localhost:3000/api/jobs', { cache: 'no-store' });
  return res.json();
}

export default async function DashboardPage() {
  const jobs = await getJobs();

  return (
    <section className="max-w-3xl mx-auto mt-10 p-6 bg-gray-50 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Jobs</h2>
      <div className="overflow-x-auto rounded bg-white border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Command</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.name} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{job.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={"px-2 py-2"}
                  >
                    {job.description}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {job.command || <span className="text-gray-400 italic">N/A</span>}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}