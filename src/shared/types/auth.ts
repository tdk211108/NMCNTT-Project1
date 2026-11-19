import type { AuthProvider, OAuthProvider, UserRole } from './common';

export interface SessionUser {
  id: string;
  role: UserRole;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  provider: AuthProvider;
}

export interface AuthSessionResponse {
  user: SessionUser | null;
  providers: Record<OAuthProvider, boolean>;
}
