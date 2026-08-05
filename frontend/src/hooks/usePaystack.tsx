"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/cta-btn";

import axios from "axios";
import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";

import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";

interface Props {
  tickets: TicketForm[];
  event: string;
  totalPrice: number;
  email: string;
  currency: string;
}

/**
 * Checkout flow: reserve → pay → confirm.
 *
 * The order matters. This used to charge the buyer first and only then ask the API to
 * create the booking, so anything that interrupted the callback — a closed tab, a dropped
 * connection, a tier selling out in the meantime — took the money and left no booking
 * behind. Seats are now held server-side before Paystack opens, and the reference we pay
 * against is issued by the server, so a charge always has a reservation behind it.
 *
 * The client never reports payment success as fact: it only hands the reference back, and
 * the server verifies the charge with Paystack before confirming. Confirmation is
 * idempotent, so it does not matter whether this call or Paystack's webhook lands first.
 */
export const usePaystack = (props: Props) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bookings, setBookings] = useState<BookingsType[]>([]);
  // Set once the server has held the seats; triggers the payment popup via the effect below.
  const [reservation, setReservation] = useState<{ reference: string } | null>(
    null
  );
  const openedFor = useRef<string | null>(null);

  const config = {
    reference: reservation?.reference ?? "",
    email: props.email,
    amount: props.totalPrice * 100,
    publicKey: "pk_test_6ace9b13128336053a51ecb02a7554544fac14d9",
    metadata: {
      custom_fields: [
        {
          display_name: "description",
          variable_name: "description",
          value: "Event ticket purchase",
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  /** Server-side confirmation. The reference is all we send; the server verifies the charge. */
  const confirmReservation = useCallback(async (reference: string) => {
    setLoading(true);
    try {
      await axios({
        method: "POST",
        url: API_URLS.bookings.confirmBooking,
        data: { reference },
        headers: { Authorization: `Bearer ${getCookie("jwt")}` },
      });
      setSuccess(true);
      toast.success("Payment confirmed — your tickets are on the way");
    } catch (error: any) {
      setSuccess(false);
      // The charge may still be valid: Paystack's webhook confirms independently, so the
      // reservation is not lost just because this call failed.
      toast.error(
        error.response?.data?.message ??
          "We could not confirm your payment yet. If you were charged, your tickets will still be issued."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onSuccess = useCallback(() => {
    if (reservation) confirmReservation(reservation.reference);
  }, [reservation, confirmReservation]);

  const onClose = useCallback(() => {
    // Nothing to undo client-side: the reservation carries a server-side expiry, and the
    // release sweep returns the seats if the buyer never completes payment.
    toast.info("You have cancelled the payment");
  }, []);

  // Paystack's config is captured at render, so the popup can only open on the render that
  // already has the server-issued reference — hence the effect rather than an inline call.
  useEffect(() => {
    if (!reservation) return;
    if (openedFor.current === reservation.reference) return;
    openedFor.current = reservation.reference;
    // @ts-ignore — react-paystack's callback types are looser than its runtime contract
    initializePayment(onSuccess, onClose);
  }, [reservation, initializePayment, onSuccess, onClose]);

  /** Holds the seats server-side, then opens checkout (or finishes, if the event is free). */
  const reserveAndPay = async () => {
    setLoading(true);
    try {
      // No ticketId here: the server issues it. The scanner admits on this value, so a
      // browser-minted one would let the caller choose its own admission code. It comes
      // back on the response below and is what the digital ticket's QR encodes.
      const ticketBuyers = props.tickets.flatMap((ticket) =>
        ticket.buyers.map((buyer) => ({
          email: buyer.email,
          name: buyer.name,
          price: ticket.price,
          event: props.event,
          ticketType: ticket.name,
          currency: props.currency,
          ticketUser: "Guest",
        }))
      );

      const { data } = await axios({
        method: "POST",
        url: API_URLS.bookings.createBookings,
        data: { ticketBuyers, event: props.event },
        headers: { Authorization: `Bearer ${getCookie("jwt")}` },
      });

      const created = data.data.booking;
      setBookings(
        created.map(
          ({ name, email, ticketId, price, ticketType }: BookingsType) => ({
            name,
            email,
            ticketId,
            price,
            ticketType,
          })
        )
      );

      // A free event is confirmed by the server during reservation — there is no charge.
      if (!data.data.requiresPayment) {
        setSuccess(true);
        toast.success("Registered all user(s) for the event");
        return;
      }

      setReservation({ reference: String(data.data.reference) });
    } catch (error: any) {
      setSuccess(false);
      toast.error(
        error.response?.data?.message ?? "Error reserving your ticket(s)"
      );
    } finally {
      setLoading(false);
    }
  };

  const PaystackHook = () => (
    <Button onClick={reserveAndPay}>Continue</Button>
  );

  return { PaystackHook, success, bookings, loading };
};
