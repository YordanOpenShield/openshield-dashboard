"use client";

export default function ServicesTable({ services }: { services: any[] }) {

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {services.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-gray-400 italic">
                No services found for this agent.
              </td>
            </tr>
          ) : (
            services.map((service: any) => (
              <tr key={service.name} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-mono">{service.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      service.state === "RUNNING"
                        ? "bg-green-100 text-green-800"
                        : service.state === "STOPPED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {service.state}
                  </span>
                </td>
                <td className="px-4 py-2">{service.created_at ? new Date(service.created_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-2">{service.updated_at ? new Date(service.updated_at).toLocaleString() : "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}