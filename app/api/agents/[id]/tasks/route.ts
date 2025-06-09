import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const res = await fetch(`${process.env.MANAGER_URL || 'http://localhost:9000'}/api/agents/${id}/tasks`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const tasks = await res.json();

    if (!tasks) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
    try {
        const { id } = await context.params;
        const { job_id } = await request.json();
        const body = {
            agent_id: id,
            job_id,
        };
        const res = await fetch(
            `${process.env.MANAGER_URL || 'http://localhost:9000'}/api/tasks/assign`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            return NextResponse.json({ error: error.message || 'Failed to assign task' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}