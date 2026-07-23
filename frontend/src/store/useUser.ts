import { baseUrl } from "@/utils/urls";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getCookie } from "cookies-next";

export const useUser = () => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/api/v1/users/get-my-account`, {
        headers: {
          Authorization: "Bearer " + jwt,
        },
      });

      return res.data;
    },
  });
};
