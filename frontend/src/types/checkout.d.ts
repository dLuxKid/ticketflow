type TicketsType = {
  type: string;
  price: string;
  buyer: {
    name: string;
    email: string;
  };
}[];

type BuyerInfo = { name: string; email: string };

type TicketForm = {
  name: string;
  price: string;
  quantity: number;
  buyers: BuyerInfo[];
};

type checkoutDetailsType = { name: string; quantity: number; price: number }[];

type BookingsType = {
  name: string;
  ticketId: string;
  price: number;
  email: string;
  ticketType: string;
};
