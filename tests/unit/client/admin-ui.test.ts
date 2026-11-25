import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Button, CyberButtonLayers, getButtonClassNames } from '@/components/ui/Button';
import { AdminDashboardView } from '@/features/admin/components/AdminDashboardView';

describe('Admin UI views and cyber danger triggers', () => {
  it('renders Admin Dashboard shortcut cards with active hover/press feedback and Cyber danger reset trigger', () => {
    const dangerButtonHtml = renderToStaticMarkup(
      createElement(Button, { variant: 'danger', cyberTag: 'RST' }, 'Reset'),
    );
    expect(dangerButtonHtml).toContain('mtx-cyber-btn');
    expect(dangerButtonHtml).toContain('mtx-cyber-danger');
    expect(dangerButtonHtml).toContain('mtx-cyber-glitch');
    expect(dangerButtonHtml).toContain('>RST<');

    const { classes: tabClasses } = getButtonClassNames({
      size: 'sm',
      variant: 'outline',
      cyber: true,
    });
    expect(tabClasses).toContain('mtx-cyber-outline');
    const layersHtml = renderToStaticMarkup(
      createElement(CyberButtonLayers, { glitchContent: 'Tab' }),
    );
    expect(layersHtml).toContain('mtx-cyber-face');
    expect(layersHtml).toContain('mtx-cyber-glitch');

    const dashboardHtml = renderToStaticMarkup(
      createElement(AdminDashboardView, {
        state: {
          confirmOpen: false,
          isResetting: false,
          lastResetResult: null,
        },
        actions: {
          onOpenConfirm: vi.fn(),
          onCloseConfirm: vi.fn(),
          onConfirmReset: vi.fn(),
        },
      }),
    );

    expect(dashboardHtml).toContain('data-testid="admin-card-products"');
    expect(dashboardHtml).toContain('data-testid="admin-card-gpu-series"');
    expect(dashboardHtml).toContain('data-testid="admin-card-legacy-cpus"');
    expect(dashboardHtml).toContain('data-testid="admin-card-orders"');
    expect(dashboardHtml).not.toContain('hover:border-border-strong');
    expect(dashboardHtml).toContain('group-hover:border-signal');
    expect(dashboardHtml).toContain('group-active:translate-x-[3px]');
    expect(dashboardHtml).toContain('mtx-cyber-danger');
    expect(dashboardHtml).toContain('data-testid="admin-reset-button"');
    expect(dashboardHtml).not.toContain('<ul');
    expect(dashboardHtml).not.toContain('<ol');
  });
});
