import * as userRepository from '../repositories/userRepository.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for user management.
 * Framework-agnostic: no req/res/next.
 */

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'email',
  'photo',
  'gender',
  'phoneNumber',
];

/**
 * Returns all users (admin use).
 */
export const getAllUsers = () => userRepository.findAll();

/**
 * Returns a single user by ID, including role - this backs the admin directory as well as
 * `/me`, and `role` is `select: false`, so a plain findById would report it as undefined.
 */
export const getUserById = (id) => userRepository.findByIdWithRole(id);

/**
 * Updates allowed profile fields for the current user.
 * Rejects any attempt to update passwords via this route.
 */
export const updateMe = async (userId, body) => {
  if (body.password || body.passwordConfirm) {
    throw new AppError(
      'This route is not for password updates. Please use /update-my-password',
      400,
    );
  }

  const filteredBody = {};
  Object.keys(body).forEach((key) => {
    if (ALLOWED_UPDATE_FIELDS.includes(key)) filteredBody[key] = body[key];
  });

  return userRepository.updateById(userId, filteredBody);
};

/**
 * Soft-deletes the current user by setting isActive: false.
 */
export const deleteMe = (userId) => userRepository.deactivate(userId);

/** Roles an admin may assign through the API. */
export const ASSIGNABLE_ROLES = Object.freeze([
  'user',
  'creator',
  'admin',
  'usher',
]);

/**
 * Pure: may `actor` change `target`'s role to `role`? Exported for unit testing.
 *
 * Three refusals, each guarding a distinct failure:
 *
 * - **Not an admin.** Role changes are the one privilege that can create more privilege, so
 *   nothing below admin may perform them.
 * - **Changing your own role.** An admin demoting themselves could remove the last admin,
 *   after which nobody can grant the role back and the platform is permanently locked out of
 *   its own administration. Self-promotion is blocked by the same rule, which keeps the
 *   audit story simple: your role only ever changes because somebody else changed it.
 * - **Demoting the root admin.** The bootstrap account seeded by scripts/seed-admin.js is
 *   the recovery path if every other admin is lost, so an ordinary admin cannot remove it.
 *
 * @returns {{ok: true} | {ok: false, status: number, message: string}}
 */
export const canChangeRole = (actor, target, role) => {
  if (actor?.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      message: 'Only an administrator can change roles',
    };
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return { ok: false, status: 400, message: 'That is not a valid role' };
  }
  if (!target) {
    return { ok: false, status: 404, message: 'No user found with that ID' };
  }
  if (String(target._id) === String(actor._id)) {
    return {
      ok: false,
      status: 403,
      message: 'You cannot change your own role',
    };
  }
  if (target.isRootAdmin && role !== 'admin') {
    return {
      ok: false,
      status: 403,
      message: 'The root administrator cannot be demoted',
    };
  }
  return { ok: true };
};

/**
 * Pure: may `actor` delete `target`? Exported for unit testing.
 *
 * The same two guards as canChangeRole, for the same reasons: an admin deleting themselves
 * could remove the last administrator, and the root account is the recovery path if every
 * other admin is lost.
 *
 * @returns {{ok: true} | {ok: false, status: number, message: string}}
 */
export const canDeleteUser = (actor, target) => {
  if (actor?.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      message: 'Only an administrator can delete a user',
    };
  }
  if (!target) {
    return { ok: false, status: 404, message: 'No user found with that ID' };
  }
  if (String(target._id) === String(actor._id)) {
    return {
      ok: false,
      status: 403,
      message: 'You cannot delete your own account from here',
    };
  }
  if (target.isRootAdmin) {
    return {
      ok: false,
      status: 403,
      message: 'The root administrator cannot be deleted',
    };
  }
  return { ok: true };
};

/**
 * Deactivates a user on an admin's authority.
 *
 * Soft delete, reusing the same `isActive` flag as self-deletion. The account stops being
 * able to sign in and disappears from every query, but its events, bookings and audit-log
 * entries stay intact - hard-deleting the document would orphan the record of who admitted
 * whom, which is exactly the evidence an audit log exists to preserve.
 */
export const deleteUser = async (actor, targetId) => {
  const target = await userRepository.findByIdWithRole(targetId);

  const decision = canDeleteUser(actor, target);
  if (!decision.ok) throw new AppError(decision.message, decision.status);

  await userRepository.deactivate(targetId);
  return { name: target.name, email: target.email };
};

/**
 * Changes a user's role on an admin's authority.
 *
 * Moving someone off `usher` also clears their door assignments: admissionService.
 * authorizeScan only consults assignedEvents when role === 'usher', so leaving the array
 * populated would strand rows that grant nothing and would silently re-arm every one of them
 * if the account were ever made an usher again.
 */
export const changeUserRole = async (actor, targetId, role) => {
  const target = await userRepository.findByIdWithRole(targetId);

  const decision = canChangeRole(actor, target, role);
  if (!decision.ok) throw new AppError(decision.message, decision.status);

  return userRepository.setRole(targetId, role, {
    clearAssignments: role !== 'usher',
  });
};
