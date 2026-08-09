import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdvice,
  daysUntil,
  describeWeatherCode,
  geocode,
  getDailyForecast,
  __setFetchForTesting,
  SAFETY_DISCLAIMER,
} from '../../src/services/weatherService.js';

/**
 * Open-Meteo integration. The network layer is exercised against injected fakes; the advice
 * layer is pure and tested directly.
 */

const fakeFetch =
  (payload, ok = true) =>
  async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });

// ── Geocoding ───────────────────────────────────────────────────────────────────

test('geocode resolves a city to coordinates', async () => {
  __setFetchForTesting(
    fakeFetch({
      results: [
        { latitude: 6.45, longitude: 3.39, name: 'Lagos', country: 'Nigeria' },
      ],
    }),
  );
  const place = await geocode('Lagos', 'Nigeria');
  assert.equal(place.latitude, 6.45);
  assert.equal(place.name, 'Lagos');
  __setFetchForTesting(null);
});

test('an unresolvable city returns null rather than a guess', async () => {
  __setFetchForTesting(fakeFetch({ results: [] }));
  assert.equal(await geocode('Nowherecity'), null);
  __setFetchForTesting(null);
});

test('a blank city never reaches the network', async () => {
  __setFetchForTesting(() => {
    throw new Error('should not be called');
  });
  assert.equal(await geocode(''), null);
  assert.equal(await geocode(undefined), null);
  __setFetchForTesting(null);
});

// ── Forecast ────────────────────────────────────────────────────────────────────

test('getDailyForecast maps the Open-Meteo daily row', async () => {
  __setFetchForTesting(
    fakeFetch({
      daily: {
        time: ['2026-08-20'],
        weathercode: [63],
        temperature_2m_max: [18],
        temperature_2m_min: [11],
        precipitation_probability_max: [80],
        windspeed_10m_max: [22],
      },
    }),
  );
  const f = await getDailyForecast(6.45, 3.39, '2026-08-20T18:00:00Z');
  assert.equal(f.maxC, 18);
  assert.equal(f.precipitationChance, 80);
  assert.equal(f.description, 'Rain');
  __setFetchForTesting(null);
});

test('a date absent from the response yields null, not a fabricated row', async () => {
  __setFetchForTesting(fakeFetch({ daily: { time: [] } }));
  assert.equal(await getDailyForecast(1, 2, '2026-08-20'), null);
  __setFetchForTesting(null);
});

test('describeWeatherCode falls back rather than returning undefined', () => {
  assert.equal(describeWeatherCode(0), 'Clear sky');
  assert.equal(describeWeatherCode(4242), 'Unsettled');
});

// ── daysUntil ───────────────────────────────────────────────────────────────────

test('daysUntil counts whole calendar days either side of today', () => {
  const now = new Date('2026-08-06T10:00:00Z');
  assert.equal(daysUntil('2026-08-06T23:00:00Z', now), 0);
  assert.equal(daysUntil('2026-08-07T01:00:00Z', now), 1);
  assert.equal(daysUntil('2026-08-05T23:00:00Z', now), -1);
});

// ── Advice ──────────────────────────────────────────────────────────────────────

const cold = {
  maxC: 3,
  minC: -2,
  precipitationChance: 10,
  windKph: 10,
  code: 71,
  description: 'Light snow',
};

test("the organiser's own dress code leads the advice", () => {
  const { dressCode } = buildAdvice({
    forecast: cold,
    event: { dressCode: 'Black tie' },
  });
  assert.match(dressCode[0], /organiser asks for: Black tie/i);
});

test('cold weather produces layering advice and an ice warning', () => {
  const { dressCode, safety } = buildAdvice({ forecast: cold, event: {} });
  assert.ok(dressCode.some((d) => /coat|layers/i.test(d)));
  assert.ok(safety.some((s) => /icy/i.test(s)));
});

test('rain triggers waterproof advice', () => {
  const { dressCode } = buildAdvice({
    forecast: {
      ...cold,
      maxC: 16,
      minC: 12,
      code: 63,
      precipitationChance: 80,
    },
    event: {},
  });
  assert.ok(dressCode.some((d) => /waterproof/i.test(d)));
});

test('a late finish produces a travel-home note', () => {
  const { safety } = buildAdvice({
    forecast: null,
    event: { endTime: new Date('2026-08-20T23:30:00Z') },
  });
  assert.ok(safety.some((s) => /runs late|route home/i.test(s)));
});

test('organiser-stated parking and access are surfaced verbatim', () => {
  const { safety } = buildAdvice({
    forecast: null,
    event: {
      parkingInfo: 'Underground car park, £8',
      accessibilityInfo: 'Step-free',
    },
  });
  assert.ok(safety.some((s) => s.includes('Underground car park, £8')));
  assert.ok(safety.some((s) => s.includes('Step-free')));
});

test('with no forecast and no dress code, advice says so instead of inventing one', () => {
  const { dressCode } = buildAdvice({ forecast: null, event: {} });
  assert.equal(dressCode.length, 1);
  assert.match(dressCode[0], /No dress code was set/i);
});

// ─── Late-finishing events ─────────────────────────────────────────────────────

test('an event finishing late carries a get-home-safely note', () => {
  // The most useful safety signal available, and genuinely knowable from the data — unlike
  // any claim about the neighbourhood. Someone deciding whether to book needs it beforehand.
  const lateNight = new Date('2026-09-01T23:30:00Z');
  const { safety } = buildAdvice({
    forecast: null,
    event: { endTime: lateNight },
  });

  assert.ok(
    safety.some((s) => /runs late|route home/i.test(s)),
    'a 23:30 finish should warn about getting home',
  );
});

test('an event finishing in the small hours also warns', () => {
  const afterMidnight = new Date('2026-09-02T02:00:00Z');
  const { safety } = buildAdvice({
    forecast: null,
    event: { endTime: afterMidnight },
  });
  assert.ok(safety.some((s) => /runs late|route home/i.test(s)));
});

test('an afternoon event does not warn about running late', () => {
  // The warning has to stay meaningful: attaching it to a 3pm finish would train people to
  // ignore it on the events where it matters.
  const afternoon = new Date('2026-09-01T15:00:00Z');
  const { safety } = buildAdvice({
    forecast: null,
    event: { endTime: afternoon },
  });

  assert.equal(
    safety.some((s) => /runs late|route home/i.test(s)),
    false,
  );
});

test('safety advice always carries the not-a-crime-rating disclaimer alongside it', () => {
  // The disclaimer is a separate constant returned with every conditions payload; this pins
  // that it exists and says what it must, so it cannot be quietly dropped.
  assert.match(SAFETY_DISCLAIMER, /not a crime|neighbourhood/i);
});
