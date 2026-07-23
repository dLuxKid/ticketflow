type Props = {
  CreateEventStatus: {
    [key: string]: { step: string; component: React.ReactNode };
  };
  createEventStep: createEventStatusType;
};

export default function ProgressBar({
  CreateEventStatus,
  createEventStep,
}: Props) {
  return (
    <div className="flex-center mt-4 gap-4 w-full">
      {Object.keys(CreateEventStatus).map((number) => (
        <div
          className={`items-center justify-center [&>span]:last:hidden ${
            createEventStep == number ? "flex" : "hidden nav:flex"
          }`}
          key={number}
        >
          <p
            className={`
            ${
              createEventStep >= number
                ? "bg-main-purple text-main-white"
                : "bg-main-light-grey text-black"
            }
             w-6 h-6 rounded-full text-xs font-medium flex-center`}
          >
            {number}
          </p>
          <p
            className={`text-sm md:text-base font-medium ml-2 ${
              createEventStep >= number ? "text-main-purple" : "text-sec-black"
            }`}
          >
            {CreateEventStatus[number].step}
          </p>
          <span
            className={`h-0 nav:h-1 w-0 nav:w-12 lg:w-24 rounded-sm ml-4 ${
              Number(createEventStep) - 1 >= Number(number)
                ? "bg-main-purple"
                : "bg-main-light-grey"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
