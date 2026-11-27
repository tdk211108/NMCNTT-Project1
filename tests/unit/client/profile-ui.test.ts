import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ChangePasswordModal } from '@/features/profile/components/ChangePasswordModal';
import { ProfileView, type ProfileViewProps } from '@/features/profile/components/ProfileView';
import { filterProfileOrders } from '@/features/profile/useProfileController';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CustomerOrderSummary, UserProfileResponse } from '@/shared/types';

const sampleOrders: CustomerOrderSummary[] = [
  {
    orderId: 'PC-AAAA111122',
    customerName: 'Nguyễn Khoa',
    totalQuantity: 1,
    totalVnd: 12_050_000,
    stage: 0,
    stageLabel: 'Đã đặt hàng',
    isCancelled: false,
    cancelledAt: null,
    paymentMethod: 'cod',
    createdAt: '2026-11-26T08:00:00.000Z',
  },
  {
    orderId: 'PC-BBBB333344',
    customerName: 'Nguyễn Khoa',
    totalQuantity: 2,
    totalVnd: 35_000_000,
    stage: 4,
    stageLabel: 'Giao hàng thành công',
    isCancelled: false,
    cancelledAt: null,
    paymentMethod: 'bank_transfer',
    createdAt: '2026-11-25T08:00:00.000Z',
  },
  {
    orderId: 'PC-CCCC555566',
    customerName: 'Nguyễn Khoa',
    totalQuantity: 1,
    totalVnd: 5_000_000,
    stage: 0,
    stageLabel: 'Đã hủy',
    isCancelled: true,
    cancelledAt: '2026-11-24T09:00:00.000Z',
    paymentMethod: 'card',
    createdAt: '2026-11-24T08:00:00.000Z',
  },
];

