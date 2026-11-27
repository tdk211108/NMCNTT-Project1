'use client';

import { useProfileController } from '../useProfileController';
import { ProfileView } from './ProfileView';

export function ProfileClient() {
  const controller = useProfileController();
  return <ProfileView {...controller} />;
}
