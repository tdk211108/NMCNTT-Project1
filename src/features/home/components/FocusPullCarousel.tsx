'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Badge, vendorBadgeVariant } from '@/components/ui/Card';
import { ProductImage } from '@/components/ui/ProductImage';
import {
  prefersReducedMotionNow,
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from '@/lib/client-hooks';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ProductCard } from '@/shared/types';

export interface FocusPullCarouselProps {
  category: 'cpu' | 'gpu';
  items: ProductCard[];
  autoplayMs?: number;
  blurStrength?: number;
  loop?: boolean;
  phaseOffsetMs?: number;
  clockOriginMs?: number | null;
  onClockStart?: (originMs: number) => void;
  className?: string;
}

export function computeFocusPullStyle(distanceInCards: number, blurStrength: number) {
  const clamped = Math.min(Math.abs(distanceInCards), 1);
  return {
    scale: 1 - 0.14 * clamped,
    blur: Math.min(Math.abs(distanceInCards), 2) * blurStrength,
    opacity: 1 - 0.5 * clamped,
    saturate: 1 - 0.45 * clamped,
  };
}

export function wrapCarouselIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

/**
 * Computes the next staggered timestamp aligned to `originMs + phaseOffsetMs + k * intervalMs`
 * while guaranteeing at least `minElapsedMs + phaseOffsetMs` before the first transition so
 * GPU (+1s) always trails CPU (0s) rather than firing early at t = 1s.
 */
export function computeNextStaggeredTickMs(
  nowMs: number,
  originMs: number,
  intervalMs: number,
  phaseOffsetMs = 0,
  minElapsedMs = intervalMs,
): number {
  const period = Math.max(1, intervalMs);
  const phase = ((phaseOffsetMs % period) + period) % period;
  const earliestTick = originMs + Math.max(period, minElapsedMs) + phase;
  const anchor = Math.max(nowMs + 40, earliestTick);
  const steps = Math.ceil((anchor - originMs - phase) / period);
  return originMs + phase + steps * period;
}

export function computeLoopProgress(
  trackCenter: number,
  centers: readonly number[],
  itemCount: number,
  isLooping: boolean,
): number {
  if (centers.length < 2 || itemCount <= 1) return 0;
  if (!isLooping) {
    const span = (centers[centers.length - 1] ?? 0) - (centers[0] ?? 0);
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (trackCenter - (centers[0] ?? 0)) / span));
  }

  const stride = (centers[1] ?? 0) - (centers[0] ?? 0);
  if (stride <= 0) return 0;
  const rel = (trackCenter - (centers[0] ?? 0)) / stride;
  const cycle = ((rel % itemCount) + itemCount) % itemCount;
  if (cycle <= itemCount - 1) {
    return cycle / (itemCount - 1);
  }
  return Math.max(0, itemCount - cycle);
}

