// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { RECENT_PLACE_STORAGE_KEY, recentPlace, type Place } from '@/lib/places';
import { useRecentPlace } from '@/lib/useRecentPlace';

const place = (title: string): Place => ({ lat: 47.3695, lng: 8.5389, display_name: title, title, subtitle: '', covered: true });

beforeEach(() => {
  recentPlace.forget();
  localStorage.clear();
});

it('follows the last place chosen', () => {
  const { result } = renderHook(() => useRecentPlace());
  expect(result.current).toBeNull();

  act(() => recentPlace.set(place('Paradeplatz 2')));
  act(() => recentPlace.set(place('Zürich HB')));
  expect(result.current?.title).toBe('Zürich HB');
  expect(JSON.parse(localStorage.getItem(RECENT_PLACE_STORAGE_KEY)!).title).toBe('Zürich HB');

  act(() => recentPlace.forget());
  expect(result.current).toBeNull();
});

it('follows a place chosen or forgotten in another tab', () => {
  const { result } = renderHook(() => useRecentPlace());

  act(() => {
    localStorage.setItem(RECENT_PLACE_STORAGE_KEY, JSON.stringify(place('Bellevue')));
    window.dispatchEvent(new StorageEvent('storage', { key: RECENT_PLACE_STORAGE_KEY }));
  });
  expect(result.current?.title).toBe('Bellevue');

  act(() => {
    localStorage.removeItem(RECENT_PLACE_STORAGE_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: RECENT_PLACE_STORAGE_KEY }));
  });
  expect(result.current).toBeNull();
});
