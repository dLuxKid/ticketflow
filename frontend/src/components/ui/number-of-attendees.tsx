import Eclipse from "@/assets/svg/eclipse";
import { formatNumber } from "@/utils/utils";

export default function NumberOfAttendees({ number }: { number: number }) {
  return (
    <div className="relative flex [&>*:nth-child(1)]:-ml-0 [&>*]:-ml-4 mt-1">
      <span className="relative z-0">
        <Eclipse />
      </span>
      <span className="relative z-10">
        <Eclipse />
      </span>
      <span className="relative z-20">
        <Eclipse />
      </span>
      <span className="w-[30px] rounded-[50%] bg-[#C4C4C4] text-main-black relative z-30 flex-center text-xs font-medium">
        {formatNumber(number)}
      </span>
    </div>
  );
}
