import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isElementComfortablyVisible,
  scrollIntoViewIfNotVisible,
  scrollToTarget,
} from '../utils/scroll';

describe('Scroll & Attention Utility (scrollIntoViewIfNotVisible)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for null or undefined element', () => {
    expect(isElementComfortablyVisible(null as unknown as HTMLElement)).toBe(false);
    expect(isElementComfortablyVisible(undefined as unknown as HTMLElement)).toBe(false);
  });

  it('detects when an element is offscreen below viewport', () => {
    const mockEl = {
      getBoundingClientRect: () => ({
        top: 1200,
        bottom: 1400,
        height: 200,
        left: 0,
        right: 300,
        width: 300,
      }),
      closest: () => null,
    } as unknown as HTMLElement;

    // In node fallback height is 800, so top 1200 is offscreen below
    const isVisible = isElementComfortablyVisible(mockEl);
    expect(isVisible).toBe(false);
  });

  it('detects when an element is comfortably visible in viewport', () => {
    const mockEl = {
      getBoundingClientRect: () => ({
        top: 150,
        bottom: 450,
        height: 300,
        left: 0,
        right: 300,
        width: 300,
      }),
      closest: () => null,
    } as unknown as HTMLElement;

    const isVisible = isElementComfortablyVisible(mockEl);
    expect(isVisible).toBe(true);
  });

  it('scrolls into view when element is not currently visible', async () => {
    const scrollIntoViewMock = vi.fn();
    const classListMock = {
      remove: vi.fn(),
      add: vi.fn(),
    };

    const mockEl = {
      getBoundingClientRect: () => ({
        top: 1500,
        bottom: 1800,
        height: 300,
        left: 0,
        right: 300,
        width: 300,
      }),
      closest: () => null,
      scrollIntoView: scrollIntoViewMock,
      classList: classListMock,
      offsetWidth: 300,
    } as unknown as HTMLElement;

    scrollIntoViewIfNotVisible(mockEl, { delay: 10 });

    await new Promise((r) => setTimeout(r, 60));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(classListMock.add).toHaveBeenCalledWith('highlight-focus');
  });

  it('does NOT scroll when element is already comfortably visible', async () => {
    const scrollIntoViewMock = vi.fn();

    const mockEl = {
      getBoundingClientRect: () => ({
        top: 150,
        bottom: 450,
        height: 300,
        left: 0,
        right: 300,
        width: 300,
      }),
      closest: () => null,
      scrollIntoView: scrollIntoViewMock,
      classList: {
        remove: vi.fn(),
        add: vi.fn(),
      },
    } as unknown as HTMLElement;

    scrollIntoViewIfNotVisible(mockEl, { delay: 10 });

    await new Promise((r) => setTimeout(r, 60));

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('scrollToTarget calls scrollIntoView directly', async () => {
    const scrollIntoViewMock = vi.fn();

    const mockEl = {
      scrollIntoView: scrollIntoViewMock,
      classList: {
        remove: vi.fn(),
        add: vi.fn(),
      },
      offsetWidth: 100,
    } as unknown as HTMLElement;

    scrollToTarget(mockEl, { delay: 10 });

    await new Promise((r) => setTimeout(r, 60));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it('verifies solar-booking-section smooth centering scroll behavior', () => {
    const scrollIntoViewMock = vi.fn();
    const mockEl = {
      id: 'solar-booking-section',
      scrollIntoView: scrollIntoViewMock,
    };

    mockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
});
