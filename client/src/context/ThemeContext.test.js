import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getNextTheme,
} from '../utils/theme.js';

describe('Theme Management Logic', () => {
  let mockDocElement;

  beforeEach(() => {
    mockDocElement = {
      attributes: {},
      setAttribute(name, val) {
        this.attributes[name] = val;
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      getAttribute(name) {
        return this.attributes[name];
      },
    };
    globalThis.document = { documentElement: mockDocElement };
  });

  it('applies dark theme attribute to document', () => {
    applyThemeToDocument('dark');
    assert.equal(mockDocElement.getAttribute('data-theme'), 'dark');
  });

  it('removes dark theme attribute when switching to light mode', () => {
    applyThemeToDocument('dark');
    assert.equal(mockDocElement.getAttribute('data-theme'), 'dark');

    applyThemeToDocument('light');
    assert.equal(mockDocElement.getAttribute('data-theme'), undefined);
  });

  it('handles toggle state transitions correctly with getNextTheme', () => {
    assert.equal(getNextTheme('light'), 'dark');
    assert.equal(getNextTheme('dark'), 'light');
  });

  it('uses the expected storage key', () => {
    assert.equal(THEME_STORAGE_KEY, 'ikigai-theme');
  });
});
