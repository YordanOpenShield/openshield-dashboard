import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const res = await fetch(`${process.env.MANAGER_URL || 'http://localhost:9000'}/api/agents/${id}`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agentDetails = await res.json();

    if (!agentDetails) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agentDetails);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}