'use client';

import {
  BookOpen,
  Calendar,
  KeyRound,
  Mail,
  Package,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge, Card, orderStatusBadgeVariant } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { formatDateTimeVi, formatDateVi, formatVnd, getProfileInitials } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { UserProfileInfo } from '@/shared/types';
import type { OrderStatusFilter, useProfileController } from '../useProfileController';
import { ChangePasswordModal } from './ChangePasswordModal';

export type ProfileViewProps = ReturnType<typeof useProfileController>;

function formatLinkedProviders(profile: UserProfileInfo): string {
  const labels: string[] = [];
  if (profile.hasPassword) {
    labels.push(VI_MESSAGES.profile.providerNames.password);
  }
  for (const provider of profile.linkedProviders) {
    labels.push(VI_MESSAGES.profile.providerNames[provider]);
  }
  if (labels.length === 0) {
    return VI_MESSAGES.profile.oauthUsernameFallback;
  }
  return labels.join(' · ');
}

const ORDER_FILTER_OPTIONS: readonly { key: OrderStatusFilter; label: string }[] = [
  { key: 'all', label: VI_MESSAGES.profile.filterAll },
  { key: 'active', label: VI_MESSAGES.profile.filterActive },
  { key: 'completed', label: VI_MESSAGES.profile.filterCompleted },
  { key: 'cancelled', label: VI_MESSAGES.profile.filterCancelled },
];

function ProfileHeadingBanner() {
  return (
    <Card className="px-4 py-3">
      <h1 className="font-display text-2xl font-bold text-ink">
        {VI_MESSAGES.profile.pageTitle}
      </h1>
    </Card>
  );
}

