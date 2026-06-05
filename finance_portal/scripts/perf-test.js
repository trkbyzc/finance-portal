/**
 * k6 performans testi — gereksinimler §9.1 için (P95 < 2sn hedefi).
 *
 * Çalıştırma:
 *   docker run --rm -i --network host grafana/k6 run - < scripts/perf-test.js
 *
 * Senaryo:
 *   - 30 sn ramp-up → 20 sanal kullanıcı
 *   - 60 sn sürdür → her kullanıcı en sık çağrılan public read endpoint'leri rastgele hit eder
 *   - 10 sn ramp-down
 *
 * Threshold:
 *   - http_req_duration P95 < 2000ms  ( §9.1 hedefi)
 *   - http_req_failed   < %1
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 20 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        //  §9.1: "Normal yük altında <2 sn"
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed':   ['rate<0.01'],
    },
};

// En sık çağrılan public read endpoint'leri — frontend'in dashboard/market sayfalarında attığı çağrılar
const ENDPOINTS = [
    '/api/market-data/currencies',
    '/api/market-data/crypto-currencies',
    '/api/market-data/commodities',
    '/api/market-data/stocks',
    '/api/market-data/bonds',
    '/api/market-data/indices',
    '/api/market-data/turkish-gold',
    '/api/market-data/all',
    '/api/news?lang=tr',
    '/api/economy/indicators',
];

export default function () {
    const url = `${BASE}${ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)]}`;
    const res = http.get(url, { tags: { name: url } });
    check(res, {
        'status 200': r => r.status === 200,
        'response <2s': r => r.timings.duration < 2000,
    });
    sleep(0.5 + Math.random()); // gerçekçi düşünme süresi
}
