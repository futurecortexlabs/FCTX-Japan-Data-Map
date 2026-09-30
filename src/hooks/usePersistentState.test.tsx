// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';
import { useInterval } from './useInterval';

const parseNumber = (v: unknown) => (typeof v === 'number' ? v : null);

describe('usePersistentState', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('保存値を復元し、更新を書き戻す', () => {
    localStorage.setItem('k', '5');
    const { result } = renderHook(() => usePersistentState('k', 0, parseNumber));
    expect(result.current[0]).toBe(5);

    act(() => result.current[1](7));
    expect(localStorage.getItem('k')).toBe('7');
  });

  it('壊れた JSON や検証に失敗した値はフォールバックする', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('broken', '{not json');
    localStorage.setItem('wrongType', '"text"');
    expect(renderHook(() => usePersistentState('broken', 1, parseNumber)).result.current[0]).toBe(1);
    expect(renderHook(() => usePersistentState('wrongType', 2, parseNumber)).result.current[0]).toBe(2);
  });
});

describe('useInterval', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('delay が null なら停止し、コールバックが変わってもタイマーはリセットされない', () => {
    const calls: string[] = [];
    const { rerender } = renderHook(({ label, delay }) => useInterval(() => calls.push(label), delay), {
      initialProps: { label: 'a', delay: 1000 as number | null },
    });

    vi.advanceTimersByTime(600);
    rerender({ label: 'b', delay: 1000 }); // コールバックだけ変更
    vi.advanceTimersByTime(400); // 開始から 1000ms: 最新のコールバックが呼ばれる
    expect(calls).toEqual(['b']);

    rerender({ label: 'b', delay: null });
    vi.advanceTimersByTime(5000);
    expect(calls).toEqual(['b']);
  });
});