const passwordProfileData: UserProfileResponse = {
  profile: {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'tdk211108',
    displayName: 'Nguyễn Khoa',
    email: 'khoa@coreraster.me',
    emailVerified: true,
    avatarUrl: 'https://lh3.googleusercontent.com/avatar.png',
    hasPassword: true,
    linkedProviders: ['google'],
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  stats: {
    totalOrders: 3,
    completedOrders: 1,
    activeOrders: 1,
    cancelledOrders: 1,
    totalSpentVnd: 47_050_000,
    completedSpentVnd: 35_000_000,
    totalItemsPurchased: 3,
  },
  orders: sampleOrders,
};

function makeProps(overrides?: Partial<ProfileViewProps['state']>): ProfileViewProps {
  const baseState: ProfileViewProps['state'] = {
    isAuthLoading: false,
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
    errorMessage: null,
    profileData: passwordProfileData,
    filteredOrders: sampleOrders,
    activeTab: 'overview',
    statusFilter: 'all',
    passwordModalOpen: false,
    isChangingPassword: false,
    changePasswordError: null,
  };
  return {
    state: { ...baseState, ...overrides },
    actions: {
      onOpenLogin: vi.fn(),
      onRetry: vi.fn(),
      onSelectTab: vi.fn(),
      onSelectFilter: vi.fn(),
      onOpenPasswordModal: vi.fn(),
      onClosePasswordModal: vi.fn(),
      onResetPasswordError: vi.fn(),
      onChangePassword: vi.fn(),
    },
  };
}

describe('ProfileView GitHub-style layout & ChangePasswordModal', () => {
  it('filters orders cleanly by status', () => {
    expect(filterProfileOrders(sampleOrders, 'all')).toHaveLength(3);
    expect(filterProfileOrders(sampleOrders, 'active').map((o) => o.orderId)).toEqual([
      'PC-AAAA111122',
    ]);
    expect(filterProfileOrders(sampleOrders, 'completed').map((o) => o.orderId)).toEqual([
      'PC-BBBB333344',
    ]);
    expect(filterProfileOrders(sampleOrders, 'cancelled').map((o) => o.orderId)).toEqual([
      'PC-CCCC555566',
    ]);
  });

  it('renders guest, admin, password profile (overview & orders tabs), and OAuth-only fallback without <ul>/<ol>', () => {
    const guestHtml = renderToStaticMarkup(
      createElement(ProfileView, makeProps({ isAuthenticated: false, profileData: null })),
    );
    expect(guestHtml).toContain(VI_MESSAGES.profile.loginPrompt);

    const adminHtml = renderToStaticMarkup(
      createElement(ProfileView, makeProps({ isAdmin: true, profileData: null })),
    );
    expect(adminHtml).toContain(VI_MESSAGES.profile.adminRedirectNote);

    const overviewHtml = renderToStaticMarkup(createElement(ProfileView, makeProps()));
    expect(overviewHtml).toContain('data-testid="profile-page"');
    expect(overviewHtml).toContain('data-testid="profile-sidebar"');
    expect(overviewHtml).toContain('@tdk211108');
    expect(overviewHtml).toContain('khoa@coreraster.me');
    expect(overviewHtml).toContain(VI_MESSAGES.profile.emailVerifiedBadge);
    expect(overviewHtml).toContain('data-testid="profile-change-password-open"');
    expect(overviewHtml).toContain('data-testid="profile-stats-total-spent"');
    expect(overviewHtml).toContain('47.050.000');
    expect(overviewHtml).toContain('data-testid="profile-order-card-PC-AAAA111122"');
    expect(overviewHtml).toContain('href="/orders/PC-AAAA111122"');
    expect(overviewHtml).toContain('<img');
    expect(overviewHtml).toContain('bg-surface-elevated');
    expect(overviewHtml).toContain('bg-primary/15');
    expect(overviewHtml).toContain('@container min-w-0');
    expect(overviewHtml).not.toContain('xl:grid-cols-4');
    expect(overviewHtml).not.toContain('<ul');
    expect(overviewHtml).not.toContain('<ol');

    const ordersTabHtml = renderToStaticMarkup(
      createElement(ProfileView, makeProps({ activeTab: 'orders' })),
    );
    expect(ordersTabHtml).toContain('data-testid="profile-order-row-PC-BBBB333344"');
    expect(ordersTabHtml).not.toContain('data-testid="profile-stats-total-spent"');
    expect(ordersTabHtml).not.toContain('<ul');

    const oauthOnlyHtml = renderToStaticMarkup(
      createElement(
        ProfileView,
        makeProps({
          profileData: {
            ...passwordProfileData,
            profile: {
              ...passwordProfileData.profile,
              username: null,
              avatarUrl: null,
              hasPassword: false,
              linkedProviders: ['facebook'],
            },
          },
        }),
      ),
    );
    expect(oauthOnlyHtml).not.toContain('data-testid="profile-change-password-open"');
    expect(oauthOnlyHtml).toContain('data-testid="profile-oauth-password-note"');
    expect(oauthOnlyHtml).toContain('>NK<');
  });

  it('renders ChangePasswordModal with 3 native password inputs and monkey toggle buttons', () => {
    const html = renderToStaticMarkup(
      createElement(ChangePasswordModal, {
        open: true,
        isSubmitting: false,
        serverError: null,
        onClose: vi.fn(),
        onResetServerError: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );

    expect(html).toContain('data-testid="profile-change-password-modal"');
    expect(html).toContain('data-testid="profile-current-password"');
    expect(html).toContain('data-testid="profile-current-password-toggle"');
    expect(html).toContain('data-testid="profile-new-password"');
    expect(html).toContain('data-testid="profile-new-password-toggle"');
    expect(html).toContain('data-testid="profile-confirm-password"');
    expect(html).toContain('data-testid="profile-confirm-password-toggle"');
    expect(html).toContain('data-testid="profile-change-password-submit"');
    expect(html).not.toContain('<ul');
  });
});
