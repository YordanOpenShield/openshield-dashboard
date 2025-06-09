import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const res = await fetch(`${process.env.MANAGER_URL || 'http://localhost:9000'}/api/jobs/${id}`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const job = await res.json();

    if (!job) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}