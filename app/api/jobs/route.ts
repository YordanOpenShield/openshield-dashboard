import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.MANAGER_URL || 'http://localhost:9000'}/api/jobs/list`);
    if (!res.ok) throw new Error('Failed to fetch jobs from manager API');
    const jobs = await res.json();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}