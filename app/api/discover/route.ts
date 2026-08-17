import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const myUser = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { id: true, termsAccepted: true },
    });

    if (!myUser || !myUser.termsAccepted) {
      return NextResponse.json({ error: 'Profile not complete' }, { status: 403 });
    }

    // Get IDs of users we already liked or passed
    const [likedTargets, passedTargets] = await Promise.all([
      prisma.like.findMany({ where: { fromId: tokenUser.userId }, select: { toId: true } }),
      prisma.pass.findMany({ where: { fromId: tokenUser.userId }, select: { toId: true } }),
    ]);

    const excludeIds = [
      tokenUser.userId,
      ...likedTargets.map((l) => l.toId),
      ...passedTargets.map((p) => p.toId),
    ];

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        termsAccepted: true,
        username: { not: null },
        photos: { not: null },
      },
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
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const users = candidates.map((u) => ({
      ...u,
      interests: u.interests ? JSON.parse(u.interests) : [],
      photos: u.photos ? JSON.parse(u.photos) : [],
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}
