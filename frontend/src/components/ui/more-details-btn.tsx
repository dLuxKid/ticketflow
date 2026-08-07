import Button from "./cta-btn";

/**
 * The card's call to action, which doubles as its status indicator: whether tickets are on
 * sale, not yet open, closed, or gone is expressed by this one control rather than by a
 * separate badge that could contradict it.
 *
 * Sized down from the default button because it sits inside a card, not on a page.
 */

// Compact override for card context - appended, so it wins over the default padding.
const compact = "px-4 py-2 md:px-5 md:py-2.5 text-sm rounded-full";

export default function MoreDetailsBtn({ event }: { event: AllEventData }) {
  const currentDateTime = new Date();
  const salesStartDate = new Date(event.salesStartDate);
  const salesStartTime = new Date(event.salesStartTime);
  const salesEndDate = new Date(event.salesEndDate);
  const salesEndTime = new Date(event.salesEndTime);

  const combinedSalesStart = new Date(salesStartDate);
  combinedSalesStart.setHours(salesStartTime.getHours());
  combinedSalesStart.setMinutes(salesStartTime.getMinutes());
  const combinedSalesEnd = new Date(salesEndDate);
  combinedSalesEnd.setHours(salesEndTime.getHours());
  combinedSalesEnd.setMinutes(salesEndTime.getMinutes());

  // Muted treatment for the three unavailable states: they are information, not invitations,
  // so they should not carry the same visual weight as a live "Buy Ticket".
  const muted = `${compact} bg-main-grey-bg text-sec-black/70 hover:bg-main-grey-bg`;

  if (combinedSalesStart > currentDateTime)
    return (
      <Button disabled className={muted}>
        Coming soon
      </Button>
    );

  if (combinedSalesEnd < currentDateTime)
    return (
      <Button disabled className={muted}>
        Sales ended
      </Button>
    );

  if (event.totalQuantity <= 1)
    return (
      <Button
        disabled
        className={`${compact} border border-main-error-red/30 bg-main-error-red/[0.06] text-main-error-red hover:bg-main-error-red/[0.06]`}
      >
        Sold out
      </Button>
    );

  return (
    <Button
      title="buy ticket"
      className={`${compact} shadow-md shadow-main-purple/25 group-hover:shadow-lg group-hover:shadow-main-purple/30`}
    >
      Buy Ticket
    </Button>
  );
}
