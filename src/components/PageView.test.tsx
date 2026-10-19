// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@/lib/analytics';
import PageView from './PageView';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

const page = { path: '/guides/e-scooters-bristol', title: 'E-scooter hire in Bristol — ScootRadar' };
// jsdom can't follow a link: each click stops at the window, after the page has seen it.
const stay = (event: Event) => event.preventDefault();
beforeEach(() => window.addEventListener('click', stay));
afterEach(() => window.removeEventListener('click', stay));

// The links of a guide, as the page around PageView has them.
const LINKS = `
  <a href="/map?origin=51.4545,-2.5879">Bristol’s map</a>
  <a href="/map"><span>Open the map</span></a>
  <a href="/guides/e-scooters-bath">Bath</a>
  <a href="https://beryl.cc/scheme/bristol">Beryl</a>`;

function guide() {
  const view = render(<PageView {...page} />);
  view.container.insertAdjacentHTML('beforeend', LINKS);
  return view;
}

describe('the views of a page of the site', () => {
  it('counts the page once, under the address and title it is given', () => {
    guide();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(undefined, {}, page);
  });

  it('counts each link to the map followed from it, a city’s or the map’s', () => {
    guide();
    fireEvent.click(screen.getByText('Bristol’s map'));
    fireEvent.click(screen.getByText('Open the map'));
    expect(track).toHaveBeenCalledWith('map_open', { result: 'city' }, page);
    expect(track).toHaveBeenCalledWith('map_open', { result: 'map' }, page);
    expect(track).toHaveBeenCalledTimes(3);
  });

  it('counts no other link', () => {
    guide();
    fireEvent.click(screen.getByText('Bath'));
    fireEvent.click(screen.getByText('Beryl'));
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the page is gone', () => {
    const { unmount } = guide();
    const link = screen.getByText('Open the map');
    unmount();
    document.body.appendChild(link);
    fireEvent.click(link);
    expect(track).toHaveBeenCalledTimes(1);
    link.remove();
  });
});
