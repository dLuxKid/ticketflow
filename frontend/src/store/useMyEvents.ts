import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useQuery } from "@tanstack/react-query";
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
