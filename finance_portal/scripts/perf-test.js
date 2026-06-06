/**
 * k6 performans testi — HPA scale-up demosu.
 *
 * Çalıştırma (cloud):
 *   docker run --rm -i grafana/k6 run - < scripts/perf-test.js
 *
 * BASE_URL ortam değişkeniyle hedef değişir (default: cloud Ingress IP).
 *
 * Senaryo:
 *   - 60 sn ramp-up  → 50 sanal kullanıcı
 *   - 120 sn sürdür → CPU > %70 → HPA scale-up tetikler (1 → ~3 replica)
 *   - 30 sn ramp-down
 *
 * Threshold:
 *   - http_req_duration P95 < 2000 ms  ( §9.1 hedefi)
 *   - http_req_failed   < %5
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://34.36.210.150';

export const options = {
    stages: [
        { duration: '60s', target: 50 },
        { duration: '120s', target: 50 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed':   ['rate<0.05'],
    },
};

// Auth gerektirmeyen public endpoint'ler — backend CPU yüklensin yeter.
// Liveness probe, frontend root, news headlines — bunlar 200 döner JWT'siz.
const ENDPOINTS = [
    '/api/v1/actuator/health/liveness',
    '/api/v1/actuator/health/readiness',
    '/',  // Frontend HTML — backend'i etkilemez ama dağıtım gerçekçi
];

export default function () {
    const path = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    const url = `${BASE}${path}`;
    const res = http.get(url, { tags: { name: path } });
    check(res, {
        'status 200': r => r.status === 200,
        'response <2s': r => r.timings.duration < 2000,
    });
    sleep(0.3 + Math.random() * 0.7); // gerçekçi düşünme süresi
}
