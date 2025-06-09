import { notFound } from "next/navigation";

interface JobPageProps {
    params: { id: string };
}

const fetchJob = async (id: string) => {
    const res = await fetch(`http://localhost:3000/api/jobs/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
};

const JobPage = async ({ params }: JobPageProps) => {
    const job = await fetchJob(params.id);

    if (!job) {
        notFound();
    }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Job {job.name}</h1>
            <p className="mb-2">
                <span className="font-semibold">Description:</span>{" "}
                <span
                    className={"px-2 py-1 rounded"}
                >
                    {job.description}
                </span>
            </p>
            <p className="mb-2">
                <span className="font-semibold">Command:</span>{" "}
                {job.command || <span className="text-gray-400 italic">N/A</span>}
            </p>
            <div>
                <a href="/jobs" className="text-blue-600 hover:underline">
                    &larr; Back to Jobs
                </a>
            </div>
        </main>
    );
};

export default JobPage;