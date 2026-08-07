import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * Organiser payout account - the bank account ticket revenue is settled to.
 *
 * The subaccount code itself is never sent to the client: it identifies the destination in
 * the money path and the account holder has no use for it, so keeping it server-side keeps
 * it out of logs, screenshots and bug reports.
 */

export type PayoutAccount =
  | { connected: false }
  | {
      connected: true;
      bankName: string;
      accountName: string;
      accountNumberLast4: string;
      platformFeePercent: number;
      connectedAt: string;
    };

export type Bank = { name: string; code: string; currency: string };

const auth = () => ({
  headers: { Authorization: "Bearer " + getCookie("jwt") },
});

export const usePayout = () =>
  useQuery({
    queryKey: ["payout"],
    queryFn: async (): Promise<PayoutAccount> => {
      const res = await axios.get(API_URLS.users.myPayout, auth());
      return res.data.data.payout;
    },
  });

/**
 * The bank list comes from Paystack rather than a hard-coded array so the codes always
 * match what the provider will accept. Cached for the session: it changes rarely and the
 * request is not free.
 */
export const useBanks = (enabled = true) =>
  useQuery({
    queryKey: ["payout-banks"],
    enabled,
    staleTime: Infinity,
    queryFn: async (): Promise<Bank[]> => {
      const res = await axios.get(API_URLS.users.payoutBanks, auth());
      return res.data.data.banks;
    },
  });

/**
 * Resolves an account number to the name it is registered under, so the organiser confirms
 * the destination before committing. A mistyped digit would otherwise send an event's whole
 * revenue to a stranger, and bank transfers are not reversible on request.
 */
export const useResolveAccount = () =>
  useMutation({
    mutationFn: async (input: { accountNumber: string; bankCode: string }) => {
      const res = await axios.post(
        API_URLS.users.resolvePayoutAccount,
        input,
        auth(),
      );
      return res.data.data.account as { accountName: string };
    },
  });

export const useConnectPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      accountNumber: string;
      bankCode: string;
      businessName?: string;
    }) => {
      const res = await axios.post(API_URLS.users.myPayout, input, auth());
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payout"] }),
  });
};
