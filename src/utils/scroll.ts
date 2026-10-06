// =============================================================================
// FARMKIND — SCROLL & ATTENTION UTILITY
// Smoothly brings updated elements into view with visual focus pulse
// Supports checking if the live/current card is already visible before scrolling
// =============================================================================

export interface VisibilityCheckOptions {
  minVisibleRatio?: number;
  topPadding?: number;
  bottomPadding?: number;
}

export function isElementComfortablyVisible(
  el: HTMLElement,
  options: VisibilityCheckOptions = {}
): boolean {
  if (!el || typeof el.getBoundingClientRect !== 'function') return false;
  const { minVisibleRatio = 0.65, topPadding = 75, bottomPadding = 50 } = options;

  const rect = el.getBoundingClientRect();

  const windowHeight =
    typeof window !== 'undefined'
      ? window.innerHeight
      : typeof document !== 'undefined' && document.documentElement
      ? document.documentElement.clientHeight
      : 800;

  // Find scroll container (.screen-content or .screen-scroll) if present, else fallback to window viewport
  const container = typeof el.closest === 'function' ? el.closest('.screen-content') || el.closest('.screen-scroll') : null;
  let containerTop = topPadding;
  let containerBottom = windowHeight - bottomPadding;

  if (container && typeof container.getBoundingClientRect === 'function') {
    const cRect = container.getBoundingClientRect();
    containerTop = Math.max(containerTop, cRect.top + 10);
    containerBottom = Math.min(containerBottom, cRect.bottom - 10);
  }

  // If completely offscreen above or below the visible container area
  if (rect.bottom <= containerTop || rect.top >= containerBottom) {
    return false;
  }

  // Calculate visible portion of the element
  const visibleTop = Math.max(containerTop, rect.top);
  const visibleBottom = Math.min(containerBottom, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  // If card is taller than the visible viewport, consider 220px of visibility as comfortable
  const effectiveThreshold = Math.min(rect.height * minVisibleRatio, 220);
  return visibleHeight >= effectiveThreshold;
}

export interface ScrollOptions {
  block?: ScrollLogicalPosition;
  delay?: number;
  highlight?: boolean;
  minVisibleRatio?: number;
  topPadding?: number;
  bottomPadding?: number;
}

export function scrollToTarget(
  elementOrId: HTMLElement | string | null | undefined,
  options: ScrollOptions = {}
) {
  const { block = 'center', delay = 100, highlight = true } = options;

  setTimeout(() => {
    const el =
      typeof elementOrId === 'string'
        ? typeof document !== 'undefined'
          ? document.getElementById(elementOrId)
          : null
        : elementOrId;

    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block,
      });
    }

    if (highlight && !prefersReducedMotion && el.classList) {
      el.classList.remove('highlight-focus');
      // Trigger browser reflow to restart CSS animation
      void el.offsetWidth;
      el.classList.add('highlight-focus');

      setTimeout(() => {
        el.classList?.remove('highlight-focus');
      }, 2500);
    }
  }, delay);
}

/**
 * Autoscrolls only if the live/current element is NOT currently visible in the user's viewport/scroll-container.
 * If already comfortably visible, does not cause jarring jumps.
 */
export function scrollIntoViewIfNotVisible(
  elementOrId: HTMLElement | string | null | undefined,
  options: ScrollOptions = {}
) {
  const {
    block,
    delay = 100,
    highlight = true,
    minVisibleRatio = 0.65,
    topPadding = 75,
    bottomPadding = 50,
  } = options;

  setTimeout(() => {
    const el =
      typeof elementOrId === 'string'
        ? typeof document !== 'undefined'
          ? document.getElementById(elementOrId)
          : null
        : elementOrId;

    if (!el) return;

    const isVisible = isElementComfortablyVisible(el, {
      minVisibleRatio,
      topPadding,
      bottomPadding,
    });

    if (!isVisible) {
      const windowHeight =
        typeof window !== 'undefined'
          ? window.innerHeight
          : typeof document !== 'undefined' && document.documentElement
          ? document.documentElement.clientHeight
          : 800;

      const rect =
        typeof el.getBoundingClientRect === 'function'
          ? el.getBoundingClientRect()
          : { height: 200 };

      // If element is taller than 65% of viewport, align to 'start' so the header isn't cut off
      const defaultBlock: ScrollLogicalPosition =
        block || (rect.height > windowHeight * 0.65 ? 'start' : 'center');

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: defaultBlock,
        });
      }

      if (highlight && !prefersReducedMotion && el.classList) {
        el.classList.remove('highlight-focus');
        void el.offsetWidth;
        el.classList.add('highlight-focus');

        setTimeout(() => {
          el.classList?.remove('highlight-focus');
        }, 2200);
      }
    }
  }, delay);
}
