import {
  payloadContentHash,
  buildScopeKey
} from '../../infrastructure/cache/proxyReconciliation';
import { stableSerialize } from '../../infrastructure/cache/proxyCanonical';

describe('proxyCanonical / scope', () => {
  test('stableSerialize é determinístico com chaves por ordem diferente no objeto fonte', () => {
    const a = stableSerialize({ z: 1, a: { m: true, n: false } });
    const b = stableSerialize({ a: { n: false, m: true }, z: 1 });
    expect(a).toBe(b);
  });

  test('buildScopeKey ignora ordem das chaves na query', () => {
    const sk1 = buildScopeKey('svc', { limit: '10', iso: 'PT' });
    const sk2 = buildScopeKey('svc', { iso: 'PT', limit: '10' });
    expect(sk1).toBe(sk2);
  });

  test('payloadContentHash só muda quando o conteúdo canónico muda', () => {
    expect(payloadContentHash({ a: 1, b: 2 })).toBe(payloadContentHash({ b: 2, a: 1 }));
    expect(payloadContentHash({ a: 1 })).not.toBe(payloadContentHash({ a: 2 }));
  });
});
