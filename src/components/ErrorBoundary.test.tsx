// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
const Bomb = () => {
  if (shouldThrow) throw new Error('boom');
  return <p>正常表示</p>;
};

afterEach(() => {
  cleanup();
  shouldThrow = true;
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('子のレンダーエラーを捕捉し、領域名付きのフォールバックを表示する', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary label="日本地図">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toContain('「日本地図」の表示中にエラーが発生しました');
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('「再試行」で復帰できる', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary label="パネル">
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(screen.getByText('正常表示')).toBeTruthy();
  });

  it('resetKey が変わると自動的に復帰を試みる', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary label="パネル" resetKey="ramenCount">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).toBeTruthy();

    shouldThrow = false;
    rerender(
      <ErrorBoundary label="パネル" resetKey="onsenCount">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('正常表示')).toBeTruthy();
  });
});
