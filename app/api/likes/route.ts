import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get users who liked me (but I haven't liked/passed them back yet)
    const [likedMe, myLikes, myPasses] = await Promise.all([
      prisma.like.findMany({
        where: { toId: tokenUser.userId },
        select: {
          fromId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.findMany({
        where: { fromId: tokenUser.userId },
        select: { toId: true },
      }),
      prisma.pass.findMany({
        where: { fromId: tokenUser.userId },
        select: { toId: true },
      }),
    ]);

    const myLikedIds = new Set(myLikes.map((l) => l.toId));
    const myPassedIds = new Set(myPasses.map((p) => p.toId));

    // Separate into matches (mutual) and pending requests
    const matches: number[] = [];
    const pending: number[] = [];

    for (const like of likedMe) {
      if (myLikedIds.has(like.fromId)) {
        matches.push(like.fromId);
      } else if (!myPassedIds.has(like.fromId)) {
        pending.push(like.fromId);
      }
    }

    // Fetch full user data for pending likes
    const pendingUsers = await prisma.user.findMany({
      where: { id: { in: pending } },
      select: {
        id: true,
        name: true,
        username: true,
        birthDate: true,
        gender: true,
        bio: true,
        interests: true,
        photos: true,
      },
    });

    const likes = pendingUsers.map((u) => ({
      ...u,
      interests: u.interests ? JSON.parse(u.interests) : [],
      photos: u.photos ? JSON.parse(u.photos) : [],
    }));

    return NextResponse.json({ likes, matchCount: matches.length });
  } catch (error) {
    console.error('Likes error:', error);
    return NextResponse.json({ error: 'Failed to load likes' }, { status: 500 });
  }
}
