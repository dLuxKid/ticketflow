import Providers from "@/providers";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";
import "tippy.js/dist/tippy.css";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TicketFlow",
    template: "TicketFlow - %s",
    absolute: "TicketFlow - Homepage",
  },
  description: "We are reinventing the ticketing experience",
  other: {
    "theme-color": "light",
    "color-scheme": "light",
    "twitter:image": "https://ticketflow.vercel.app/favicon.ico",
    "twitter:image:alt": "TicketFlow",
    "twitter:card": "summary_large_image",
    "twitter:site": "https://ticketflow.vercel.app",
    "og:url": "https://ticketflow.vercel.app",
    "og:image": "/favicon.ico",
    "og:image:alt": "TicketFlow",
    "og:type": "website",
  },
  openGraph: {
    title: "TicketFlow - Homepage",
    description: "We are reinventing the ticketing experience",
    url: "https://ticketflow.vercel.app",
    siteName: "TicketFlow",
    images: ["https://ticketflow.vercel.app/favicon.ico"],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.className} relative overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
