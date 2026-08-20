import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBlockedUserIds } from '@/lib/moderation';

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const myUser = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { id: true, interests: true, gender: true, termsAccepted: true },
    });
    if (!myUser || !myUser.termsAccepted) {
      return NextResponse.json({ error: 'Profile not complete' }, { status: 403 });
    }

    const today = todayStr();

    // Check existing picks for today
    const existingPicks = await prisma.dailyPick.findMany({
      where: { userId: tokenUser.userId, pickDate: today },
    });

    if (existingPicks.length > 0) {
      const visibleIds = existingPicks.filter((p) => !p.passed && !p.liked).map((p) => p.pickedUserId);
      const visibleUsers = await prisma.user.findMany({
        where: { id: { in: visibleIds } },
        select: {
          id: true, name: true, username: true, birthDate: true, gender: true,
          bio: true, interests: true, photos: true, isOnline: true, verification: true,
        },
      });
      const picks = visibleUsers.map((user) => ({
        ...user,
        age: user.birthDate ? calculateAge(user.birthDate) : null,
        interests: user.interests ? JSON.parse(user.interests) : [],
        photos: user.photos ? JSON.parse(user.photos) : [],
      }));
      return NextResponse.json({ picks, refreshed: false });
    }

    // Generate new picks
    const [likedTargets, passedTargets, blockedIds] = await Promise.all([
      prisma.like.findMany({ where: { fromId: tokenUser.userId }, select: { toId: true } }),
      prisma.pass.findMany({ where: { fromId: tokenUser.userId }, select: { toId: true } }),
      getBlockedUserIds(tokenUser.userId),
    ]);

    const excludeIds = [
      tokenUser.userId,
      ...likedTargets.map((l) => l.toId),
      ...passedTargets.map((p) => p.toId),
      ...blockedIds,
    ];

    const myInterests = myUser.interests ? JSON.parse(myUser.interests) : [];

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        termsAccepted: true,
        username: { not: null },
        photos: { not: null },
        status: 'active',
        showInDiscovery: true,
      },
      select: {
        id: true, name: true, username: true, birthDate: true, gender: true,
        bio: true, interests: true, photos: true, isOnline: true, verification: true,
      },
      take: 50,
    });

    // Score by compatibility
    const scored = candidates.map((u) => {
      const interests = u.interests ? JSON.parse(u.interests) : [];
      const score = interests.filter((i: string) => myInterests.includes(i)).length;
      return { user: u, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const topPicks = scored.slice(0, 10);

    // Save picks
    await prisma.dailyPick.createMany({
      data: topPicks.map((s) => ({
        userId: tokenUser.userId,
        pickedUserId: s.user.id,
        pickDate: today,
      })),
    });

    const picks = topPicks.map((s) => ({
      ...s.user,
      age: s.user.birthDate ? calculateAge(s.user.birthDate) : null,
      interests: s.user.interests ? JSON.parse(s.user.interests) : [],
      photos: s.user.photos ? JSON.parse(s.user.photos) : [],
    }));

    return NextResponse.json({ picks, refreshed: true });
  } catch (error) {
    console.error('Daily picks error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
