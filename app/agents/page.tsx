import Link from "next/link";

async function getAgents() {
  const res = await fetch('http://localhost:3000/api/agents', { cache: 'no-store' });
  return res.json();
}

export default async function DashboardPage() {
  const agents = await getAgents();

  return (
    <section className="max-wmx-auto mt-10 p-6 bg-gray-50 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Agents</h2>
      <div className="overflow-x-auto rounded bg-white border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">ID</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">State</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Address</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{agent.id}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.state === 'CONNECTED'
                        ? 'bg-green-100 text-green-700'
                        : agent.state === 'DISCONNECTED'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {agent.state}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {agent.address || <span className="text-gray-400 italic">N/A</span>}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/agents/${agent.id}`}
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