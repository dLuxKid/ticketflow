import * as networkingService from '../../services/networkingService.js';
import * as networkingGuestService from '../../services/networkingGuestService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';
import {
  networkingBus,
  MESSAGE_EVENT,
} from '../../shared/events/networkingEvents.js';

/**
 * Presentation layer for guest networking (Phase 7).
 *
 * Uses Server-Sent Events, same as the live dashboard (Phase 3): server->client push only,
 * no extra dependency. Sending is a normal REST POST, since SSE is receive-only.
 */

/**
 * Emails a one-time code to a guest holding a booking for this event. Public: the caller has
 * no account yet, which is the entire point.
 *
 * Responds identically whether or not the address matches a booking - a distinguishable
 * response would reveal who is on a private event's guest list.
 */
export const requestGuestAccess = catchAsync(async (req, res) => {
  await networkingGuestService.requestAccessCode(
    req.params.eventId,
    req.body.email,
  );

  res.status(200).json({
    status: 'success',
    message:
      'If that email is on the guest list for this event, a code is on its way.',
  });
});

/** Exchanges a valid code for a session token. Public, for the same reason. */
export const verifyGuestAccess = catchAsync(async (req, res) => {
  const { token, user } = await networkingGuestService.verifyAccessCode(
    req.params.eventId,
    req.body.email,
    req.body.code,
  );

  res.status(200).json({
    status: 'success',
    token,
    data: { user: { _id: user._id, name: user.name, email: user.email } },
  });
});

export const getDirectory = catchAsync(async (req, res) => {
  const directory = await networkingService.getDirectory(
    req.params.eventId,
    req.user,
  );
  res.status(200).json({ status: 'success', data: { directory } });
});

export const setOptIn = catchAsync(async (req, res) => {
  const booking = await networkingService.setOptIn(
    req.params.eventId,
    req.user,
    req.body,
  );
  res.status(200).json({ status: 'success', data: { booking } });
});

export const postGroupMessage = catchAsync(async (req, res) => {
  const message = await networkingService.postGroupMessage(
    req.params.eventId,
    req.user,
    req.body.body,
  );
  res.status(201).json({ status: 'success', data: { message } });
});

export const getDmThread = catchAsync(async (req, res) => {
  const messages = await networkingService.getDmThread(
    req.params.eventId,
    req.user,
    req.params.userId,
  );
  res.status(200).json({ status: 'success', data: { messages } });
});

export const postDm = catchAsync(async (req, res) => {
  const message = await networkingService.postDm(
    req.params.eventId,
    req.user,
    req.params.userId,
    req.body.body,
  );
  res.status(201).json({ status: 'success', data: { message } });
});

/**
 * Live stream for one event's networking space. Authorizes the viewer, sends an initial
 * snapshot (group history + directory), then forwards group broadcasts to everyone and DMs
 * only to their two participants until the client disconnects.
 */
export const streamNetwork = catchAsync(async (req, res) => {
  // Authorize BEFORE switching to the event-stream protocol, so a 403/404 is returned as
  // normal JSON by the error handler - same ordering as the dashboard stream.
  const { event } = await networkingService.resolveViewer(
    req.params.eventId,
    req.user,
  );
  const eventId = String(req.params.eventId);
  const viewerId = String(req.user._id);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (name, data) =>
    res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);

  const [group, directory] = await Promise.all([
    networkingService.getGroupHistory(eventId, req.user),
    networkingService.getDirectory(eventId, req.user),
  ]);
  // startDate/endDate travel alongside isLive so the client can keep recomputing liveness
  // itself as time passes, rather than trusting a string snapshotted once at connect time -
  // a long-open tab would otherwise show a stale "Live" long after the window actually
  // closed (or opened), silently disagreeing with what a send attempt gets rejected for.
  send('snapshot', {
    eventId,
    // Carried so the channel can name the event it belongs to. Guests arriving by emailed
    // link have no other context for which room they have just walked into.
    eventName: event.eventName,
    isLive: event.isLive,
    startDate: event.startDate,
    endDate: event.endDate,
    group,
    directory,
  });

  const onMessage = (payload) => {
    if (payload.eventId !== eventId) return;
    const isGroupBroadcast = payload.recipient === null;
    const isMyDm =
      payload.recipient === viewerId || payload.sender === viewerId;
    if (isGroupBroadcast || isMyDm) send(MESSAGE_EVENT, payload.message);
  };
  networkingBus.on(MESSAGE_EVENT, onMessage);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    networkingBus.off(MESSAGE_EVENT, onMessage);
    res.end();
  });
});
