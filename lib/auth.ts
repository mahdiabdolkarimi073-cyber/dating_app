import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dating-app-secret-key-change-in-production';
const TOKEN_COOKIE = 'dating_token';

export interface TokenPayload {
  userId: number;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  cookies().set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearAuthCookie() {
  cookies().delete(TOKEN_COOKIE);
}

export async function getAuthUser(): Promise<TokenPayload | null> {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
