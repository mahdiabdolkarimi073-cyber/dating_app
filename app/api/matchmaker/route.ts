import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findMatches, MatchmakerCriteria } from '@/lib/matchmaker';

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

    const pref = await prisma.matchmakerPreference.findUnique({
      where: { userId: tokenUser.userId },
    });

    const criteria: MatchmakerCriteria = {
      targetGender: (pref?.targetGender as MatchmakerCriteria['targetGender']) || null,
      minAge: pref?.minAge ?? 18,
      maxAge: pref?.maxAge ?? 99,
      maxDistanceKm: pref?.maxDistanceKm ?? null,
      priorityInterests: pref?.priorityInterests
        ? JSON.parse(pref.priorityInterests)
        : [],
    };

    const matches = await findMatches(tokenUser.userId, criteria);
    return NextResponse.json({ matches, criteria });
  } catch (error) {
    console.error('Matchmaker GET error:', error);
    return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { targetGender, minAge, maxAge, maxDistanceKm, priorityInterests } = body;

    const criteria: MatchmakerCriteria = {
      targetGender: targetGender || null,
      minAge: Math.max(18, Math.min(99, Number(minAge) || 18)),
      maxAge: Math.max(18, Math.min(99, Number(maxAge) || 99)),
      maxDistanceKm: maxDistanceKm == null ? null : Number(maxDistanceKm),
      priorityInterests: Array.isArray(priorityInterests)
        ? priorityInterests.slice(0, 5)
        : [],
    };

    await prisma.matchmakerPreference.upsert({
      where: { userId: tokenUser.userId },
      update: {
        targetGender: criteria.targetGender,
        minAge: criteria.minAge,
        maxAge: criteria.maxAge,
        maxDistanceKm: criteria.maxDistanceKm,
        priorityInterests: JSON.stringify(criteria.priorityInterests),
      },
      create: {
        userId: tokenUser.userId,
        targetGender: criteria.targetGender,
        minAge: criteria.minAge,
        maxAge: criteria.maxAge,
        maxDistanceKm: criteria.maxDistanceKm,
        priorityInterests: JSON.stringify(criteria.priorityInterests),
      },
    });

    const matches = await findMatches(tokenUser.userId, criteria);
    return NextResponse.json({ matches, criteria });
  } catch (error) {
    console.error('Matchmaker POST error:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}
