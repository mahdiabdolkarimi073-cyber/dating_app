import { prisma } from '@/lib/prisma';

export interface MatchmakerCriteria {
  targetGender: 'male' | 'female' | 'both' | null;
  minAge: number;
  maxAge: number;
  maxDistanceKm: number | null;
  priorityInterests: string[];
}

export interface ScoredMatch {
  id: number;
  name: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  compatibilityScore: number;
  distanceKm: number | null;
  sharedInterests: string[];
  matchReasons: string[];
  isTopMatch: boolean;
}

const INTEREST_LABELS: Record<string, { label: string; emoji: string }> = {
  travel: { label: 'Travel', emoji: '✈️' },
  music: { label: 'Music', emoji: '🎵' },
  foodie: { label: 'Foodie', emoji: '🍽️' },
  fitness: { label: 'Fitness', emoji: '💪' },
  movies: { label: 'Movies', emoji: '🎬' },
  gaming: { label: 'Gaming', emoji: '🎮' },
  photography: { label: 'Photography', emoji: '📷' },
  reading: { label: 'Reading', emoji: '📚' },
  art: { label: 'Art', emoji: '🎨' },
  coffee: { label: 'Coffee', emoji: '☕' },
  hiking: { label: 'Hiking', emoji: '🥾' },
  dancing: { label: 'Dancing', emoji: '💃' },
  cooking: { label: 'Cooking', emoji: '👨‍🍳' },
  tech: { label: 'Tech', emoji: '💻' },
  fashion: { label: 'Fashion', emoji: '👗' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  pets: { label: 'Pets', emoji: '🐾' },
  nature: { label: 'Nature', emoji: '🌿' },
  sports: { label: 'Sports', emoji: '⚽' },
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  writing: { label: 'Writing', emoji: '✍️' },
  languages: { label: 'Languages', emoji: '🌍' },
  volunteering: { label: 'Volunteering', emoji: '🤝' },
  spirituality: { label: 'Spirituality', emoji: '🕊️' },
};

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function haversineKm(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interestEmoji(id: string): string {
  return INTEREST_LABELS[id]?.emoji || '⭐';
}

function interestLabel(id: string): string {
  return INTEREST_LABELS[id]?.label || id;
}

export async function findMatches(
  userId: number,
  criteria: MatchmakerCriteria
): Promise<ScoredMatch[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      birthDate: true,
      gender: true,
      interests: true,
      bio: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!me) return [];

  const myInterests: string[] = me.interests ? JSON.parse(me.interests) : [];
  const myAge = calculateAge(me.birthDate);

  const [likedTargets, passedTargets] = await Promise.all([
    prisma.like.findMany({ where: { fromId: userId }, select: { toId: true } }),
    prisma.pass.findMany({ where: { fromId: userId }, select: { toId: true } }),
  ]);

  const excludeIds = [
    userId,
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
      latitude: true,
      longitude: true,
    },
    take: 100,
  });

  const scored: ScoredMatch[] = [];

  for (const c of candidates) {
    const candidateInterests: string[] = c.interests
      ? JSON.parse(c.interests)
      : [];
    const candidatePhotos: string[] = c.photos ? JSON.parse(c.photos) : [];
    const candidateAge = calculateAge(c.birthDate);

    // --- Gender filter ---
    if (criteria.targetGender && criteria.targetGender !== 'both') {
      if (c.gender !== criteria.targetGender) continue;
    }

    // --- Age filter ---
    if (candidateAge !== null) {
      if (candidateAge < criteria.minAge || candidateAge > criteria.maxAge) continue;
    }

    // --- Distance filter ---
    let distanceKm: number | null = null;
    if (me.latitude != null && me.longitude != null && c.latitude != null && c.longitude != null) {
      distanceKm = haversineKm(me.latitude, me.longitude, c.latitude, c.longitude);
      if (criteria.maxDistanceKm != null && distanceKm > criteria.maxDistanceKm) continue;
    } else {
      if (criteria.maxDistanceKm != null) continue;
    }

    // --- Scoring ---
    const reasons: string[] = [];
    let score = 0;

    // 1. Shared interests (weight: 40)
    const shared = myInterests.filter((i) => candidateInterests.includes(i));
    const interestScore = myInterests.length > 0
      ? (shared.length / myInterests.length) * 40
      : 0;
    score += interestScore;
    if (shared.length > 0) {
      reasons.push(`✨ ${shared.length} shared interest${shared.length > 1 ? 's' : ''}`);
      // Add specific shared interests as reasons
      const topShared = shared.slice(0, 3);
      for (const interestId of topShared) {
        reasons.push(`${interestEmoji(interestId)} Both love ${interestLabel(interestId).toLowerCase()}`);
      }
    }

    // 2. Priority interests match (weight: 25)
    if (criteria.priorityInterests.length > 0) {
      const priorityMatches = criteria.priorityInterests.filter((i) =>
        candidateInterests.includes(i)
      );
      const priorityScore =
        (priorityMatches.length / criteria.priorityInterests.length) * 25;
      score += priorityScore;
      if (priorityMatches.length > 0) {
        const topPriority = priorityMatches.slice(0, 2);
        for (const interestId of topPriority) {
          reasons.push(`${interestEmoji(interestId)} Matches your priority: ${interestLabel(interestId)}`);
        }
      }
    }

    // 3. Age proximity (weight: 15)
    if (myAge != null && candidateAge != null) {
      const ageDiff = Math.abs(myAge - candidateAge);
      const ageScore = Math.max(0, 15 - ageDiff * 1.5);
      score += ageScore;
      if (ageDiff <= 2) {
        reasons.push('📅 Very close in age');
      } else if (ageDiff <= 5) {
        reasons.push('📅 Similar age range');
      }
    }

    // 4. Distance proximity (weight: 10)
    if (distanceKm != null) {
      if (criteria.maxDistanceKm != null && criteria.maxDistanceKm > 0) {
        const distanceRatio = Math.max(0, 1 - distanceKm / criteria.maxDistanceKm);
        score += distanceRatio * 10;
        if (distanceKm <= 5) {
          reasons.push('📍 Very close by');
        } else if (distanceKm <= 15) {
          reasons.push('📍 Nearby');
        }
      } else {
        score += 5;
      }
    }

    // 5. Bio completeness (weight: 5)
    if (c.bio && c.bio.trim().length > 20) {
      score += 5;
      reasons.push('✍️ Has a detailed bio');
    }

    // 6. Photo quality (weight: 5)
    if (candidatePhotos.length >= 3) {
      score += 5;
      reasons.push('📸 Multiple photos');
    } else if (candidatePhotos.length >= 1) {
      score += 2;
    }

    const compatibilityScore = Math.round(Math.min(99, Math.max(40, score)));

    scored.push({
      id: c.id,
      name: c.name,
      username: c.username,
      birthDate: c.birthDate,
      gender: c.gender,
      bio: c.bio,
      interests: candidateInterests,
      photos: candidatePhotos,
      latitude: c.latitude,
      longitude: c.longitude,
      compatibilityScore,
      distanceKm,
      sharedInterests: shared,
      matchReasons: reasons.slice(0, 6),
      isTopMatch: false,
    });
  }

  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Mark the top match
  if (scored.length > 0) {
    scored[0].isTopMatch = true;
  }

  return scored.slice(0, 20);
}
