import Switch from "@/components/ui/switch";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Preferences",
};

export default function GeneralPreferences() {
  const style = "bg-main-purple/10 p-2 sm:p-4 md:py-6 md:pr-6 rounded-big";

  return (
    <div className="flex flex-col gap-6 items-stretch w-full p-2 sm:p-4 md:p-0">
      <div className={style}>
        <div className="flex-between flex-wrap mb-2 gap-2">
          <h3 className="text-base md:text-lg font-semibold text-main-black mb-1">
            Notification
          </h3>
          <Switch />
        </div>
        <p className="text-sm md:text-base text-main-black wrap-break-word">
          Recieve notification on latest events around you
        </p>
      </div>
      <div className={style}>
        <div className="flex-between flex-wrap gap-2">
          <h3 className="text-base md:text-lg font-semibold text-main-black">
            Copy events to calendar
          </h3>
          <Switch />
        </div>
      </div>
      <div className={style}>
        <div className="flex-between flex-wrap mb-2 gap-2">
          <h3 className="text-base md:text-lg font-semibold text-main-black mb-1">
            Privacy Control
          </h3>
          <Switch />
        </div>
        <p className="text-sm md:text-base text-main-black wrap-break-word">
          Permissions for accessing personal information
        </p>
      </div>
    </div>
  );
}
