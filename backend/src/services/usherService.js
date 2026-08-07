import * as eventRepository from '../repositories/eventRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { canViewDashboard } from './dashboardService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Door-staff (usher) management for an event.
 *
 * An usher is any user with `eventId` in their `assignedEvents` - admissionService's
 * authorizeScan (Phase 2) already checks exactly this field, so assigning someone here is
 * what actually grants them door access, not a separate permission system.
 */

const authorizeTeamManagement = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!canViewDashboard(user, event)) {
    throw new AppError(
      'You do not have permission to manage this event’s team',
      403,
    );
  }
  return event;
};

export const listUshers = async (eventId, user) => {
  await authorizeTeamManagement(eventId, user);
  const ushers = await userRepository.findAssignedToEvent(eventId);
  return ushers.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));
};

export const assignUsher = async (eventId, email, user) => {
  await authorizeTeamManagement(eventId, user);

  const target = await userRepository.findByEmailWithRole(email);
  if (!target) {
    throw new AppError(
      'No user found with that email. They must sign up first.',
      404,
    );
  }

  const updated = await userRepository.assignToEvent(target._id, eventId);
  return {
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  };
};

export const unassignUsher = async (eventId, userId, user) => {
  await authorizeTeamManagement(eventId, user);
  await userRepository.unassignFromEvent(userId, eventId);
};
