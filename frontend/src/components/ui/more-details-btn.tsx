import Button from "./cta-btn";

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

  if (combinedSalesStart > currentDateTime)
    return <Button disabled>Coming soon</Button>;

  if (combinedSalesEnd < currentDateTime)
    return <Button disabled>Sales ended</Button>;

  if (event.totalQuantity <= 1)
    return (
      <button
        type="button"
        disabled
        className="bg-main-white text-main-error-red border-main-error-red border px-6 py-2 md:px-9 md:py-3 text-base rounded-big font-medium"
      >
        Sold out
      </button>
    );

  return <Button title="buy ticket">Buy Ticket</Button>;
}
