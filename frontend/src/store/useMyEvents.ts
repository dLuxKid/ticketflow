import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * The caller's events. `scope` is only meaningful for an admin: the server ignores "all"
 * for anyone else rather than honouring it, so a non-admin cannot widen their view by
 * editing the query string.
 */
export const useMyEvents = (
  query?: string | null,
  scope: "own" | "all" = "own",
) => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["events", query, scope],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("eventName", query);
      if (scope === "all") params.set("scope", "all");
      const qs = params.toString();
      const url = qs
        ? `${API_URLS.events.myEvents}?${qs}`
        : API_URLS.events.myEvents;

      const res = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      });

      return res.data;
    },
  });
};

/**
 * Archives an event. Admin-only server-side.
 *
 * Deliberately not called "delete" beyond the HTTP verb: the event is hidden, not destroyed,
 * because bookings (including paid ones), guests, chat messages and the admission audit log
 * all reference it. The response reports what the archive affected so the caller can say so.
 */
export const useDeleteEvent = () => {
  const jwt = getCookie("jwt");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(API_URLS.events.delete(id), {
        headers: { Authorization: "Bearer " + jwt },
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
};
