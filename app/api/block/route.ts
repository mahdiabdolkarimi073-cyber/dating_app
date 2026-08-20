import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST block a user
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (userId === tokenUser.userId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: tokenUser.userId, blockedId: userId } },
      update: {},
      create: { blockerId: tokenUser.userId, blockedId: userId },
    });

    // Remove any active match between the two users
    const [u1, u2] = [tokenUser.userId, userId].sort((a, b) => a - b);
    await prisma.match.updateMany({
      where: { user1Id: u1, user2Id: u2, status: 'active' },
      data: { status: 'unmatched', unmatchedBy: tokenUser.userId, unmatchedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

// DELETE unblock a user
export async function DELETE(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0', 10);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.block.deleteMany({
      where: { blockerId: tokenUser.userId, blockedId: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unblock error:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}

// GET list of blocked users
export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: tokenUser.userId },
      include: {
        blocked: {
          select: { id: true, name: true, username: true, photos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = blocks.map((b) => {
      const photos = b.blocked.photos ? JSON.parse(b.blocked.photos) : [];
      return {
        id: b.blocked.id,
        name: b.blocked.name,
        username: b.blocked.username,
        photo: photos[0] || null,
        blockedAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ blocked: list });
  } catch (error) {
    console.error('Block list error:', error);
    return NextResponse.json({ error: 'Failed to load blocked users' }, { status: 500 });
  }
}
