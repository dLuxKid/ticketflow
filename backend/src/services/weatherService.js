/**
 * Weather for an event's location, via Open-Meteo.
 *
 * Open-Meteo is used because it needs no API key and no attribution key management - two
 * REST calls (geocode a city, then fetch a daily forecast) hit with plain `fetch`, matching
 * how this codebase already handles Paystack and the LLM providers rather than adding an SDK
 * for single-endpoint usage.
 *
 * Events store a free-text address and city, not coordinates, so the city is geocoded first.
 * That is the weakest link: an ambiguous or misspelled city yields no match, and this reports
 * that honestly instead of guessing a location.
 */

// Overridable so tests can inject a fake without touching global fetch.
let fetchImpl = fetch;
export const __setFetchForTesting = (fn) => {
  fetchImpl = fn ?? fetch;
};

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/** Open-Meteo's forecast horizon. Beyond this there is no data - not a bad guess, none. */
export const FORECAST_HORIZON_DAYS = 16;

/**
 * WMO weather codes, grouped rather than enumerated: the caller needs "is it wet / freezing /
 * dangerous", not 99 individual descriptions.
 * @see https://open-meteo.com/en/docs - WMO Weather interpretation codes
 */
const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

export const describeWeatherCode = (code) => WMO[code] ?? 'Unsettled';

/** Codes that mean "this will affect how people travel and what they wear". */
const SEVERE_CODES = new Set([56, 57, 65, 66, 67, 75, 82, 86, 95, 96, 99]);
const WET_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
const FREEZING_CODES = new Set([56, 57, 66, 67, 71, 73, 75, 77, 85, 86]);

/**
 * Resolves a place name to coordinates.
 * @returns {Promise<{latitude:number, longitude:number, name:string, country:string}|null>}
 */
export const geocode = async (city, country) => {
  if (!city?.trim()) return null;

  const params = new URLSearchParams({
    name: city.trim(),
    count: '1',
    format: 'json',
  });
  const res = await fetchImpl(`${GEOCODE_URL}?${params}`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const body = await res.json();
  const hit = body?.results?.[0];
  if (!hit) return null;

  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    name: hit.name,
    country: hit.country ?? country ?? '',
  };
};

/** Whole days between now and `date`; negative for past dates. */
export const daysUntil = (date, now = new Date()) => {
  const day = 24 * 60 * 60 * 1000;
  const target = new Date(date);
  return Math.floor(
    (Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
    ) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      day,
  );
};

/**
 * Daily forecast for one date at one place.
 *
 * @returns {Promise<{date:string, maxC:number, minC:number, precipitationChance:number,
 *   windKph:number, code:number, description:string}|null>} null when the date falls outside
 *   Open-Meteo's horizon or the response carries no row for it.
 */
export const getDailyForecast = async (latitude, longitude, date) => {
  const target = new Date(date).toISOString().slice(0, 10);

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max',
    timezone: 'auto',
    start_date: target,
    end_date: target,
  });

  const res = await fetchImpl(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);

  const body = await res.json();
  const at = body?.daily?.time?.indexOf(target) ?? -1;
  if (at === -1) return null;

  const code = body.daily.weathercode?.[at];
  return {
    date: target,
    maxC: body.daily.temperature_2m_max?.[at],
    minC: body.daily.temperature_2m_min?.[at],
    precipitationChance: body.daily.precipitation_probability_max?.[at] ?? null,
    windKph: body.daily.windspeed_10m_max?.[at] ?? null,
    code,
    description: describeWeatherCode(code),
  };
};

/**
 * Pure: turns a forecast plus the organiser's own event details into practical advice.
 * Exported for unit testing - no network, no clock beyond what is passed in.
 *
 * **The safety notes are not a crime-risk assessment.** No free, reliable, globally-available
 * crime API exists, and inventing a "safety score" for a neighbourhood would be both
 * unfounded and potentially defamatory about a real place. What this returns instead is
 * advice grounded in facts the system actually holds: a finish time after dark, weather that
 * makes travel hazardous, and whatever the organiser stated about parking and access.
 *
 * @param {{forecast:object|null, event:object}} input
 * @returns {{dressCode:string[], safety:string[]}}
 */
