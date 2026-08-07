import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Events the signed-in user works as door staff.
 *
 * Separate from `useMyEvents`, which returns events the user *created*. Door staff usually
 * created nothing, so without this their "My events" page was empty and the scanner was
 * unreachable - even though the API would have authorised them to scan.
 */
export const useAssignedEvents = () => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["assigned-events"],
    queryFn: async () => {
      const res = await axios.get(API_URLS.events.assignedEvents, {
        headers: { Authorization: "Bearer " + jwt },
      });
      return res.data;
    },
  });
};
