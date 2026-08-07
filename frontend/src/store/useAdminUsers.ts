import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  role?: "user" | "creator" | "admin" | "usher";
  isRootAdmin?: boolean;
  assignedEvents?: string[];
};

/**
 * The admin user directory. `GET /users` is admin-gated server-side, so a non-admin calling
 * this simply receives 403 - the UI hides it as a courtesy, not as the security boundary.
 */
export const useAdminUsers = () => {
  const jwt = getCookie("jwt");

  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await axios.get(API_URLS.users.all, {
        headers: { Authorization: "Bearer " + jwt },
      });
      return res.data;
    },
  });
};

/** Promote or demote a user. Guards (self-change, root demotion) are enforced server-side. */
export const useChangeRole = () => {
  const jwt = getCookie("jwt");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await axios.patch(
        API_URLS.users.role(id),
        { role },
        { headers: { Authorization: "Bearer " + jwt } },
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

/**
 * Deactivates a user. Soft delete server-side - the account and everything it owns survive,
 * it simply can no longer sign in and disappears from the directory.
 */
export const useDeleteUser = () => {
  const jwt = getCookie("jwt");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`${API_URLS.users.all}/${id}`, {
        headers: { Authorization: "Bearer " + jwt },
      });
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};
