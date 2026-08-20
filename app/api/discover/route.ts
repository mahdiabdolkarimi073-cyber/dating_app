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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const myUser = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: {
        id: true,
        termsAccepted: true,
        latitude: true,
        longitude: true,
        interests: true,
        onlyVerified: true,
      },
    });

    if (!myUser || !myUser.termsAccepted) {
      return NextResponse.json({ error: 'Profile not complete' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minAge = searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!) : null;
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!) : null;
    const gender = searchParams.get('gender') || null;
    const maxDistance = searchParams.get('maxDistance') ? parseInt(searchParams.get('maxDistance')!) : null;
    const onlineOnly = searchParams.get('onlineOnly') === 'true';
    const hasPhotos = searchParams.get('hasPhotos') === 'true';
    const newOnly = searchParams.get('newOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'recent';
    const interestsFilter = searchParams.get('interests') ? searchParams.get('interests')!.split(',') : null;

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
        ...(myUser.onlyVerified ? { verification: 'verified' } : {}),
        ...(gender ? { gender } : {}),
        ...(onlineOnly ? { isOnline: true } : {}),
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
        latitude: true,
        longitude: true,
        isOnline: true,
        verification: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    let users = candidates.map((u) => {
      const age = u.birthDate ? calculateAge(u.birthDate) : null;
      const distance =
        myUser.latitude && myUser.longitude && u.latitude && u.longitude
          ? haversineKm(myUser.latitude, myUser.longitude, u.latitude, u.longitude)
          : null;
      return {
        ...u,
        age,
        distance: distance !== null ? Math.round(distance) : null,
        interests: u.interests ? JSON.parse(u.interests) : [],
        photos: u.photos ? JSON.parse(u.photos) : [],
      };
    });

    // Apply filters
    if (minAge !== null) users = users.filter((u) => u.age !== null && u.age >= minAge);
    if (maxAge !== null) users = users.filter((u) => u.age !== null && u.age <= maxAge);
    if (maxDistance !== null) users = users.filter((u) => u.distance !== null && u.distance <= maxDistance);
    if (hasPhotos) users = users.filter((u) => u.photos.length > 0);
    if (newOnly) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      users = users.filter((u) => new Date(u.createdAt) > weekAgo);
    }
    if (interestsFilter && interestsFilter.length > 0) {
      users = users.filter((u) => interestsFilter.some((i) => u.interests.includes(i)));
    }

    // Sort
    if (sortBy === 'compatibility' && myInterests.length > 0) {
      users.sort((a, b) => {
        const scoreA = a.interests.filter((i: string) => myInterests.includes(i)).length;
        const scoreB = b.interests.filter((i: string) => myInterests.includes(i)).length;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'distance') {
      users.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    } else if (sortBy === 'online') {
      users.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    }

    return NextResponse.json({ users: users.slice(0, 20) });
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}
