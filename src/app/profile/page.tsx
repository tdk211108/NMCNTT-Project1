import type { Metadata } from 'next';
import { ProfileClient } from '@/features/profile/components/ProfileClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.profile.pageTitle,
  noIndex: true,
});

export default function ProfilePage() {
  return <ProfileClient />;
}
