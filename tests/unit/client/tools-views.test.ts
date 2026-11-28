import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ComboAdvisorView } from '@/features/combo/components/ComboAdvisorView';
import { CompareTableView } from '@/features/compare/components/CompareTableView';
import { PerfPerPriceView } from '@/features/perf-per-price/components/PerfPerPriceView';
import { UpgradeAdvisorView } from '@/features/upgrade/components/UpgradeAdvisorView';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  CompareResponse,
  HardwareAwardWinner,
  ProductCard as ProductCardDto,
  UpgradeGpuItem,
  UpgradeResponse,
} from '@/shared/types';

const SAMPLE_CARD: ProductCardDto = {
  id: 'cpu-amd-ryzen-7-9800x3d',
  category: 'cpu',
  name: 'AMD Ryzen 7 9800X3D',
  vendor: 'amd',
  aibBrand: null,
  isLimitedEdition: false,
  priceVnd: 13_490_000,
  imageUrl: '/icons/placeholder-product.svg',
  score: { raw: 40000, normalized: 95.2 },
  summary: [{ key: 'cores', label: 'Nhân / Luồng', value: '8 / 16' }],
};

const SECOND_CARD: ProductCardDto = {
  ...SAMPLE_CARD,
  id: 'cpu-intel-core-i9-14900k',
  name: 'Intel Core i9-14900K',
  vendor: 'intel',
  priceVnd: 14_990_000,
};

const EMPTY_PPP_SPECS = {
  socket: null, coresTotal: null, threadsTotal: null, psuPowerW: null, tdpW: null, l3CacheMb: null, boostClockGhz: null,
  seriesName: null, vramGb: null, tbpW: null, lengthMm: null, slotThickness: null,
};

function makeComboCpu(priceVnd: number) {
  return {
    id: SAMPLE_CARD.id, name: SAMPLE_CARD.name, vendor: 'amd' as const, socket: 'AM5',
    coresTotal: 8, threadsTotal: 16, psuPowerW: 162, priceVnd, imageUrl: null,
    score: { raw: 40000, normalized: 95.2 },
  };
}

function makeUpgradeActions() {
  return {
    onRetryOptions: vi.fn(), onChangeCategory: vi.fn(), onSelectCurrent: vi.fn(),
    onChangeBudgetInput: vi.fn(), onSelectBudgetPreset: vi.fn(), onClearBudget: vi.fn(),
    onToggleSameSocket: vi.fn(), onToggleVendor: vi.fn(), onChangeSort: vi.fn(),
    onSubmit: vi.fn(), onAddToCart: vi.fn(),
  };
}

function makeUpgradeState(category: 'cpu' | 'gpu', currentId: string, data: UpgradeResponse) {
  return {
    category, currentId, budgetInput: '', budgetError: null, sameSocketOnly: false,
    sameSocketAvailable: category === 'cpu',
    availableVendors: (category === 'cpu' ? ['intel', 'amd'] : ['nvidia', 'amd']) as Array<'intel' | 'amd' | 'nvidia'>,
    selectedVendors: [], sort: 'recommended' as const,
    retailCpuOptions: [], legacyCpuOptions: [], retailGpuOptions: [], legacyGpuOptions: [],
    isLoadingOptions: false, optionsErrorMessage: null, isLoadingRecommendations: false, errorMessage: null, data,
  };
}

function makeUpgradeCurrentBase(category: 'cpu' | 'gpu', id: string, source: 'store' | 'legacy', name: string) {
  return {
    id, retailProductId: source === 'store' ? (category === 'cpu' ? 'cpu-i5-12400f' : 'gpu-rtx-4060') : null,
    category, source, name, vendor: (category === 'cpu' && source === 'store' ? 'intel' : 'nvidia') as 'intel' | 'nvidia',
    socket: null, coresTotal: null, threadsTotal: null, psuPowerW: null, ramSupport: null,
    vramGb: null, tbpW: null, passmarkRaw: 17000, normalizedScore: null, hasPassmark: true,
  };
}

function renderAwardsCard(category: 'cpu' | 'gpu', totalEvaluated: number, winner: HardwareAwardWinner) {
  return renderToStaticMarkup(
    createElement(PerfPerPriceView, {
      state: {
        category, isLoading: false, errorMessage: null,
        data: { category, maxPriceVnd: null, totalEvaluated, items: [], notes: [VI_MESSAGES.tools.disclaimers.passmark], awards: [winner] },
      },
      actions: { onChangeCategory: vi.fn(), onAddToCart: vi.fn() },
    }),
  );
}

