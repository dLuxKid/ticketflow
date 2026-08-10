export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

export const API_URLS = {
  users: {
    login: `${baseUrl}/api/v1/users/login`,
    signup: `${baseUrl}/api/v1/users/signup`,
    updatePassword: `${baseUrl}/api/v1/users/update-my-password`,
    updateDetails: `${baseUrl}/api/v1/users/update-my-details`,
    forgotPassword: `${baseUrl}/api/v1/users/forgot-password`,
    getMyAccount: `${baseUrl}/api/v1/users/get-my-account`,
    all: `${baseUrl}/api/v1/users`,
    role: (id: string) => `${baseUrl}/api/v1/users/${id}/role`,
    myPayout: `${baseUrl}/api/v1/users/me/payout`,
    payoutBanks: `${baseUrl}/api/v1/users/payout/banks`,
    resolvePayoutAccount: `${baseUrl}/api/v1/users/payout/resolve-account`,
  },
  events: {
    base: `${baseUrl}/api/v1/events`,
    create: `${baseUrl}/api/v1/events/create`,
    update: (id: string) => `${baseUrl}/api/v1/events/update/${id}`,
    delete: (id: string) => `${baseUrl}/api/v1/events/${id}`,
    myEvents: `${baseUrl}/api/v1/events/my/events`,
    assignedEvents: `${baseUrl}/api/v1/events/my/assigned-events`,
    revenueSummary: `${baseUrl}/api/v1/events/revenue/summary`,
    count: `${baseUrl}/api/v1/events/count`,
    upcoming: `${baseUrl}/api/v1/events/upcoming`,
    trending: `${baseUrl}/api/v1/events/trending`,
    single: (slug: string) => `${baseUrl}/api/v1/events/${slug}`,
    workspace: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/workspace`,
    dashboard: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/dashboard`,
    stream: (eventId: string) => `${baseUrl}/api/v1/events/${eventId}/stream`,
    guests: (eventId: string) => `${baseUrl}/api/v1/events/${eventId}/guests`,
    guestsQuery: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/guests/query`,
    eraseGuest: (eventId: string, guestId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/guests/${guestId}/erase`,
    anomalies: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/anomalies`,
    ushers: (eventId: string) => `${baseUrl}/api/v1/events/${eventId}/ushers`,
    unassignUsher: (eventId: string, userId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/ushers/${userId}`,
    networkStream: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/network/stream`,
    networkDirectory: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/network/directory`,
    networkOptIn: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/network/opt-in`,
    networkMessages: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/network/messages`,
    networkDm: (eventId: string, userId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/network/dms/${userId}`,
  },
  chat: `${baseUrl}/api/v1/chat`,
  bookings: {
    checkIn: (id: string) => `${baseUrl}/api/v1/bookings/check-in/${id}`,
    eventBookings: (eventId: string) =>
      `${baseUrl}/api/v1/bookings/event/${eventId}`,
    myTickets: `${baseUrl}/api/v1/bookings/my-tickets`,
    scan: `${baseUrl}/api/v1/bookings/scan`,
    createBookings: `${baseUrl}/api/v1/bookings/create`,
    confirmBooking: `${baseUrl}/api/v1/bookings/confirm`,
  },
};
