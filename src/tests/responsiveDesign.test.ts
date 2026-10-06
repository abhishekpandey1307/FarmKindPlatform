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

  it('4. Floating desktop dock vs mobile bottom navigation are configured properly', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('.bottom-nav');
    expect(css).toMatch(/@media \(min-width:\s*1024px\)[\s\S]*?\.bottom-nav[\s\S]*?transform:\s*translateX\(-50%\)/);
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

  it('7. Mobile touch scrolling is fully unblocked on body and screen containers', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Body and html do not have overflow-x hidden or clip locking touch recognizers
    expect(css).not.toContain('body {\n  overflow-x: hidden');
    expect(css).not.toContain('html {\n  overflow-x: hidden');

    // Screen content does NOT trap mobile scroll with overscroll-behavior-y contain
    expect(css).not.toContain('overscroll-behavior-y: contain;');
  });

  it('8. Safe area padding-bottom on mobile prevents fixed BottomNav and VoiceFAB overlap', () => {
    const cssPath = path.resolve(__dirname, '../styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('safe-area-inset-bottom');
  });
});

