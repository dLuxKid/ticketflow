import { baseUrl } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useMyEvents = (query?: string | null) => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["events", query],
    queryFn: async () => {
      let url = `${baseUrl}/api/v1/events/my-events`;
      if (query) url = `${baseUrl}/api/v1/events/my-events?eventName=${query}`;

      const res = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      });

      return res.data;
    },
  });
};
