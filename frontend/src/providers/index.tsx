"use client";

import NextTopLoader from "nextjs-toploader";
import TanstackQueryProvider from "@/providers/TanstackQueryProvider";
import { Toaster } from "sonner";
import ChatWidget from "@/components/chatbot/chat-widget";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TanstackQueryProvider>
      <NextTopLoader
        color="#6c5ce7"
        height={4}
        showSpinner={false}
        shadow="0 0 10px #6c5ce7,0 0 5px #6c5ce7"
      />
      <div className="absolute top-0 right-0">
        <Toaster position="top-right" />
      </div>
      {children}
      <ChatWidget />
    </TanstackQueryProvider>
  );
}
