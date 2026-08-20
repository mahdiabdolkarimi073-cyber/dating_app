import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST update presence (online/offline)
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { online } = body;

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        isOnline: !!online,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Presence error:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}

// GET presence for a specific user
export async function GET(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0', 10);

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnline: true, lastSeen: true, showOnlineStatus: true, showLastSeen: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      isOnline: user.showOnlineStatus ? user.isOnline : false,
      lastSeen:
        user.showLastSeen && user.lastSeen ? user.lastSeen.toISOString() : null,
      showOnlineStatus: user.showOnlineStatus,
      showLastSeen: user.showLastSeen,
    });
  } catch (error) {
    console.error('Presence GET error:', error);
    return NextResponse.json({ error: 'Failed to get presence' }, { status: 500 });
  }
}
