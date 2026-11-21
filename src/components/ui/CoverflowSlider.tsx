'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide, useSwiper, useSwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ProductCard } from '@/shared/types';

export interface CoverflowSliderProps {
  category: 'cpu' | 'gpu';
  items: ProductCard[];
  autoplayDelayMs?: number;
}

const COVERFLOW_EFFECT_CONFIG = {
  rotate: 50,
  stretch: 0,
  depth: 100,
  modifier: 1,
  slideShadows: true,
} as const;

interface RenderedSlide {
  key: string;
  product: ProductCard;
  productIndex: number;
  slideIndex: number;
  isPrimaryCopy: boolean;
}

/**
 * Finds the looped slide index representing `targetProductIndex` nearest to
 * `currentRealIndex` around the circular ring so dot clicks rotate the shortest path.
 */
export function findShortestLoopTarget(
  currentRealIndex: number,
  targetProductIndex: number,
  uniqueCount: number,
  totalSlides: number,
): number {
  if (uniqueCount <= 0 || totalSlides <= 0) {
    return 0;
  }

  let bestCandidate = targetProductIndex;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let candidate = targetProductIndex; candidate < totalSlides; candidate += uniqueCount) {
    const forward = (((candidate - currentRealIndex) % totalSlides) + totalSlides) % totalSlides;
    const signed = forward > totalSlides / 2 ? forward - totalSlides : forward;
    const distance = Math.abs(signed);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChangeHandler);
  return () => mq.removeEventListener('change', onChangeHandler);
  function onChangeHandler() {
    onStoreChange();
  }
}

interface CoverflowSlideCardProps {
  category: 'cpu' | 'gpu';
  slide: RenderedSlide;
  onSlideFocused: (slideIndex: number) => void;
}

function CoverflowSlideCard({ category, slide, onSlideFocused }: CoverflowSlideCardProps) {
  const swiper = useSwiper();
  const { isActive } = useSwiperSlide();
  const { product, isPrimaryCopy, slideIndex } = slide;

  return (
    <article
      className={`group relative flex h-full flex-col justify-between gap-3 rounded-card border-2 bg-surface p-3.5 transition-colors select-none ${
        isActive
          ? 'mtx-shadow border-signal'
          : 'border-border-strong/80 hover:border-signal/80'
      }`}
    >
      <Link
        href={`/products/${product.id}`}
        tabIndex={isPrimaryCopy ? undefined : -1}
        data-testid={isPrimaryCopy ? TEST_IDS.home.sliderCard(category, product.id) : undefined}
        onFocus={() => {
          if (isPrimaryCopy) {
            onSlideFocused(slideIndex);
          }
        }}
        onClick={(event) => {
          // Non-active side cards rotate to the center before opening product details.
          if ((swiper && !swiper.allowClick) || !isActive) {
            event.preventDefault();
          }
        }}
        className="flex h-full flex-col justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
      >
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-control border-2 border-border-strong bg-white p-3">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            loading="eager"
            className="h-full max-h-56 w-full object-contain motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-2.5">
          <h3 className="line-clamp-2 min-h-[2.6rem] font-display text-sm font-bold leading-snug text-ink transition-colors group-hover:text-accent-ink">
            {product.name}
          </h3>
          <p className="font-mono text-base font-bold tabular-nums text-accent-ink">
            {formatVnd(product.priceVnd)}
          </p>
        </div>
      </Link>
    </article>
  );
}

/**
 * Swiper Effect Coverflow carousel scoped to the landing page CPU and GPU showcases.
 * Mirrors https://swiperjs.com/demos#effect-coverflow with centered click-to-focus cards,
 * slow hover-pausable autoplay, pagination dots, and accessible Prev/Next controls.
 */