function findNearestSlideIndex(centers: readonly number[], trackCenter: number): number {
  let best = 0;
  let bestDist = Math.abs((centers[0] ?? 0) - trackCenter);
  for (let i = 1; i < centers.length; i += 1) {
    const dist = Math.abs(centers[i] - trackCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Camera-style Focus Blur Carousel inspired by 21st.dev (@kedhareswer/focus-pull-carousel):
 * centered product card stays razor-sharp while adjacent slides blur, shrink, and dim
 * continuously via scroll-snap geometry, supporting seamless 3-copy infinite looping and
 * phase-locked staggered autoplay.
 */
export function FocusPullCarousel({
  category,
  items,
  autoplayMs = 3000,
  blurStrength = 6.5,
  loop = true,
  phaseOffsetMs = 0,
  clockOriginMs,
  onClockStart,
  className = '',
}: FocusPullCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const activeRawRef = useRef(0);
  const lastInteractRef = useRef(0);
  const localOriginRef = useRef<number | null>(null);
  const scrollAnimRafRef = useRef(0);

  const dragRef = useRef<{ x: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const pendingAnnounceRef = useRef(false);

  const prefersReducedMotion = usePrefersReducedMotion();

  const isLooping = loop && items.length >= 2;
  const baseOffset = isLooping ? items.length : 0;

  const renderedSlides = useMemo(() => {
    if (!isLooping) {
      return items.map((product, logicalIndex) => ({
        product,
        logicalIndex,
        copyIndex: 1,
        rawIndex: logicalIndex,
      }));
    }
    return [0, 1, 2].flatMap((copyIndex) =>
      items.map((product, logicalIndex) => ({
        product,
        logicalIndex,
        copyIndex,
        rawIndex: copyIndex * items.length + logicalIndex,
      })),
    );
  }, [items, isLooping]);

  const safeActive = items.length > 0 ? activeIndex % items.length : 0;

  const updateFocusFrame = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    const centers = children.map((el) => el.offsetLeft + el.offsetWidth / 2);
    const cardSpan = children[0]?.offsetWidth || 1;
    const reduced = prefersReducedMotionNow();

    children.forEach((card, idx) => {
      const fx = computeFocusPullStyle((centers[idx] - trackCenter) / cardSpan, reduced ? 0 : blurStrength);
      card.style.transform = `scale(${fx.scale.toFixed(4)})`;
      card.style.filter =
        fx.blur > 0.05
          ? `blur(${fx.blur.toFixed(2)}px) saturate(${fx.saturate.toFixed(3)})`
          : 'none';
      card.style.opacity = fx.opacity.toFixed(3);
    });

    if (barRef.current) {
      const ratio = computeLoopProgress(trackCenter, centers, items.length, isLooping);
      barRef.current.style.setProperty('--fp-p', ratio.toFixed(4));
    }

    const nearestRaw = findNearestSlideIndex(centers, trackCenter);
    activeRawRef.current = nearestRaw;
    const logicalNearest = items.length > 0 ? wrapCarouselIndex(nearestRaw, items.length) : 0;
    if (logicalNearest !== activeRef.current) {
      activeRef.current = logicalNearest;
      setActiveIndex(logicalNearest);
      if (pendingAnnounceRef.current) {
        pendingAnnounceRef.current = false;
        const nextItem = items[logicalNearest];
        if (nextItem) {
          setStatusMessage(VI_MESSAGES.home.sliderSlideStatus(logicalNearest + 1, items.length, nextItem.name));
        }
      }
    }
  }, [items, blurStrength, isLooping]);

  const cancelScrollAnim = useCallback(() => {
    if (scrollAnimRafRef.current) {
      cancelAnimationFrame(scrollAnimRafRef.current);
      scrollAnimRafRef.current = 0;
    }
    if (trackRef.current) {
      delete trackRef.current.dataset.anim;
    }
  }, []);

  const recenterToHomeCopy = useCallback(
    (rawIndex: number): number => {
      const track = trackRef.current;
      const total = items.length;
      if (!track || !isLooping || total < 2) return rawIndex;
      if (rawIndex >= total && rawIndex < 2 * total) return rawIndex;

      const homeRaw = total + wrapCarouselIndex(rawIndex, total);
      const currentEl = track.children[rawIndex] as HTMLElement | undefined;
      const homeEl = track.children[homeRaw] as HTMLElement | undefined;
      if (!currentEl || !homeEl) return rawIndex;

      const deltaPx = homeEl.offsetLeft - currentEl.offsetLeft;
      if (Math.abs(deltaPx) > 0.5) {
        track.scrollLeft += deltaPx;
      }
      activeRawRef.current = homeRaw;
      return homeRaw;
    },
    [items.length, isLooping],
  );

  const scrollToSlide = useCallback(
    (rawIndex: number, smooth = true) => {
      const track = trackRef.current;
      if (!track) return;
      const slideEl = track.children[rawIndex] as HTMLElement | undefined;
      if (!slideEl) return;

      cancelScrollAnim();
      const targetLeft = Math.max(0, slideEl.offsetLeft + slideEl.offsetWidth / 2 - track.clientWidth / 2);
      const reduced = prefersReducedMotionNow();
      const startLeft = track.scrollLeft;

      if (!smooth || reduced || Math.abs(targetLeft - startLeft) < 1) {
        track.scrollLeft = targetLeft;
        recenterToHomeCopy(rawIndex);
        updateFocusFrame();
        return;
      }

      const durationMs = 420;
      const startTime = performance.now();
      track.dataset.anim = '1';

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - t) ** 3;
        track.scrollLeft = startLeft + (targetLeft - startLeft) * eased;
        updateFocusFrame();

        if (t < 1) {
          scrollAnimRafRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimRafRef.current = 0;
          track.scrollLeft = targetLeft;
          delete track.dataset.anim;
          recenterToHomeCopy(rawIndex);
          updateFocusFrame();
        }
      };

      scrollAnimRafRef.current = requestAnimationFrame(step);
    },
    [cancelScrollAnim, recenterToHomeCopy, updateFocusFrame],
  );

  const initializedSignatureRef = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (items.length === 0) {
      initializedSignatureRef.current = null;
      return;
    }
    const sig = `${items.length}:${isLooping}`;
    if (initializedSignatureRef.current === sig) return;
    initializedSignatureRef.current = sig;

    activeRawRef.current = baseOffset;
    activeRef.current = 0;
    if (isLooping) {
      scrollToSlide(baseOffset, false);
    } else {
      updateFocusFrame();
    }
  }, [items.length, isLooping, baseOffset, scrollToSlide, updateFocusFrame]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let rafId = 0;
    let fallbackTimer = 0;

    const schedule = () => {
      if (track.dataset.anim === '1') return;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = 0;
        if (!dragRef.current && track.dataset.anim !== '1' && isLooping) {
          recenterToHomeCopy(activeRawRef.current);
          updateFocusFrame();
        }
      }, 420);

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updateFocusFrame();
      });
    };

    const handleScrollEnd = () => {
      if (track.dataset.anim === '1') return;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
      if (!dragRef.current && isLooping) {
        recenterToHomeCopy(activeRawRef.current);
      }
      updateFocusFrame();
    };

    track.addEventListener('scroll', schedule, { passive: true });
    track.addEventListener('scrollend', handleScrollEnd, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    observer?.observe(track);
    updateFocusFrame();

    return () => {
      cancelScrollAnim();
      cancelAnimationFrame(rafId);
      window.clearTimeout(fallbackTimer);
      track.removeEventListener('scroll', schedule);
      track.removeEventListener('scrollend', handleScrollEnd);
      observer?.disconnect();
    };
  }, [updateFocusFrame, recenterToHomeCopy, cancelScrollAnim, isLooping]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      if (clockOriginMs == null) {
        const now = performance.now();
        localOriginRef.current = now;
        onClockStart?.(now);
      }
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && clockOriginMs == null) {
          const now = performance.now();
          if (localOriginRef.current === null) {
            localOriginRef.current = now;
          }
          onClockStart?.(now);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [items.length, clockOriginMs, onClockStart]);

  const advanceRaw = useCallback(
    (delta: number, isUserAction: boolean) => {
      if (items.length < 2) return;
      if (isUserAction) {
        lastInteractRef.current = performance.now();
        pendingAnnounceRef.current = true;
      }
      if (!isLooping) {
        scrollToSlide(wrapCarouselIndex(activeRef.current + delta, items.length));
        return;
      }

      let baseRaw = activeRawRef.current;
      if (baseRaw + delta <= 0 || baseRaw + delta >= 3 * items.length - 1) {
        baseRaw = recenterToHomeCopy(baseRaw);
        updateFocusFrame();
      }
      scrollToSlide(baseRaw + delta);
    },
    [items.length, isLooping, recenterToHomeCopy, updateFocusFrame, scrollToSlide],
  );

  const stepBy = useCallback(
    (delta: number) => {
      advanceRaw(delta, true);
    },
    [advanceRaw],
  );

  const shouldAutoplay = items.length >= 2 && autoplayMs > 0 && !prefersReducedMotion && !isUserPaused;

  useEffect(() => {
    if (!shouldAutoplay || !isInView) return undefined;

    const origin = clockOriginMs ?? localOriginRef.current ?? performance.now();
    let timerId = 0;
    let cancelled = false;

    const scheduleNext = (fromMs: number) => {
      if (cancelled) return;
      const minAnchor = Math.max(
        fromMs + 40,
        lastInteractRef.current > 0 ? lastInteractRef.current + autoplayMs : 0,
      );
      const targetMs = computeNextStaggeredTickMs(
        minAnchor - 40,
        origin,
        autoplayMs,
        phaseOffsetMs,
        autoplayMs,
      );
      const delay = Math.max(16, targetMs - performance.now());

      timerId = window.setTimeout(() => {
        if (cancelled) return;
        const firedAt = performance.now();
        if (!document.hidden && firedAt - lastInteractRef.current >= autoplayMs - 20) {
          advanceRaw(1, false);
        }
        scheduleNext(Math.max(firedAt, targetMs));
      }, delay);
    };

    scheduleNext(performance.now());
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [shouldAutoplay, isInView, autoplayMs, phaseOffsetMs, clockOriginMs, advanceRaw]);

  if (items.length === 0) {
    return null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    cancelScrollAnim();
    lastInteractRef.current = performance.now();
    if (event.pointerType !== 'mouse' || event.button !== 0 || !trackRef.current) {
      return;
    }
    dragRef.current = {
      x: event.clientX,
      scrollLeft: trackRef.current.scrollLeft,
      moved: false,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track) return;

    const deltaX = event.clientX - drag.x;
    if (!drag.moved && Math.abs(deltaX) > 4) {
      drag.moved = true;
      setIsDragging(true);
      track.setPointerCapture?.(event.pointerId);
    }
    if (drag.moved) {
      track.scrollLeft = drag.scrollLeft - deltaX;
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    lastInteractRef.current = performance.now();
    if (drag?.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      setIsDragging(false);
      scrollToSlide(activeRawRef.current);
    }
  }

  function handleCardClick(rawIndex: number) {
    return (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        return;
      }
      lastInteractRef.current = performance.now();
      // Pull off-center slides smoothly into focus before allowing detail navigation.
      if (rawIndex !== activeRawRef.current) {
        event.preventDefault();
        pendingAnnounceRef.current = true;
        scrollToSlide(rawIndex);
      }
    };
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepBy(-1);
    }
  }

  const activeItem = items[safeActive];
  const counterCurrent = String(safeActive + 1).padStart(2, '0');
  const counterTotal = String(items.length).padStart(2, '0');

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={VI_MESSAGES.home.sliderCarouselAria(category)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={
        {
          '--fp-w': 'clamp(248px, 74vw, 376px)',
        } as CSSProperties
      }
      className={`fp-root rounded-card border-2 border-border-strong bg-surface-subtle/90 py-4 sm:py-5 focus-visible:outline-2 focus-visible:outline-signal ${className}`}
    >
      <div
        ref={trackRef}
        data-drag={isDragging ? '1' : '0'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={() => {
          cancelScrollAnim();
          lastInteractRef.current = performance.now();
        }}
        className="fp-track"
      >
        {renderedSlides.map(({ product, logicalIndex, copyIndex, rawIndex }) => {
          const isPrimaryCopy = copyIndex === 1;
          const isCurrent = logicalIndex === safeActive && isPrimaryCopy;
          return (
            <div key={`${copyIndex}-${product.id}`} className="fp-card">
              <Link
                href={`/products/${product.id}`}
                data-testid={isPrimaryCopy ? TEST_IDS.home.sliderCard(category, product.id) : undefined}
                aria-hidden={!isPrimaryCopy ? true : undefined}
                tabIndex={!isPrimaryCopy ? -1 : undefined}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={
                  isPrimaryCopy
                    ? VI_MESSAGES.home.sliderSlideLabel(logicalIndex + 1, items.length, product.name)
                    : undefined
                }
                onFocus={
                  isPrimaryCopy
                    ? () => {
                        if (logicalIndex !== activeRef.current) {
                          const targetRaw = recenterToHomeCopy(activeRawRef.current);
                          if (targetRaw !== baseOffset + logicalIndex) {
                            scrollToSlide(baseOffset + logicalIndex);
                          }
                        }
                      }
                    : undefined
                }
                onClick={handleCardClick(rawIndex)}
                className={`group flex h-full w-full flex-col overflow-hidden rounded-card border-2 bg-white p-3 transition-colors focus-visible:outline-2 focus-visible:outline-signal ${
                  logicalIndex === safeActive
                    ? 'mtx-shadow border-signal'
                    : 'border-border-strong hover:border-signal/80'
                }`}
              >
                <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-control bg-white p-2 sm:h-60">
                  <ProductImage
                    src={product.imageUrl}
                    alt={isPrimaryCopy ? product.name : ''}
                    loading="eager"
                    className="h-full w-full object-contain"
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="fp-meta">
        <div key={activeItem?.id} className="fp-cap">
          <div className="flex flex-wrap items-center gap-2">
            {activeItem ? (
              <Badge variant={vendorBadgeVariant(activeItem.vendor)}>
                {activeItem.vendor.toUpperCase()}
              </Badge>
            ) : null}
            {activeItem?.aibBrand ? <Badge variant="aib">{activeItem.aibBrand}</Badge> : null}
          </div>
          <p className="mt-1 truncate font-display text-lg font-bold text-ink sm:text-xl">
            {activeItem?.name}
          </p>
          <p className="font-mono text-sm font-bold tabular-nums text-accent-ink">
            {activeItem ? formatVnd(activeItem.priceVnd) : ''}
          </p>
        </div>

        <div className="fp-count font-mono text-xs font-bold tracking-widest tabular-nums text-ink-muted">
          <span className="text-ink">{counterCurrent}</span> / {counterTotal}
        </div>

        <div className="fp-nav">
          {items.length >= 2 && !prefersReducedMotion ? (
            <button
              type="button"
              onClick={() => {
                lastInteractRef.current = performance.now();
                setIsUserPaused((prev) => !prev);
              }}
              aria-label={
                isUserPaused
                  ? VI_MESSAGES.home.sliderResumeAutoplayAria
                  : VI_MESSAGES.home.sliderPauseAutoplayAria
              }
              title={
                isUserPaused
                  ? VI_MESSAGES.home.sliderResumeAutoplayAria
                  : VI_MESSAGES.home.sliderPauseAutoplayAria
              }
              data-testid={TEST_IDS.home.sliderPlayToggle(category)}
              className="mtx-shadow-sm inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal sm:h-10 sm:w-10"
            >
              {isUserPaused ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pause className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => stepBy(-1)}
            aria-label={VI_MESSAGES.home.sliderPrevAria}
            data-testid={TEST_IDS.home.sliderPrev(category)}
            className="mtx-shadow-sm inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => stepBy(1)}
            aria-label={VI_MESSAGES.home.sliderNextAria}
            data-testid={TEST_IDS.home.sliderNext(category)}
            className="mtx-shadow-sm inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={barRef} className="fp-bar" aria-hidden="true">
        <i />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </div>
  );
}