export function ProfileView({ state, actions }: ProfileViewProps) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  if (state.isAuthLoading) {
    return <Spinner />;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="flex flex-col gap-6">
        <ProfileHeadingBanner />
        <EmptyState
          title={VI_MESSAGES.profile.loginPrompt}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={actions.onOpenLogin}>
                {VI_MESSAGES.nav.login}
              </Button>
              <Link href="/orders/lookup">
                <Button variant="outline">{VI_MESSAGES.orders.myOrdersCodeLookupLink}</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (state.isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <ProfileHeadingBanner />
        <EmptyState
          title={VI_MESSAGES.profile.adminRedirectNote}
          action={
            <Link href="/admin">
              <Button variant="primary">{VI_MESSAGES.nav.adminMode}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (state.isLoading) {
    return <Spinner />;
  }

  if (state.errorMessage || !state.profileData) {
    return (
      <div className="flex flex-col gap-6">
        <ProfileHeadingBanner />
        <EmptyState
          title={state.errorMessage ?? VI_MESSAGES.common.unexpectedError}
          action={
            <Button variant="primary" onClick={actions.onRetry}>
              {VI_MESSAGES.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  const { profile, stats, orders } = state.profileData;
  const handleLabel = profile.username
    ? `@${profile.username}`
    : VI_MESSAGES.profile.oauthUsernameFallback;
  const readmeHandle = profile.username ?? profile.displayName;
  const showAvatarImg = Boolean(profile.avatarUrl) && !avatarLoadError;

  return (
    <div data-testid={TEST_IDS.profile.page} className="flex flex-col gap-6">
      {/* Solid Card enclosing Breadcrumb + GitHub-style horizontal profile tabs */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surface-subtle px-4 py-2.5">
          <Breadcrumb
            items={[
              { label: VI_MESSAGES.nav.home, href: '/' },
              { label: VI_MESSAGES.profile.pageTitle, href: '/profile' },
            ]}
          />
        </div>

        <div
          role="tablist"
          aria-label={VI_MESSAGES.profile.pageTitle}
          className="mtx-no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto bg-surface px-3 sm:gap-4 sm:px-4"
        >
          <button
            type="button"
            role="tab"
            aria-selected={state.activeTab === 'overview'}
            data-sfx="toggle"
            data-testid={TEST_IDS.profile.tabOverview}
            onClick={() => actions.onSelectTab('overview')}
            className={`inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition ${
              state.activeTab === 'overview'
                ? 'border-signal font-bold text-ink'
                : 'border-transparent font-semibold text-ink/85 hover:border-border-strong hover:text-ink'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.profile.tabOverview}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={state.activeTab === 'orders'}
            data-sfx="toggle"
            data-testid={TEST_IDS.profile.tabOrders}
            onClick={() => actions.onSelectTab('orders')}
            className={`inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition ${
              state.activeTab === 'orders'
                ? 'border-signal font-bold text-ink'
                : 'border-transparent font-semibold text-ink/85 hover:border-border-strong hover:text-ink'
            }`}
          >
            <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.profile.tabOrders}</span>
            <span className="rounded-full border-2 border-border-strong bg-surface-elevated px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-ink">
              {stats.totalOrders}
            </span>
          </button>
        </div>
      </Card>

      {/* GitHub-replica 2-column layout with opaque card containment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[296px_minmax(0,1fr)] lg:items-start">
        {/* Left Sidebar wrapped inside opaque Card so canvas grid lines never bleed through */}
        <aside className="lg:sticky lg:top-20">
          <Card data-testid={TEST_IDS.profile.sidebar} className="flex flex-col gap-3.5 p-3.5 sm:gap-4 sm:p-5">
            <div className="flex flex-row items-center gap-3.5 sm:gap-4 lg:flex-col lg:items-start">
              <div
                data-testid={TEST_IDS.profile.avatar}
                className="mtx-shadow-sm flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border-strong bg-surface-elevated sm:h-28 sm:w-28 lg:h-[252px] lg:w-[252px]"
              >
                {showAvatarImg && profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    onError={() => setAvatarLoadError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold tracking-wider text-ink sm:text-4xl lg:text-6xl">
                    {getProfileInitials(profile.displayName)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1
                  data-testid={TEST_IDS.profile.displayName}
                  className="font-display text-2xl leading-tight font-bold break-words text-ink"
                >
                  {profile.displayName}
                </h1>
                <p
                  data-testid={TEST_IDS.profile.username}
                  className="mt-1 font-mono text-sm font-medium break-all text-ink/80 sm:text-base"
                >
                  {handleLabel}
                </p>
              </div>
            </div>

            {profile.hasPassword ? (
              <Button
                variant="secondary"
                cyber={false}
                className="w-full"
                onClick={actions.onOpenPasswordModal}
                data-testid={TEST_IDS.profile.changePasswordOpen}
              >
                <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{VI_MESSAGES.profile.changePasswordButton}</span>
              </Button>
            ) : (
              <p
                data-testid={TEST_IDS.profile.oauthPasswordNote}
                className="rounded-control border-2 border-border-strong/80 bg-surface-elevated px-3.5 py-2.5 text-xs font-medium leading-relaxed text-ink/90"
              >
                {VI_MESSAGES.profile.oauthPasswordNote}
              </p>
            )}

            <div className="flex flex-col gap-3 rounded-control border-2 border-border bg-surface-elevated/70 p-3.5 text-sm text-ink">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p
                    data-testid={TEST_IDS.profile.email}
                    className="font-semibold break-all text-ink"
                  >
                    {profile.email ?? VI_MESSAGES.profile.emailMissingValue}
                  </p>
                  {profile.emailVerified ? (
                    <div className="mt-1.5">
                      <Badge variant="success">{VI_MESSAGES.profile.emailVerifiedBadge}</Badge>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-border pt-2.5">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink"
                  aria-hidden="true"
                />
                <p className="text-ink/85">
                  <span className="font-semibold text-ink">
                    {VI_MESSAGES.profile.providersLabel}:{' '}
                  </span>
                  <span className="font-medium text-ink">{formatLinkedProviders(profile)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 border-t border-border pt-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                <p className="text-ink/85">
                  <span>{VI_MESSAGES.profile.joinedAtLabel} </span>
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {formatDateVi(profile.createdAt)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 border-t border-border pt-2.5">
                <ShoppingBag className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                <p className="font-mono text-xs font-semibold tabular-nums text-ink/90">
                  {VI_MESSAGES.profile.orderSummaryInline(stats.totalOrders, stats.completedOrders)}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Main Column */}
        <div className="flex min-w-0 flex-col gap-6">
          {state.activeTab === 'overview' ? (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border-strong bg-surface-elevated px-4 py-3">
                <span className="font-mono text-xs font-bold text-ink">
                  {VI_MESSAGES.profile.overviewCardTitle(readmeHandle)}
                </span>
                <Link
                  href="/orders/lookup"
                  className="rounded-control border border-border-strong/70 bg-surface px-2.5 py-1 text-xs font-semibold text-accent-ink transition hover:border-signal"
                >
                  {VI_MESSAGES.orders.myOrdersCodeLookupLink}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-3.5 sm:p-4">
                <div
                  data-testid={TEST_IDS.profile.statsTotalSpent}
                  className="@container min-w-0 rounded-control border-2 border-signal bg-primary/15 p-3 sm:p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-ink">
                    {VI_MESSAGES.profile.totalSpentLabel}
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.15rem,6cqi,1.5rem)] leading-tight font-extrabold tabular-nums break-words text-ink">
                    {formatVnd(stats.totalSpentVnd)}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-ink/85">
                    {VI_MESSAGES.profile.totalSpentNote}
                  </p>
                </div>

                <div
                  data-testid={TEST_IDS.profile.statsTotalOrders}
                  className="@container min-w-0 rounded-control border-2 border-border-strong/75 bg-surface-elevated p-3 sm:p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/85">
                    {VI_MESSAGES.profile.totalOrdersLabel}
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.15rem,6cqi,1.5rem)] leading-tight font-bold tabular-nums text-ink">
                    {stats.totalOrders}
                  </p>
                  <p className="mt-1.5 text-xs font-medium break-words text-ink/85">
                    {VI_MESSAGES.profile.totalItemsNote(stats.totalItemsPurchased)}
                  </p>
                </div>

                <div
                  data-testid={TEST_IDS.profile.statsCompletedOrders}
                  className="@container min-w-0 rounded-control border-2 border-border-strong/75 bg-surface-elevated p-3 sm:p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/85">
                    {VI_MESSAGES.profile.completedOrdersLabel}
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.15rem,6cqi,1.5rem)] leading-tight font-bold tabular-nums text-ink">
                    {stats.completedOrders}
                  </p>
                  <p className="mt-1.5 font-mono text-xs font-medium tabular-nums break-words text-ink/85">
                    {VI_MESSAGES.profile.completedSpentNote(formatVnd(stats.completedSpentVnd))}
                  </p>
                </div>

                <div
                  data-testid={TEST_IDS.profile.statsActiveCancelled}
                  className="@container min-w-0 rounded-control border-2 border-border-strong/75 bg-surface-elevated p-3 sm:p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/85">
                    {VI_MESSAGES.profile.activeCancelledLabel}
                  </p>
                  <p className="mt-2 font-display text-base font-bold break-words text-ink">
                    {VI_MESSAGES.profile.activeCancelledValue(
                      stats.activeOrders,
                      stats.cancelledOrders,
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <section className="flex flex-col gap-4">
            <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <h2 className="font-display text-lg font-bold text-ink">
                {state.activeTab === 'overview'
                  ? VI_MESSAGES.profile.ordersPinnedTitle
                  : VI_MESSAGES.profile.ordersSectionTitle}
              </h2>

              <div className="mtx-no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:pb-0">
                {ORDER_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    data-sfx="toggle"
                    data-testid={TEST_IDS.profile.orderFilter(option.key)}
                    onClick={() => actions.onSelectFilter(option.key)}
                    className={`min-h-9 shrink-0 cursor-pointer rounded-control border-2 px-2.5 py-1 text-xs transition ${
                      state.statusFilter === option.key
                        ? 'border-signal bg-primary font-bold text-primary-fg'
                        : 'border-border-strong/70 bg-surface-elevated font-semibold text-ink hover:border-signal'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <Link href="/cpu" className="shrink-0">
                  <Button variant="outline" size="xs">
                    {VI_MESSAGES.profile.browseMoreCta}
                  </Button>
                </Link>
              </div>
            </Card>

            {orders.length === 0 ? (
              <EmptyState
                testId={TEST_IDS.orders.myOrdersEmpty}
                title={VI_MESSAGES.orders.myOrdersEmpty}
                action={
                  <Link href="/cpu">
                    <Button variant="primary">{VI_MESSAGES.common.backToStore}</Button>
                  </Link>
                }
              />
            ) : state.filteredOrders.length === 0 ? (
              <EmptyState title={VI_MESSAGES.profile.emptyFilteredOrders} />
            ) : state.activeTab === 'overview' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {state.filteredOrders.map((order) => (
                  <Card
                    key={order.orderId}
                    data-testid={TEST_IDS.profile.orderCard(order.orderId)}
                    className="flex min-w-0 flex-col justify-between gap-3 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`/orders/${order.orderId}`}
                        className="font-mono text-sm font-bold break-all text-accent-ink hover:underline"
                      >
                        {order.orderId}
                      </Link>
                      <Badge variant={orderStatusBadgeVariant(order)}>{order.stageLabel}</Badge>
                    </div>

                    <div className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink/85">
                      <p>
                        <span className="font-mono tabular-nums">
                          {formatDateTimeVi(order.createdAt)}
                        </span>
                        <span> · </span>
                        <span>{VI_MESSAGES.profile.orderCardItemsMeta(order.totalQuantity)}</span>
                      </p>
                      <p className="truncate">
                        {VI_MESSAGES.checkout.paymentMethods[order.paymentMethod]}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                      <span className="font-mono text-base font-bold tabular-nums break-words text-ink">
                        {formatVnd(order.totalVnd)}
                      </span>
                      <Link href={`/orders/${order.orderId}`}>
                        <Button variant="outline" size="xs">
                          {VI_MESSAGES.orders.myOrdersViewDetail}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="divide-y divide-border overflow-hidden p-0">
                {state.filteredOrders.map((order) => (
                  <div
                    key={order.orderId}
                    data-testid={TEST_IDS.profile.orderRow(order.orderId)}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/orders/${order.orderId}`}
                          className="font-mono text-sm font-bold text-accent-ink hover:underline"
                        >
                          {order.orderId}
                        </Link>
                        <Badge variant={orderStatusBadgeVariant(order)}>{order.stageLabel}</Badge>
                      </div>
                      <p className="mt-1 text-xs font-medium text-ink/85">
                        <span className="font-mono tabular-nums">
                          {formatDateTimeVi(order.createdAt)}
                        </span>
                        <span> · </span>
                        <span>{VI_MESSAGES.profile.orderCardItemsMeta(order.totalQuantity)}</span>
                        <span> · </span>
                        <span>{VI_MESSAGES.checkout.paymentMethods[order.paymentMethod]}</span>
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-bold tabular-nums break-words text-ink">
                        {formatVnd(order.totalVnd)}
                      </span>
                      <Link href={`/orders/${order.orderId}`}>
                        <Button variant="outline" size="sm">
                          {VI_MESSAGES.orders.myOrdersViewDetail}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>
      </div>

      {profile.hasPassword ? (
        <ChangePasswordModal
          open={state.passwordModalOpen}
          isSubmitting={state.isChangingPassword}
          serverError={state.changePasswordError}
          onClose={actions.onClosePasswordModal}
          onResetServerError={actions.onResetPasswordError}
          onSubmit={actions.onChangePassword}
        />
      ) : null}
    </div>
  );
}
