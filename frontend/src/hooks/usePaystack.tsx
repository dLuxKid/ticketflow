"use client";

import { useState } from "react";

import Button from "@/components/ui/cta-btn";

import axios from "axios";
import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { API_URLS, baseUrl } from "@/utils/urls";
import { getCookie } from "cookies-next";

interface Props {
  tickets: TicketForm[];
  event: string;
  totalPrice: number;
  email: string;
  currency: string;
}

export const usePaystack = (props: Props) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bookings, setBookings] = useState<BookingsType[]>([]);

  const config = {
    reference: new Date().getTime().toString(),
    email: props.email,
    amount: props.totalPrice * 100,
    publicKey: "pk_test_6ace9b13128336053a51ecb02a7554544fac14d9",
    metadata: {
      custom_fields: [
        {
          display_name: "description",
          variable_name: "description",
          value: "Funding Wallet",
        },
        {
          display_name: "userId",
          variable_name: "userId",
          value: uuidv4(),
        },
      ],
    },
  };

  const onSuccess = (reference: any) => {
    setLoading(true);

    const transactionStatus = reference.status;
    const transactionNumber = reference.trans;

    delete reference.status;
    delete reference.trans;

    const url = API_URLS.bookings.createBookings;

    const ticketBuyers: any = [];

    props.tickets.forEach((ticket) => {
      ticket.buyers.forEach((buyer) => {
        const additionalData = {
          email: buyer.email,
          name: buyer.name,
          price: ticket.price,
          ticketId: `#${uuidv4().slice(0, 7).toUpperCase()}`,
          event: props.event,
          ticketType: ticket.name,
          currency: props.currency,
          ticketUser: "Guest",
          transactionNumber,
          transactionStatus,
          ...reference,
        };

        ticketBuyers.push(additionalData);
      });
    });

    axios({
      method: "POST",
      url,
      data: { ticketBuyers, event: props.event },
      headers: {
        Authorization: `Bearer ${getCookie("jwt")}`,
      },
    })
      .then((data) => {
        const bookings = data.data.data.booking;

        bookings.forEach(
          ({ name, email, ticketId, price, ticketType }: any) => {
            setBookings((prevBookings) => [
              ...prevBookings,
              {
                name,
                email,
                ticketId,
                price,
                ticketType,
              },
            ]);
          },
        );
        setSuccess(true);
        toast.success("Registered all user(s) for the event");
      })
      .catch((error) => {
        setSuccess(false);
        console.log(error);
        toast.error(
          error.response
            ? error.response.data.message
            : `Error registering your booking(s)`,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onClose = () => toast.info("You have cancelled the payment");

  const initializePayment = usePaystackPayment(config);

  const PaystackHook = () => {
    return (
      <Button
        onClick={() => {
          if (props.totalPrice === 0)
            onSuccess({
              reference: new Date().getTime().toString(),
              trans: Number(new Date().getTime().toString()),
              status: "success",
              message: "success",
            });
          else {
            // @ts-ignore
            initializePayment(onSuccess, onClose);
          }
        }}
      >
        Continue
      </Button>
    );
  };

  return { PaystackHook, success, bookings, loading };
};
