import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET notifications for the current user
export async function GET(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: tokenUser.userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: tokenUser.userId, read: false },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

// PATCH mark as read (single or all)
export async function PATCH(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { id, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: tokenUser.userId, read: false },
        data: { read: true },
      });
    } else if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: tokenUser.userId },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