describe('Hardware tool views (Compare, Combo, PerfPerPrice, Upgrade)', () => {
  it('keeps compare top slot preview as thumbnail and enlarges criteria header image', () => {
    const compareData: CompareResponse = {
      category: 'cpu',
      products: [
        { id: SAMPLE_CARD.id, name: SAMPLE_CARD.name, priceVnd: SAMPLE_CARD.priceVnd, imageUrl: SAMPLE_CARD.imageUrl },
        { id: SECOND_CARD.id, name: SECOND_CARD.name, priceVnd: SECOND_CARD.priceVnd, imageUrl: SECOND_CARD.imageUrl },
      ],
      rows: [{ key: 'price', label: 'Giá bán', unit: 'VND', rule: 'lower', cells: [{ display: '13.490.000 đ', highlighted: true }, { display: '14.990.000 đ', highlighted: false }] }],
      notes: [],
    };
    const compareHtml = renderToStaticMarkup(
      createElement(CompareTableView, {
        state: {
          slots: [SAMPLE_CARD.id, SECOND_CARD.id, null], selectedProducts: [SAMPLE_CARD, SECOND_CARD, null],
          showThirdColumn: false, lockedCategory: 'cpu', cpus: [SAMPLE_CARD, SECOND_CARD], gpus: [],
          isLoadingCatalog: false, catalogErrorMessage: null, data: compareData, isLoadingCompare: false, compareErrorMessage: null,
        },
        actions: { onSelectSlot: vi.fn(), onClearSlot: vi.fn(), onAddColumn: vi.fn(), onClearAll: vi.fn(), onRetryCatalog: vi.fn(), onBuyNowProduct: vi.fn(), onAddToCartProduct: vi.fn() },
      }),
    );

    const previewIdx = compareHtml.indexOf('data-testid="compare-slot-preview-0"');
    const previewSnippet = compareHtml.slice(previewIdx, previewIdx + 450);
    expect(previewSnippet).toContain('h-20 w-20');
    expect(previewSnippet).not.toContain('zoom-frame-cursor');

    const headerIdx = compareHtml.indexOf('compare-table');
    const tableSnippet = compareHtml.slice(headerIdx, compareHtml.indexOf('<tbody>'));
    expect(tableSnippet).toContain('zoom-frame-cursor');
    expect(tableSnippet).toContain(`data-testid="compare-header-image-trigger-${SAMPLE_CARD.id}"`);
    expect(tableSnippet).not.toContain(`<a class="block w-full max-w-60" href="/products/${SAMPLE_CARD.id}"`);
    expect(tableSnippet).toContain(`href="/products/${SAMPLE_CARD.id}"`);
    expect(tableSnippet).toContain('aspect-square');
    expect(tableSnippet).toContain(`data-testid="compare-header-image-${SAMPLE_CARD.id}"`);
    expect(tableSnippet).toContain(`data-testid="compare-buy-now-${SAMPLE_CARD.id}"`);
    expect(tableSnippet).toContain(`data-testid="compare-add-to-cart-${SAMPLE_CARD.id}"`);
  });

  it('renders ComboAdvisorView cards, stretch badges, and PSU deep-links without <ul>/<ol>', () => {
    const comboHtml = renderToStaticMarkup(
      createElement(ComboAdvisorView, {
        state: {
          budgetInput: '20000000', budgetError: null, purpose: 'gaming_aaa', cpuVendor: null, gpuVendor: null,
          appliedBudgetVnd: 20_000_000, isLoading: false, errorMessage: null,
          data: {
            budgetVnd: 20_000_000, purpose: 'gaming_aaa', targetGpuSharePct: 65, targetCpuSharePct: 35,
            minAvailableComboPriceVnd: 11_000_000, cheapestReferenceCombo: null, notes: [VI_MESSAGES.tools.combo.budgetScopeNote],
            combos: [
              {
                rank: 1, role: 'best_overall', cpu: makeComboCpu(8_000_000),
                gpu: { id: 'gpu-1', seriesId: 'gs-rtx-5060', seriesName: 'RTX 5060', name: 'MSI RTX 5060', vendor: 'nvidia', aibBrand: 'MSI', vramGb: 8, tbpW: 145, priceVnd: 12_000_000, imageUrl: null, score: { raw: 20581, normalized: 52.7 } },
                totalPriceVnd: 20_000_000, budgetDeltaVnd: 0, isOverBudget: false, overBudgetPct: null,
                actualGpuSharePct: 60, actualCpuSharePct: 40, compositeScore: 67.5, perfPerPrice: 3.38,
                psu: { exactW: 508.75, recommendedTierW: 550, exceedsMaxTier: false, psuHref: '/tools/psu?cpu=store:cpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5060' },
              },
              {
                rank: 3, role: 'performance_stretch', cpu: makeComboCpu(8_000_000),
                gpu: { id: 'gpu-2', seriesId: 'gs-rtx-5060-ti-8gb', seriesName: 'RTX 5060 Ti', name: 'ASUS RTX 5060 Ti', vendor: 'nvidia', aibBrand: 'ASUS', vramGb: 8, tbpW: 180, priceVnd: 12_800_000, imageUrl: null, score: { raw: 21773, normalized: 55.8 } },
                totalPriceVnd: 20_800_000, budgetDeltaVnd: -800_000, isOverBudget: true, overBudgetPct: 4.0,
                actualGpuSharePct: 62, actualCpuSharePct: 38, compositeScore: 69.6, perfPerPrice: 3.35,
                psu: { exactW: 552.5, recommendedTierW: 650, exceedsMaxTier: false, psuHref: '/tools/psu?cpu=store:cpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5060-ti-8gb' },
              },
            ],
          },
        },
        actions: { onChangeBudgetInput: vi.fn(), onSelectBudgetPreset: vi.fn(), onSelectPurpose: vi.fn(), onSelectCpuVendor: vi.fn(), onSelectGpuVendor: vi.fn(), onSubmit: vi.fn(), onApplyMinBudget: vi.fn(), onAddBothToCart: vi.fn() },
      }),
    );
    expect(comboHtml).toContain('data-testid="combo-budget-input"');
    expect(comboHtml).toContain('data-testid="combo-card-1"');
    expect(comboHtml).toContain('data-testid="combo-stretch-badge-3"');
    expect(comboHtml).toContain('Lựa chọn 1: Tối ưu nhất');
    expect(comboHtml).toContain('Lựa chọn 3: Nâng tầm hiệu năng');
    expect(comboHtml).not.toContain('Nguồn khuyến nghị');
    expect(comboHtml).toContain('data-testid="combo-add-both-1"');
    expect(comboHtml).toContain('data-testid="combo-psu-link-1"');
    expect(comboHtml).toContain('bi-cpu');
    expect(comboHtml).toContain('bi-gpu-card');
    expect(comboHtml).not.toContain('<ul');
    expect(comboHtml).not.toContain('<ol');
  });

  it('renders PerfPerPriceView CPU multi-award and GPU largest_gpu award cards without tables or lists', () => {
    const pppHtml = renderAwardsCard('cpu', 35, {
      id: 'cpu-amd-ryzen-9-9950x3d', category: 'cpu', name: 'AMD Ryzen 9 9950X3D', vendor: 'amd',
      aibBrand: null, isLimitedEdition: false, priceVnd: 19_990_000, imageUrl: null,
      score: { raw: 70116, normalized: 100.0 }, perfPerPrice: 5.0, perfPerWatt: 412.4,
      specs: { ...EMPTY_PPP_SPECS, socket: 'AM5', coresTotal: 16, threadsTotal: 32, psuPowerW: 170, tdpW: 170, l3CacheMb: 128, boostClockGhz: 5.7 },
      awards: [{ key: 'strongest', metricValue: 100, metricDisplay: '100,0 điểm' }, { key: 'largest_cache', metricValue: 128, metricDisplay: '128 MB L3' }],
      awardCount: 2,
    });
    expect(pppHtml).toContain('bi-cpu');
    expect(pppHtml).toContain('bi-gpu-card');
    expect(pppHtml).toContain('role="tablist"');
    expect(pppHtml).toContain('data-testid="ppp-category-cpu"');
    expect(pppHtml).toContain('data-testid="ppp-category-gpu"');
    expect(pppHtml).toContain('lg:grid-cols-3');
    expect(pppHtml).toContain('2xl:grid-cols-4');
    expect(pppHtml).not.toContain('<aside');
    expect(pppHtml).not.toContain('ppp-vendor-');
    expect(pppHtml).not.toContain('ppp-max-price');
    expect(pppHtml).toContain('data-testid="ppp-awards-summary"');
    expect(pppHtml).toContain('data-testid="ppp-awards-grid"');
    expect(pppHtml).toContain('data-testid="ppp-award-card-cpu-amd-ryzen-9-9950x3d"');
    expect(pppHtml).toContain('data-testid="ppp-award-badge-cpu-amd-ryzen-9-9950x3d-strongest"');
    expect(pppHtml).toContain('data-testid="ppp-award-badge-cpu-amd-ryzen-9-9950x3d-largest_cache"');
    expect(pppHtml).toContain('ĐA DANH HIỆU // x2');
    expect(pppHtml).not.toContain('data-testid="ppp-table"');
    expect(pppHtml).not.toContain('<table');
    expect(pppHtml).not.toContain('<ul');
    expect(pppHtml).not.toContain('<ol');

    const pppGpuHtml = renderAwardsCard('gpu', 10, {
      id: 'gpu-asus-rtx-5080-noctua-oc-16gb', category: 'gpu', name: 'ASUS RTX 5080 Noctua OC 16GB',
      vendor: 'nvidia', aibBrand: 'ASUS', isLimitedEdition: true, priceVnd: 44_990_000, imageUrl: null,
      score: { raw: 31800, normalized: 82.0 }, perfPerPrice: 1.82, perfPerWatt: 88.3,
      specs: { ...EMPTY_PPP_SPECS, seriesName: 'NVIDIA GeForce RTX 5080', vramGb: 16, tbpW: 360, lengthMm: 385, slotThickness: 4.0 },
      awards: [{ key: 'largest_gpu', metricValue: 385, metricDisplay: '385 mm (4,0 slot)' }],
      awardCount: 1,
    });
    expect(pppGpuHtml).toContain('data-testid="ppp-award-badge-gpu-asus-rtx-5080-noctua-oc-16gb-largest_gpu"');
    expect(pppGpuHtml).toContain('GPU to nhất');
    expect(pppGpuHtml).toContain('385 mm (4,0 slot)');
    expect(pppGpuHtml).toContain('lucide-maximize-2');
  });

  it('renders UpgradeAdvisorView CPU groups, GPU AIB links, compare pairs, and missing-PassMark surface card', () => {
    const actions = makeUpgradeActions();
    const upgradeCpuHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: makeUpgradeState('cpu', 'store:cpu-i5-12400f', {
          category: 'cpu',
          current: {
            ...makeUpgradeCurrentBase('cpu', 'store:cpu-i5-12400f', 'store', 'Intel Core i5-12400F'),
            socket: 'LGA1700', coresTotal: 6, threadsTotal: 12, psuPowerW: 117, ramSupport: 'DDR5-4800 / DDR4-3200',
            passmarkRaw: 19520, normalizedScore: 27.8,
          },
          hasSameSocketInCatalog: true, isTopTier: false, minUpgradePriceVnd: 7_690_000, gpus: [],
          sameSocketCpus: [{
            id: 'cpu-i5-14600k', name: 'Intel Core i5-14600K', vendor: 'intel', priceVnd: 7_690_000, imageUrl: null,
            socket: 'LGA1700', coresTotal: 14, threadsTotal: 20, psuPowerW: 181, ramSupport: 'DDR5-5600 / DDR4-3200',
            score: { raw: 38341, normalized: 54.7 }, perfPerPrice: 7.11, upliftPct: 96, sameSocket: true,
            warnings: [{ code: 'cpu_power_increase', severity: 'medium', deltaValue: 64, fromWatt: 117, toWatt: 181 }],
            psuHref: '/tools/psu?cpu=store:cpu-i5-14600k', compareHref: '/compare?ids=cpu-i5-12400f,cpu-i5-14600k',
          }],
          platformSwapCpus: [{
            id: 'cpu-r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', vendor: 'amd', priceVnd: 14_390_000, imageUrl: null,
            socket: 'AM5', coresTotal: 8, threadsTotal: 16, psuPowerW: 162, ramSupport: 'DDR5-5600',
            score: { raw: 39911, normalized: 56.9 }, perfPerPrice: 3.95, upliftPct: 104, sameSocket: false,
            warnings: [{ code: 'socket_change', severity: 'high', fromLabel: 'LGA1700', toLabel: 'AM5' }],
            psuHref: '/tools/psu?cpu=store:cpu-r7-9800x3d', compareHref: '/compare?ids=cpu-i5-12400f,cpu-r7-9800x3d',
          }],
          notes: [VI_MESSAGES.tools.disclaimers.passmark],
        }),
        actions,
      }),
    );
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-current-summary"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-group-same-socket"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-group-platform-swap"');
    expect(upgradeCpuHtml).toContain('PATH // 01');
    expect(upgradeCpuHtml).toContain('PATH // 02');
    expect(upgradeCpuHtml).toContain('xl:grid-cols-3');
    expect(upgradeCpuHtml).toContain('bi-cpu');
    expect(upgradeCpuHtml).toContain('bi-gpu-card');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-uplift-cpu-i5-14600k"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-warning-cpu-r7-9800x3d-socket_change"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-add-cart-cpu-i5-14600k"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-psu-link-cpu-i5-14600k"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-compare-link-cpu-i5-14600k"');
    const cpuActionGridStart = upgradeCpuHtml.indexOf('<div class="grid gap-2 grid-cols-2">');
    expect(cpuActionGridStart).toBeGreaterThan(-1);
    const cpuActionGridEnd = upgradeCpuHtml.indexOf('</a></div>', cpuActionGridStart);
    expect(cpuActionGridEnd).toBeGreaterThan(cpuActionGridStart);
    const cpuActionRow = upgradeCpuHtml.slice(cpuActionGridStart, cpuActionGridEnd);
    expect(cpuActionRow).toContain('data-testid="upgrade-psu-link-cpu-i5-14600k"');
    expect(cpuActionRow).toContain('data-testid="upgrade-compare-link-cpu-i5-14600k"');
    expect(cpuActionRow).not.toContain('data-testid="upgrade-add-cart-cpu-i5-14600k"');
    expect(upgradeCpuHtml).not.toContain('<ul');
    expect(upgradeCpuHtml).not.toContain('<ol');

    const gpuItem: UpgradeGpuItem = {
      id: 'gpu-zotac-rtx-5060', seriesId: 'gs-rtx-5060', seriesName: 'NVIDIA GeForce RTX 5060',
      name: 'ZOTAC RTX 5060 Solo', aibBrand: 'ZOTAC', vendor: 'nvidia', priceVnd: 8_990_000, imageUrl: null,
      vramGb: 8, tbpW: 145, lengthMm: 165, slotThickness: 2.0, variantCount: 5,
      score: { raw: 20581, normalized: 52.7 }, perfPerPrice: 5.86, upliftPct: 21,
      warnings: [{ code: 'gpu_vram_decrease', severity: 'medium', fromVramGb: 12, toVramGb: 8 }],
      psuHref: '/tools/psu?gpu=gs-rtx-5060', compareHref: null, aibVariantsHref: '/gpu?series=gs-rtx-5060',
    };

    const upgradeGpuHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: makeUpgradeState('gpu', 'G13', {
          category: 'gpu',
          current: { ...makeUpgradeCurrentBase('gpu', 'G13', 'legacy', 'NVIDIA RTX 3060'), vramGb: 12, tbpW: 170 },
          hasSameSocketInCatalog: false, isTopTier: false, minUpgradePriceVnd: 8_990_000,
          sameSocketCpus: [], platformSwapCpus: [], gpus: [gpuItem], notes: [VI_MESSAGES.tools.disclaimers.passmark],
        }),
        actions,
      }),
    );
    expect(upgradeGpuHtml).toContain('<div class="grid gap-2 grid-cols-1">');
    expect(upgradeGpuHtml).not.toContain('<div class="grid gap-2 grid-cols-2">');
    expect(upgradeGpuHtml).toContain('data-testid="upgrade-psu-link-gpu-zotac-rtx-5060"');
    expect(upgradeGpuHtml).toContain('data-testid="upgrade-aib-variants-link-gs-rtx-5060"');
    expect(upgradeGpuHtml.indexOf('data-testid="upgrade-psu-link-gpu-zotac-rtx-5060"')).toBeLessThan(
      upgradeGpuHtml.indexOf('data-testid="upgrade-aib-variants-link-gs-rtx-5060"'),
    );
    expect(upgradeGpuHtml).not.toContain('<ul');
    expect(upgradeGpuHtml).not.toContain('<ol');

    const upgradeGpuWithCompareHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: makeUpgradeState('gpu', 'gs-rtx-4060', {
          category: 'gpu',
          current: { ...makeUpgradeCurrentBase('gpu', 'gs-rtx-4060', 'store', 'NVIDIA RTX 4060'), vramGb: 8, tbpW: 115, passmarkRaw: 19000, normalizedScore: 48.0 },
          hasSameSocketInCatalog: false, isTopTier: false, minUpgradePriceVnd: 8_990_000,
          sameSocketCpus: [], platformSwapCpus: [],
          gpus: [{ ...gpuItem, warnings: [], compareHref: '/compare?ids=gpu-rtx-4060,gpu-zotac-rtx-5060' }],
          notes: [VI_MESSAGES.tools.disclaimers.passmark],
        }),
        actions,
      }),
    );
    const gpuPairStart = upgradeGpuWithCompareHtml.indexOf('<div class="grid gap-2 grid-cols-2">');
    expect(gpuPairStart).toBeGreaterThan(-1);
    const gpuAibIdx = upgradeGpuWithCompareHtml.indexOf('data-testid="upgrade-aib-variants-link-gs-rtx-5060"');
    expect(gpuAibIdx).toBeGreaterThan(gpuPairStart);
    const gpuPairRow = upgradeGpuWithCompareHtml.slice(gpuPairStart, gpuAibIdx);
    expect(gpuPairRow).toContain('data-testid="upgrade-psu-link-gpu-zotac-rtx-5060"');
    expect(gpuPairRow).toContain('data-testid="upgrade-compare-link-gpu-zotac-rtx-5060"');
    expect(gpuPairRow).not.toContain('upgrade-aib-variants-link');

    const upgradeNoPassmarkHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: makeUpgradeState('gpu', 'legacy-gpu-test', {
          category: 'gpu',
          current: { ...makeUpgradeCurrentBase('gpu', 'legacy-gpu-test', 'legacy', 'NVIDIA GTX 750'), vramGb: 2, tbpW: 55, passmarkRaw: null, hasPassmark: false },
          hasSameSocketInCatalog: false, isTopTier: false, minUpgradePriceVnd: null,
          sameSocketCpus: [], platformSwapCpus: [], gpus: [], notes: [VI_MESSAGES.tools.disclaimers.passmark],
        }),
        actions,
      }),
    );
    expect(upgradeNoPassmarkHtml).toContain(VI_MESSAGES.tools.upgrade.missingPassmarkNote);
    expect(upgradeNoPassmarkHtml).not.toContain('border-warning/70 bg-warning/10');
    expect(upgradeNoPassmarkHtml).toContain('border-warning/70 bg-surface p-3');

    const comboFallbackHtml = renderToStaticMarkup(
      createElement(ComboAdvisorView, {
        state: {
          budgetInput: '20000000', budgetError: null, purpose: 'gaming_aaa', cpuVendor: null, gpuVendor: null,
          appliedBudgetVnd: 20_000_000, isLoading: false, errorMessage: null, data: null,
        },
        actions: { onChangeBudgetInput: vi.fn(), onSelectBudgetPreset: vi.fn(), onSelectPurpose: vi.fn(), onSelectCpuVendor: vi.fn(), onSelectGpuVendor: vi.fn(), onSubmit: vi.fn(), onApplyMinBudget: vi.fn(), onAddBothToCart: vi.fn() },
      }),
    );
    expect(comboFallbackHtml).toContain(VI_MESSAGES.tools.disclaimers.passmark);
    expect(comboFallbackHtml).toContain(VI_MESSAGES.tools.disclaimers.combo);
    expect(comboFallbackHtml).toContain(VI_MESSAGES.tools.combo.budgetScopeNote);

    const upgradeFallbackHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: {
          ...makeUpgradeState('cpu', '', {
            category: 'cpu', current: makeUpgradeCurrentBase('cpu', '', 'store', ''),
            hasSameSocketInCatalog: false, isTopTier: false, minUpgradePriceVnd: null,
            sameSocketCpus: [], platformSwapCpus: [], gpus: [], notes: [],
          }),
          data: null,
        },
        actions,
      }),
    );
    expect(upgradeFallbackHtml).toContain(VI_MESSAGES.tools.disclaimers.passmark);
    expect(upgradeFallbackHtml).toContain(VI_MESSAGES.tools.disclaimers.upgrade);
  });
});