export function CoverflowSlider({
  category,
  items,
  autoplayDelayMs = 4500,
}: CoverflowSliderProps) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const pendingAnnouncementRef = useRef(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );

  const enableLoop = items.length >= 3;
  const shouldAutoplay = enableLoop && !prefersReducedMotion && !isUserPaused;

  useEffect(() => {
    if (!swiper || swiper.destroyed || !swiper.autoplay) {
      return;
    }
    if (shouldAutoplay) {
      swiper.autoplay.start();
    } else {
      swiper.autoplay.stop();
    }
  }, [swiper, shouldAutoplay]);

  if (items.length === 0) {
    return null;
  }

  // Duplicate items once when looping so Swiper 14 has >= slidesPerView + loopedSlides
  // and keeps both left and right coverflow wings balanced at 1440px.
  const copyCount = enableLoop ? 2 : 1;
  const renderedSlides: RenderedSlide[] = [];
  for (let copyIdx = 0; copyIdx < copyCount; copyIdx += 1) {
    for (let productIndex = 0; productIndex < items.length; productIndex += 1) {
      const product = items[productIndex];
      const slideIndex = copyIdx * items.length + productIndex;
      renderedSlides.push({
        key: `${copyIdx}-${product.id}`,
        product,
        productIndex,
        slideIndex,
        isPrimaryCopy: copyIdx === 0,
      });
    }
  }

  const swiperKey = `${category}-${items.map((item) => item.id).join('|')}`;
  const clampedActive = activeProductIndex % items.length;

  function syncActiveSlide(instance: SwiperInstance) {
    const nextProductIndex = instance.realIndex % items.length;
    setActiveProductIndex(nextProductIndex);
    if (pendingAnnouncementRef.current) {
      pendingAnnouncementRef.current = false;
      const activeProduct = items[nextProductIndex];
      if (activeProduct) {
        setStatusMessage(
          VI_MESSAGES.home.sliderSlideStatus(nextProductIndex + 1, items.length, activeProduct.name),
        );
      }
    }
  }

  function handlePrev() {
    if (!swiper || swiper.destroyed) return;
    pendingAnnouncementRef.current = true;
    swiper.slidePrev();
  }

  function handleNext() {
    if (!swiper || swiper.destroyed) return;
    pendingAnnouncementRef.current = true;
    swiper.slideNext();
  }

  function handleDotClick(targetProductIndex: number) {
    if (!swiper || swiper.destroyed) return;
    pendingAnnouncementRef.current = true;
    if (enableLoop) {
      const targetSlideIndex = findShortestLoopTarget(
        swiper.realIndex,
        targetProductIndex,
        items.length,
        renderedSlides.length,
      );
      swiper.slideToLoop(targetSlideIndex);
    } else {
      swiper.slideTo(targetProductIndex);
    }
  }

  function handleSlideFocused(slideIndex: number) {
    if (!swiper || swiper.destroyed || prefersReducedMotion) return;
    if (swiper.realIndex % items.length !== slideIndex % items.length) {
      if (enableLoop) {
        swiper.slideToLoop(slideIndex);
      } else {
        swiper.slideTo(slideIndex);
      }
    }
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={VI_MESSAGES.home.sliderCarouselAria(category)}
      onFocus={() => {
        if (swiper && !swiper.destroyed && swiper.autoplay && shouldAutoplay) {
          swiper.autoplay.pause();
        }
      }}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null) &&
          swiper &&
          !swiper.destroyed &&
          swiper.autoplay &&
          shouldAutoplay
        ) {
          swiper.autoplay.resume();
        }
      }}
      className="relative w-full overflow-hidden rounded-card border-2 border-border-strong bg-surface-subtle/85 pt-4 pb-5"
    >
      <div className="flex items-center justify-between gap-2 px-4">
        <span className="font-mono text-xs font-bold tabular-nums text-ink-muted">
          {String(clampedActive + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>

        <div className="flex items-center gap-2">
          {enableLoop && !prefersReducedMotion ? (
            <button
              type="button"
              onClick={() => setIsUserPaused((prev) => !prev)}
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
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
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
            onClick={handlePrev}
            aria-label={VI_MESSAGES.home.sliderPrevAria}
            data-testid={TEST_IDS.home.sliderPrev(category)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label={VI_MESSAGES.home.sliderNextAria}
            data-testid={TEST_IDS.home.sliderNext(category)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Swiper
        key={swiperKey}
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        slideToClickedSlide
        loop={enableLoop}
        speed={prefersReducedMotion ? 0 : 850}
        coverflowEffect={COVERFLOW_EFFECT_CONFIG}
        autoplay={
          shouldAutoplay
            ? {
                delay: autoplayDelayMs,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        pagination={false}
        navigation={false}
        onSwiper={(instance) => {
          setSwiper(instance);
          setActiveProductIndex(instance.realIndex % items.length);
        }}
        onSlideChange={syncActiveSlide}
        onTouchEnd={() => {
          pendingAnnouncementRef.current = true;
        }}
        onTransitionEnd={syncActiveSlide}
        className="coreraster-coverflow w-full"
      >
        {renderedSlides.map((slide) => (
          <SwiperSlide
            key={slide.key}
            role={slide.isPrimaryCopy ? 'group' : undefined}
            aria-roledescription={slide.isPrimaryCopy ? 'slide' : undefined}
            aria-label={
              slide.isPrimaryCopy
                ? VI_MESSAGES.home.sliderSlideLabel(
                    slide.productIndex + 1,
                    items.length,
                    slide.product.name,
                  )
                : undefined
            }
            aria-hidden={slide.isPrimaryCopy ? undefined : true}
          >
            <CoverflowSlideCard
              category={category}
              slide={slide}
              onSlideFocused={handleSlideFocused}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {items.length > 1 ? (
        <div
          role="group"
          aria-label={VI_MESSAGES.common.paginationAria}
          className="flex flex-wrap items-center justify-center gap-1 px-4"
        >
          {items.map((product, index) => {
            const isCurrent = index === clampedActive;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleDotClick(index)}
                aria-label={VI_MESSAGES.home.sliderDotAria(index + 1, items.length, product.name)}
                aria-current={isCurrent ? 'true' : undefined}
                data-testid={TEST_IDS.home.sliderDot(category, index)}
                className="inline-flex h-7 min-w-7 cursor-pointer items-center justify-center p-1.5 focus-visible:outline-2 focus-visible:outline-signal"
              >
                <span
                  aria-hidden="true"
                  className={`block h-2 transition-all duration-300 ${
                    isCurrent
                      ? 'w-7 border border-ink bg-primary'
                      : 'w-2.5 border border-border-strong bg-surface hover:border-signal'
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  );
}
