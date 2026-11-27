import type { CustomerOrderSummary } from './cart-order';
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

export type OtpPurpose = 'register' | 'facebook_verify' | 'password_reset';

export interface OtpRequestResponse {
  email: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
}

export interface FacebookPendingProfile {
  displayName: string;
  avatarUrl: string | null;
}

export interface ProfileOrderStats {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalSpentVnd: number;
  completedSpentVnd: number;
  totalItemsPurchased: number;
}

export interface UserProfileInfo {
  id: string;
  username: string | null;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
  hasPassword: boolean;
  linkedProviders: OAuthProvider[];
  createdAt: string;
}

export interface UserProfileResponse {
  profile: UserProfileInfo;
  stats: ProfileOrderStats;
  orders: CustomerOrderSummary[];
}
