import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Universal Responsive Design Architecture', () => {
  it('1. index.html contains proper viewport meta tag with accessibility zoom support', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf8');

    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('width=device-width');
    expect(html).toContain('initial-scale=1.0');
    expect(html).not.toMatch(/maximum-scale=1\.0(?![0-9])/);
  });

  it('2. global.css defines universal responsive breakpoints (Mobile, Tablet, Desktop, Widescreen)', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('UNIVERSAL RESPONSIVE ENGINE');
    expect(css).toContain('@media (max-width: 767px)');
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('@media (min-width: 1440px)');
  });

  it('3. global.css provides complete responsive grid and column collapse rules', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('.grid { display: grid;');
    expect(css).toContain('.grid-cols-1');
    expect(css).toContain('.grid-cols-2');
    expect(css).toContain('.grid-cols-3');
    expect(css).toContain('.grid-cols-4');

    expect(css).toContain('.sm\\:grid-cols-');
    expect(css).toContain('.md\\:grid-cols-');
    expect(css).toContain('.lg\\:grid-cols-');

    expect(css).toContain('@media (max-width: 640px)');
    expect(css).toContain('@media (max-width: 480px)');
  });

  it('4. Bottom navigation is cleanly disabled to maximize usable screen space', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('.bottom-nav');
    expect(css).toContain('display: none !important;');
    expect(css).toMatch(/@media \(min-width:\s*1024px\)[\s\S]*?\.voice-fab/);
  });

  it('5. Comparison row supports vertical stacking on mobile screens (< 580px)', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(/@media \(max-width:\s*580px\)[\s\S]*?\.comparison-row[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/@media \(max-width:\s*580px\)[\s\S]*?\.comparison-divider[\s\S]*?rotate\(90deg\)/);
  });

  it('6. Section header uses fluid clamp typography for cross-screen readability', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('.section-header__title');
    expect(css).toMatch(/clamp\(/);
  });

  it('7. Mobile touch scrolling is fully enabled with momentum and visible scrollbar', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // screen-content has explicit overflow-y auto and iOS momentum scrolling
    expect(css).toContain('overflow-y: auto !important;');
    expect(css).toContain('-webkit-overflow-scrolling: touch !important;');
    expect(css).toContain('touch-action: pan-y;');

    // scrollbar styling is present for visible side scrollbar on smartphones
    expect(css).toContain('.screen-content::-webkit-scrollbar');
    expect(css).toContain('scrollbar-width: thin;');
  });

  it('8. Safe area padding-bottom on mobile prevents fixed BottomNav and VoiceFAB overlap', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('safe-area-inset-bottom');
  });

  it('9. Mobile input elements use font-size 16px to prevent unwanted iOS Safari viewport auto-zoom', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('font-size: 16px !important;');
  });

  it('10. Safe area insets dynamically protect TopNav and BottomNav on notched/island displays', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('--safe-top:');
    expect(css).toContain('--safe-bottom:');
    expect(css).toContain('env(safe-area-inset-top');
    expect(css).toContain('env(safe-area-inset-bottom');
  });

  it('11. Touch ergonomics enabled: transparent tap highlights, manipulation touch-action, and tactile active press', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('-webkit-tap-highlight-color: transparent;');
    expect(css).toContain('touch-action: manipulation;');
    expect(css).toContain('transform: scale(0.96) !important;');
  });

  it('12. Mobile modals are styled as ergonomic bottom sheets with backdrop safe margins', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('align-items: flex-end !important;');
    expect(css).toMatch(/border-radius:\s*var\(--radius-2xl\)\s*var\(--radius-2xl\)/);
  });
});

