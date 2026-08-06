import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useMyEvents = (query?: string | null) => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["events", query],
    queryFn: async () => {
      let url = API_URLS.events.myEvents;
      if (query) url = `${API_URLS.events.myEvents}?eventName=${query}`;

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
