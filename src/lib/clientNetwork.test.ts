import { describe, expect, it } from 'vitest';
import { clientNetwork } from '@/lib/clientNetwork';

describe('clientNetwork', () => {
  it('keeps an IPv4 address as it is', () => {
    expect(clientNetwork('203.0.113.10')).toBe('203.0.113.10');
    expect(clientNetwork('::ffff:203.0.113.10')).toBe('203.0.113.10');
  });

  it('gives an IPv6 address as its /64, however it is written', () => {
    const network = '2a02:810a:900:8500::';
    for (const address of ['2a02:810a:900:8500:142e:b4b6:9753:c463', '2a02:810a:0900:8500:a8c8:14f0:a675:3acf',
      '2A02:810A:900:8500::1', '2a02:810a:900:8500::']) {
      expect(clientNetwork(address)).toBe(network);
    }
    expect(clientNetwork('2a06:98c0:3600::103')).toBe('2a06:98c0:3600:0::');
    expect(clientNetwork('::1')).toBe('0:0:0:0::');
  });

  it('returns anything else as it is', () => {
    for (const value of ['unknown', '2a02::810a::1', '2a02:810a:900:8500:1:2:3:4:5', 'g::1']) {
      expect(clientNetwork(value)).toBe(value);
    }
  });
});
