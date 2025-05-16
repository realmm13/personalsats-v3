// @ts-nocheck
import { auth } from "@/server/auth";
import { type NextRequest } from 'next/server';

export { auth };

export interface SessionUser {
  userId: string;
  encryptionPhrase: string;
}

export async function getUserFromSession(
  req: NextRequest
): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;
  // Type guard for encryptionPhrase
  function hasEncryptionPhrase(user: unknown): user is { encryptionPhrase: string } {
    return (
      typeof user === 'object' &&
      user !== null &&
      'encryptionPhrase' in user &&
      typeof (user as { encryptionPhrase?: unknown }).encryptionPhrase === 'string'
    );
  }
  if (!hasEncryptionPhrase(session.user)) {
    throw new Error('Missing encryption phrase');
  }
  const encryptionPhrase = session.user.encryptionPhrase;
  return { userId, encryptionPhrase };
} 