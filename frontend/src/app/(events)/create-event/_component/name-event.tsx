import Button from "@/components/ui/submit-btn";

type Props = {
  eventData: eventData;
  setEventData: React.Dispatch<React.SetStateAction<eventData>>;
  nextStep: () => void;
};

export default function NameEvent({
  eventData,
  setEventData,
  nextStep,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventData((prev) => ({ ...prev, eventName: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="flex-center flex-col w-full max-w-screen-sm">
      <h3 className="text-main-black sub-title-text capitalize">
        Give your upcoming event a Name
      </h3>
      <form
        onSubmit={handleSubmit}
        className="mt-6 md:mt-8 w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
      >
        <label>
          <input
            title="The name of the event"
            type="text"
            name="eventName"
            className="border border-main-purple rounded-md h-12 w-full px-4 text-main-black placeholder:text-main-black/40 placeholder:text-sm bg-sec-grey"
            placeholder="Type a descriptive event name...."
            required
            value={eventData.eventName}
            onChange={handleChange}
          />
        </label>

        <Button onClick={handleSubmit} disabled={!eventData.eventName}>
          Continue
        </Button>
      </form>
    </div>
  );
}
