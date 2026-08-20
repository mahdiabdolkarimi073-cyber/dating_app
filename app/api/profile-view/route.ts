import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { viewedId } = body;
    if (!viewedId || typeof viewedId !== 'number') {
      return NextResponse.json({ error: 'Viewed ID required' }, { status: 400 });
    }

    if (viewedId === tokenUser.userId) {
      return NextResponse.json({ success: true });
    }

    // Upsert profile view (unique constraint on viewerId+viewedId)
    await prisma.profileView.upsert({
      where: { viewerId_viewedId: { viewerId: tokenUser.userId, viewedId } },
      create: { viewerId: tokenUser.userId, viewedId },
      update: { createdAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
