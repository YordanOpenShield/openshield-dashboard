import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.MANAGER_URL || 'http://localhost:9000'}/api/agents/list`);
    if (!res.ok) throw new Error('Failed to fetch agents from manager API');
    const agents = await res.json();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}