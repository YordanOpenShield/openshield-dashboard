import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import ServicesTable from "./ServicesTable";

interface AgentPageProps {
  params: { id: string };
}

const fetchAgent = async (id: string) => {
  const res = await fetch(`http://localhost:3000/api/agents/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
};

const fetchTasks = async (id: string) => {
  const res = await fetch(`http://localhost:3000/api/agents/${id}/tasks`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
};

const fetchJobs = async () => {
  const res = await fetch("http://localhost:3000/api/jobs", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
};

const jobs = await fetchJobs();
const jobNames = await jobs.reduce((acc: Record<string, string>, job: { id: string; name: string }) => {
  acc[job.id] = job.name;
  return acc;
}, {});

// Dynamically import the client component
const TasksTable = dynamic(() => import("./TasksTable"));
const AssignTask = dynamic(() => import("./AssignTask"));

const AgentPage = async ({ params }: AgentPageProps) => {
  const { id } = await params;

  const agentDetails = await fetchAgent(id);
  const agent = agentDetails?.agent;
  const addresses = agentDetails?.addresses || [];
  const services = agentDetails?.services || [];
  const tasks = await fetchTasks(id);

  if (!agent) {
    notFound();
  }

  return (
    <main className="max-w mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-3 shadow rounded-lg min-w-0 bg-gray-50 p-6 mb-6 bg-white">
          <h1 className="text-2xl font-bold mb-4">Agent {agent.id}</h1>
          <p className="mb-2">
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${agent.state === "CONNECTED"
                ? "bg-green-100 text-green-700"
                : agent.state === "DISCONNECTED"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
                }`}
            >
              {agent.state}
            </span>
          </p>
          <p className="mb-2">
            <span className="font-semibold">Address:</span>{" "}
            {agent.address || <span className="text-gray-400 italic">N/A</span>}
          </p>
          <p className="mb-4">
            <span className="font-semibold">Last Seen:</span>{" "}
            {agent.last_seen ? new Date(agent.last_seen).toLocaleString() : <span className="text-gray-400 italic">N/A</span>}
          </p>
        </div>

        <div className="mb-6 flex-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-lg shadow p-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Assign New Task</h2>
            <p className="text-gray-500 text-sm">Select a job to assign to this agent.</p>
          </div>
          <AssignTask agentId={id} jobs={jobs} />
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-1 flex-col gap-6 w-full">
            <div className="flex-1 shadow rounded-lg min-w-0 self-stretch md:self-auto">
              <h2 className="text-xl font-semibold mt-8 mb-4 px-4">Tools</h2>
            </div>
            <div className="flex-1 shadow rounded-lg min-w-0 self-stretch md:self-auto">
              <h2 className="text-xl font-semibold mt-8 mb-4 px-4">Tasks</h2>
              <TasksTable tasks={tasks} jobNames={jobNames} />
            </div>
          </div>
          <div className="flex-1 shadow rounded-lg min-w-0 self-stretch md:self-auto">
            <h2 className="text-xl font-semibold mt-8 mb-4 px-4">Services</h2>
            <ServicesTable services={services} />
          </div>
        </div>
      </div>

      <div>
        <a href="/agents" className="text-blue-600 hover:underline">
          &larr; Back to Agents
        </a>
      </div>
    </main>
  );
};

export default AgentPage;