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
  },
  events: {
    base: `${baseUrl}/api/v1/events`,
    create: `${baseUrl}/api/v1/events/create`,
    update: (id: string) => `${baseUrl}/api/v1/events/update/${id}`,
    myEvents: `${baseUrl}/api/v1/events/my/events`,
    count: `${baseUrl}/api/v1/events/count`,
    upcoming: `${baseUrl}/api/v1/events/upcoming`,
    trending: `${baseUrl}/api/v1/events/trending`,
    single: (slug: string) => `${baseUrl}/api/v1/events/${slug}`,
    dashboard: (eventId: string) =>
      `${baseUrl}/api/v1/events/${eventId}/dashboard`,
    stream: (eventId: string) => `${baseUrl}/api/v1/events/${eventId}/stream`,
    guests: (eventId: string) => `${baseUrl}/api/v1/events/${eventId}/guests`,
  },
  bookings: {
    checkIn: (id: string) => `${baseUrl}/api/v1/bookings/check-in/${id}`,
    eventBookings: (eventId: string) => `${baseUrl}/api/v1/bookings/event/${eventId}`,
    myTickets: `${baseUrl}/api/v1/bookings/my-tickets`,
  },
};
