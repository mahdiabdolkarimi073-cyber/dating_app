import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET current privacy + discovery settings
export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: {
        showOnlineStatus: true,
        showLastSeen: true,
        showInDiscovery: true,
        onlyVerified: true,
        verification: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Privacy GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH update privacy + discovery settings
export async function PATCH(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { showOnlineStatus, showLastSeen, showInDiscovery, onlyVerified } = body;

    const data: Record<string, boolean> = {};
    if (typeof showOnlineStatus === 'boolean') data.showOnlineStatus = showOnlineStatus;
    if (typeof showLastSeen === 'boolean') data.showLastSeen = showLastSeen;
    if (typeof showInDiscovery === 'boolean') data.showInDiscovery = showInDiscovery;
    if (typeof onlyVerified === 'boolean') data.onlyVerified = onlyVerified;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Privacy PATCH error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
