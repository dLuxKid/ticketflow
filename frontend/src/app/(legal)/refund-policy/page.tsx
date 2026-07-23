import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
};

export default function RefundPolicy() {
  return (
    <main className="p-[5%]">
      <h1 className="title-text w-full text-main-purple mb-4">Refund Policy</h1>
      <h3 className="text-base md:text-xl font-semibold">Introduction</h3>
      <p className="body-text text-main-black my-8">
        This Refund Policy (&quot;the Policy&#39;&#39;) clarifies your
        entitlement to a refund for tickets acquired on the{" "}
        <span className="font-semibold text-main-black">TicketFlow</span> platform
        through our website or mobile application (&quot;the Platform&quot;).
        Upon accepting this Policy, you acknowledge that you have diligently
        read and understood your rights as outlined below.
      </p>
      <div>
        <p className="body-text text-main-black">You agree as follows:</p>
        <div className="flex flex-col gap-2">
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              That{" "}
              <span className="font-semibold text-main-black">TicketFlow</span> is
              a self-service platform that allows Event Organisers sell tickets
              directly to their target audience.
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              That{" "}
              <span className="font-semibold text-main-black">TicketFlow</span>{" "}
              solely utilizes the Platform to facilitate Event Organisers in
              selling tickets to Event Attendees and is not directly involved in
              the organization or quality of these events. Event Organisers are
              responsible for their own terms of sale and for any enquiries that
              you may have. We are, therefore, not responsible for any loss or
              damage which occurs as a result of the cancellation of an event or
              mishap experienced at any event paid for via our Platform;
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              That{" "}
              <span className="font-semibold text-main-black">TicketFlow</span>{" "}
              reserves the right to charge a one-time non-refundable processing
              fee (“TicketFlow Fee”) for every ticket purchased via the Platform
              and you shall be informed of the ticket price, and the{" "}
              <span className="font-semibold text-main-black">TicketFlow</span> Fee
              applicable to such ticket, at the point of sale;
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              In the event that you are dissatisfied with the cancellation or
              quality of an event,{" "}
              <span className="font-semibold text-main-black">TicketFlow</span>{" "}
              will not be liable for any damages, whether direct, indirect,
              incidental, consequential, special, punitive or exemplary arising
              out of or in any way connected with your experience at an event
              paid for via our Platform;
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              In the event that you are dissatisfied with the cancellation or
              quality of an event and you request a refund from the Event
              Organisers, you are only entitled to a full refund of the ticket
              from the Event Organisers and the{" "}
              <span className="font-semibold text-main-black">TicketFlow</span> Fee
              shall not form part of the refund due to you;
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              That the refund option set by the organizers on the event page
              determines whether or not you get a refund from them and how long
              it will take for them to process your refund.{" "}
              <span className="font-semibold text-main-black">TicketFlow</span>{" "}
              will not be liable for a refund in the event where you buy a
              ticket for an event that is set as non-refundable by the
              organizer.
            </p>
          </div>
          <div className="flex-start gap-2">
            <div className="bg-main-black size-2 rounded-full mt-2" />
            <p className="body-text text-main-black/50 w-full">
              In the event you decide not to attend an event after purchase for
              whatever reason,{" "}
              <span className="font-semibold text-main-black">TicketFlow</span>{" "}
              will not be liable for the provision of a refund.
            </p>
          </div>
        </div>
        <p className="body-text text-main-black mt-8">
          you experience any of the circumstances mentioned above, you agree to
          reach out directly to the Event Organiser to discuss your ticket
          refund. If you require any further information on how refund requests
          are handled, reach out to our support team via{" "}
          <span className="font-semibold text-main-black">
            support@useconnect.app
          </span>
        </p>
      </div>
    </main>
  );
}
