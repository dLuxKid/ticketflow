/**
 * Executes a structured intent (see intentParser.js) over an already-loaded guest list.
 * Pure: takes plain guest objects (each with `booking.status` populated), no I/O, so it is
 * trivially unit-tested independent of the parser and the database.
 *
 * @param {Intent} intent
 * @param {Array<{name:string,email:string,vip:boolean,booking?:{status?:string}}>} guests
 * @returns {{action:'list'|'count', matched: object[], count: number}}
 */
export const executeQuery = (intent, guests) => {
  const isAdmitted = (g) => g.booking?.status === 'admitted';

  const matched = guests.filter((g) => {
    if (intent.vipOnly && !g.vip) return false;
    if (intent.status === 'admitted') return isAdmitted(g);
    if (intent.status === 'not_admitted') return !isAdmitted(g);
    return true; // 'any'
  });

  return { action: intent.action, matched, count: matched.length };
};
