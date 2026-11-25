import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  DemoNoticeDialogView,
  computeDemoNoticeProgress,
  computeDemoNoticeSeconds,
  markDemoNoticeSeen,
  shouldShowDemoNotice,
} from '@/features/layout/components/DemoNoticeModal';
import { DEMO_NOTICE_DURATION_MS, DEMO_NOTICE_STORAGE_KEY } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('DemoNoticeModal helpers and markup', () => {
  it('shows only on first visit when storage flag is absent', () => {
    const storage = createMemoryStorage();

    expect(shouldShowDemoNotice(storage)).toBe(true);
    markDemoNoticeSeen(storage);
    expect(storage.getItem(DEMO_NOTICE_STORAGE_KEY)).toBe('1');
    expect(shouldShowDemoNotice(storage)).toBe(false);
  });

  it('computes countdown seconds and progress percentage accurately', () => {
    expect(computeDemoNoticeSeconds(DEMO_NOTICE_DURATION_MS)).toBe(5);
    expect(computeDemoNoticeSeconds(4001)).toBe(5);
    expect(computeDemoNoticeSeconds(4000)).toBe(4);
    expect(computeDemoNoticeSeconds(1)).toBe(1);
    expect(computeDemoNoticeSeconds(0)).toBe(0);
    expect(computeDemoNoticeSeconds(-500)).toBe(0);

    expect(computeDemoNoticeProgress(DEMO_NOTICE_DURATION_MS)).toBe(100);
    expect(computeDemoNoticeProgress(2500)).toBe(50);
    expect(computeDemoNoticeProgress(0)).toBe(0);
    expect(computeDemoNoticeProgress(-100)).toBe(0);
  });

  it('locks dismissal for the first 5 seconds, then unlocks the close button', () => {
    const lockedHtml = renderToStaticMarkup(
      createElement(DemoNoticeDialogView, {
        canClose: false,
        remainingSeconds: 5,
        progressPercent: 100,
      }),
    );

    expect(lockedHtml).toContain('<dialog');
    expect(lockedHtml).toContain('closedby="none"');
    expect(lockedHtml).toContain(`data-testid="${TEST_IDS.layout.demoNoticeDialog}"`);
    expect(lockedHtml).toContain(`data-testid="${TEST_IDS.layout.demoNoticeCountdown}"`);
    expect(lockedHtml).toContain(`data-testid="${TEST_IDS.layout.demoNoticeClose}"`);
    expect(lockedHtml).toContain('disabled=""');
    expect(lockedHtml).toContain(VI_MESSAGES.demoNotice.unlockingVi(5));
    expect(lockedHtml).toContain(VI_MESSAGES.demoNotice.closeButtonLockedVi(5));
    expect(lockedHtml).toContain('<h1');
    expect(lockedHtml).toContain('lang="en"');
    expect(lockedHtml).toContain(VI_MESSAGES.demoNotice.titleVi);
    expect(lockedHtml).toContain(VI_MESSAGES.demoNotice.bodyVi);
    expect(lockedHtml).toContain(VI_MESSAGES.demoNotice.bodyEn);

    // Native top-layer modal guardrails & customer UI constraints.
    expect(lockedHtml).not.toContain('role="dialog"');
    expect(lockedHtml).not.toContain('aria-modal');
    expect(lockedHtml).not.toContain('<ul');
    expect(lockedHtml).not.toContain('<ol');
    expect(lockedHtml).not.toContain('\u2014');

    const unlockedHtml = renderToStaticMarkup(
      createElement(DemoNoticeDialogView, {
        canClose: true,
        remainingSeconds: 0,
        progressPercent: 0,
      }),
    );

    expect(unlockedHtml).toContain('closedby="closerequest"');
    expect(unlockedHtml).not.toContain('disabled=""');
    expect(unlockedHtml).toContain(VI_MESSAGES.demoNotice.unlockedVi);
    expect(unlockedHtml).toContain(VI_MESSAGES.demoNotice.closeButtonVi);
    expect(unlockedHtml).toContain(VI_MESSAGES.demoNotice.closeButtonEn);
  });
});
