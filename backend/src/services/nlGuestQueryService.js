import * as eventRepository from '../repositories/eventRepository.js';
import * as guestRepository from '../repositories/guestRepository.js';
import { parseQuestion } from './nlQuery/intentParser.js';
import { executeQuery } from './nlQuery/executeQuery.js';
import { canViewDashboard } from './dashboardService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Answers a plain-English question about an event's guest list.
 *
 * Reuses the dashboard's access rule (owner/admin) - asking "who hasn't arrived" requires
 * the same visibility as watching arrivals live. See nlQuery/intentParser.js for why this
 * uses a rule-based parser rather than a hosted LLM in this environment, and how a hosted
 * LLM would slot in later without touching this function or the API route.
 *
 * @returns {Promise<{question:string, intent:object, action:string, count:number, guests:object[]}>}
 * @throws {AppError} 403/404 on access, 400 if the question isn't recognised
 */
export const answerQuestion = async (eventId, question, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!canViewDashboard(user, event)) {
    throw new AppError('You do not have permission to query this event', 403);
  }

  const intent = parseQuestion(question);
  if (!intent) {
    throw new AppError(
      'Could not understand that question. Try things like "who hasn\'t arrived" or "how many VIPs checked in".',
      400,
    );
  }

  const guests = await guestRepository.findByEventWithStatus(eventId);
  const { action, matched, count } = executeQuery(intent, guests);

  return {
    question,
    intent,
    action,
    count,
    guests:
      action === 'list'
        ? matched.map((g) => ({ name: g.name, email: g.email, vip: g.vip }))
        : [],
  };
};
