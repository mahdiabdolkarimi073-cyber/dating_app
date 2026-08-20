import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        birthDate: true,
        gender: true,
        bio: true,
        interests: true,
        photos: true,
        verification: true,
        isOnline: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check relationship status
    const [myLike, theirLike, myPass] = await Promise.all([
      prisma.like.findUnique({
        where: { fromId_toId: { fromId: tokenUser.userId, toId: userId } },
      }),
      prisma.like.findUnique({
        where: { fromId_toId: { fromId: userId, toId: tokenUser.userId } },
      }),
      prisma.pass.findUnique({
        where: { fromId_toId: { fromId: tokenUser.userId, toId: userId } },
      }),
    ]);

    const isMatch = !!myLike && !!theirLike;
    let matchId: number | null = null;

    if (isMatch) {
      const [user1Id, user2Id] = [tokenUser.userId, userId].sort((a, b) => a - b);
      const match = await prisma.match.findUnique({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        select: { id: true },
      });
      matchId = match?.id ?? null;
    }

    const profile = {
      ...user,
      interests: user.interests ? JSON.parse(user.interests) : [],
      photos: user.photos ? JSON.parse(user.photos) : [],
      relationship: {
        iLiked: !!myLike,
        theyLiked: !!theirLike,
        iPassed: !!myPass,
        isMatch,
        matchId,
      },
    };

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
