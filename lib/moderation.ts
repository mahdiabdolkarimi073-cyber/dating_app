import { prisma } from './prisma';

// Simple spam/keyword lists for moderation
const SPAM_KEYWORDS = [
  'http://', 'https://', 'www.', '.com', '.net', '.org',
  'click here', 'free money', 'earn money', 'work from home',
  'crypto', 'bitcoin', 'investment opportunity', 'double your',
  'whatsapp', 'telegram me', 'dm me', 'add me',
];

const FAKE_INDICATORS = [
  'admin', 'support', 'official', 'verified', 'staff',
];

const INAPPROPRIATE_KEYWORDS = [
  'sex', 'nude', 'naked', 'horny', 'fuck', 'porn',
];

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  field: string;
}

export function moderateText(text: string, field: string): ModerationResult {
  const lower = text.toLowerCase();

  for (const kw of INAPPROPRIATE_KEYWORDS) {
    if (lower.includes(kw)) {
      return { flagged: true, reason: 'inappropriate', field };
    }
  }

  for (const kw of SPAM_KEYWORDS) {
    if (lower.includes(kw)) {
      return { flagged: true, reason: 'spam', field };
    }
  }

  for (const kw of FAKE_INDICATORS) {
    if (lower.includes(kw)) {
      return { flagged: true, reason: 'fake', field };
    }
  }

  return { flagged: false, field };
}

export function moderateUsername(username: string): ModerationResult {
  if (username.length < 3) {
    return { flagged: true, reason: 'suspicious', field: 'username' };
  }
  const lower = username.toLowerCase();
  for (const kw of FAKE_INDICATORS) {
    if (lower.includes(kw)) {
      return { flagged: true, reason: 'fake', field: 'username' };
    }
  }
  return { flagged: false, field: 'username' };
}

// Detect abnormal behavior: too many likes in a short window
export async function checkLikeSpam(userId: number): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLikes = await prisma.like.count({
    where: {
      fromId: userId,
      createdAt: { gte: oneHourAgo },
    },
  });
  return recentLikes > 100;
}

// Detect message spam: too many messages in a short window
export async function checkMessageSpam(userId: number): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentMessages = await prisma.message.count({
    where: {
      senderId: userId,
      createdAt: { gte: oneHourAgo },
    },
  });
  return recentMessages > 200;
}

// Detect multiple accounts from same email pattern (simplified)
export async function checkMultipleAccounts(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  const count = await prisma.user.count({
    where: { email: { endsWith: `@${domain}` } },
  });
  return count > 5;
}

export async function flagUserIfNeeded(userId: number, reason: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      moderationFlag: reason,
      flaggedAt: new Date(),
    },
  });
  await prisma.moderationLog.create({
    data: {
      userId,
      field: 'behavior',
      reason,
      details: `Auto-flagged: ${reason}`,
    },
  });
}

export async function logModeration(
  userId: number,
  field: string,
  reason: string,
  details?: string
) {
  await prisma.moderationLog.create({
    data: { userId, field, reason, details },
  });
}

// Get IDs of users blocked by or blocking the given user (both directions)
export async function getBlockedUserIds(userId: number): Promise<number[]> {
  const [given, received] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);
  return [
    ...given.map((b) => b.blockedId),
    ...received.map((b) => b.blockerId),
  ];
}
