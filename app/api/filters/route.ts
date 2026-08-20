import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const filters = await prisma.savedFilter.findMany({
      where: { userId: tokenUser.userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      filters: filters.map((f) => ({ ...f, config: JSON.parse(f.config) })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { name, config } = body;
    if (!name || !config) return NextResponse.json({ error: 'Name and config required' }, { status: 400 });

    const filter = await prisma.savedFilter.create({
      data: {
        userId: tokenUser.userId,
        name,
        config: JSON.stringify(config),
      },
    });

    return NextResponse.json({ filter: { ...filter, config: JSON.parse(filter.config) } });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filterId = parseInt(searchParams.get('id') || '0', 10);
    if (!filterId) return NextResponse.json({ error: 'Filter ID required' }, { status: 400 });

    await prisma.savedFilter.delete({ where: { id: filterId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