export const buildAdvice = ({ forecast, event }) => {
  const dressCode = [];
  const safety = [];

  // The organiser's own stated dress code always leads - it is a requirement, not a
  // suggestion, and no weather inference should outrank it.
  if (event?.dressCode?.trim()) {
    dressCode.push(`The organiser asks for: ${event.dressCode.trim()}.`);
  }

  if (forecast) {
    const { maxC, minC, precipitationChance, windKph, code, description } =
      forecast;

    dressCode.push(
      `Expect ${description.toLowerCase()}, around ${Math.round(minC)}–${Math.round(maxC)}°C.`,
    );

    if (maxC <= 5) {
      dressCode.push('It will be cold - a proper coat, and layers underneath.');
    } else if (maxC <= 14) {
      dressCode.push('Mild but not warm; bring a jacket for the evening.');
    } else if (maxC >= 27) {
      dressCode.push(
        'It will be hot - light, breathable fabrics, and bring water.',
      );
    }

    if (WET_CODES.has(code) || (precipitationChance ?? 0) >= 50) {
      dressCode.push(
        `Rain is likely (${precipitationChance ?? 'high'}% chance) - waterproof layer and shoes you don't mind getting wet.`,
      );
    }
    if (windKph !== null && windKph >= 40) {
      dressCode.push(
        'Strong winds forecast - umbrellas will struggle; a hood is the better bet.',
      );
    }

    if (FREEZING_CODES.has(code) || minC <= 0) {
      safety.push(
        'Freezing conditions are forecast - surfaces may be icy underfoot, so allow extra travel time.',
      );
    }
    if (SEVERE_CODES.has(code)) {
      safety.push(
        `Severe weather is forecast (${description.toLowerCase()}) - check for travel disruption before you set off, and follow any organiser updates.`,
      );
    }
  }

  // Finishing after dark is the single most useful, genuinely knowable safety signal here.
  const endHour = event?.endTime ? new Date(event.endTime).getUTCHours() : null;
  if (endHour !== null && (endHour >= 21 || endHour <= 5)) {
    safety.push(
      'This one runs late - arrange your route home in advance rather than at the end of the night.',
    );
  }

  if (event?.parkingInfo?.trim()) {
    safety.push(`Parking: ${event.parkingInfo.trim()}`);
  }
  if (event?.accessibilityInfo?.trim()) {
    safety.push(`Accessibility: ${event.accessibilityInfo.trim()}`);
  }
  if (event?.ageRestriction?.trim()) {
    safety.push(`Age restriction: ${event.ageRestriction.trim()}`);
  }

  if (dressCode.length === 0) {
    dressCode.push(
      'No dress code was set by the organiser, and no forecast is available yet - dress for the venue and the season.',
    );
  }
  safety.push(
    'General: keep your ticket QR and phone charged, and stay with people you came with.',
  );

  return { dressCode, safety };
};

/**
 * Everything the chatbot needs to answer "what's it like / what do I wear / is it safe".
 *
 * Every failure is reported rather than hidden: an unresolvable city, a date beyond the
 * forecast horizon, and an Open-Meteo outage each produce a distinct, honest `note` so the
 * model can say what it does not know instead of inventing a forecast.
 *
 * @param {object} event - a full event document
 */
export const getEventConditions = async (event) => {
  const base = {
    event: event?.eventName,
    city: event?.eventLocation?.city,
    venue: event?.venueName || event?.eventLocation?.address,
    startDate: event?.startDate,
  };

  const lead = daysUntil(event?.startDate);

  // Open-Meteo's forecast endpoint serves today onward; past dates live in its separate
  // archive API. Rather than silently returning an empty forecast, say why there isn't one.
  if (lead < 0) {
    const { dressCode, safety } = buildAdvice({ forecast: null, event });
    return {
      ...base,
      forecast: null,
      note: `That event already started (${Math.abs(lead)} day(s) ago), so there is no forecast to give.`,
      dressCode,
      safety,
      safetyDisclaimer: SAFETY_DISCLAIMER,
    };
  }

  if (lead > FORECAST_HORIZON_DAYS) {
    const { dressCode, safety } = buildAdvice({ forecast: null, event });
    return {
      ...base,
      forecast: null,
      note: `That is ${lead} days away - beyond the ${FORECAST_HORIZON_DAYS}-day forecast horizon, so no weather data is available yet.`,
      dressCode,
      safety,
      safetyDisclaimer: SAFETY_DISCLAIMER,
    };
  }

  let place = null;
  try {
    place = await geocode(
      event?.eventLocation?.city,
      event?.eventLocation?.country,
    );
  } catch {
    place = null;
  }

  if (!place) {
    const { dressCode, safety } = buildAdvice({ forecast: null, event });
    return {
      ...base,
      forecast: null,
      note: `Could not resolve "${event?.eventLocation?.city ?? 'the event city'}" to a location, so no forecast is available.`,
      dressCode,
      safety,
      safetyDisclaimer: SAFETY_DISCLAIMER,
    };
  }

  let forecast = null;
  try {
    forecast = await getDailyForecast(
      place.latitude,
      place.longitude,
      event.startDate,
    );
  } catch {
    forecast = null;
  }

  const { dressCode, safety } = buildAdvice({ forecast, event });
  return {
    ...base,
    resolvedLocation: `${place.name}, ${place.country}`,
    forecast,
    note: forecast
      ? null
      : 'The weather service did not return a forecast for that date.',
    dressCode,
    safety,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
};

/**
 * Sent to the model with every conditions result so it never presents this as a crime-risk
 * rating. Stated as data rather than left to the system prompt, because the prompt is easy
 * to drift away from over a long conversation.
 */
export const SAFETY_DISCLAIMER =
  'These are practical attendance notes based on the forecast and the organiser-supplied details. They are not a crime or neighbourhood-safety assessment - TicketFlow has no such data.';
