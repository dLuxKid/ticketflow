import Link from "next/link";

import Button from "@/components/ui/submit-btn";

import SuccessIcon from "@/assets/svg/successful";

import CloseIcon from "@/assets/svg/close-svg";
import FacebookIcon from "@/assets/svg/fb-color";
import Chain from "@/assets/svg/link";
import LinkedinSvg from "@/assets/svg/linkedin";
import Telegram from "@/assets/svg/telegram";
import XIcon from "@/assets/svg/x-icon";
import {
  FacebookShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import slugify from "react-slugify";
import { toast } from "sonner";
import { useState } from "react";

type Props = {
  event: eventData;
};

export default function Success({ event }: Props) {
  const [showShareEvent, setShowShareEvent] = useState<boolean>(false);

  const url = `${window.location.origin}/explore-events/${slugify(
    event.eventName
  )}`;
  const title = `Hello friends, ${event.eventName} is live and ready to go, check it out:`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Event Link copied to clipboard");
  };

  return (
    <div className="relative flex-center flex-col gap-8 p-[5%]">
      <div className="bg-main-white rounded-[1.25rem] p-4 md:px-12 md:py-6 w-full max-w-xl flex-col gap-6 flex-center">
        <span>
          <SuccessIcon />
        </span>
        <h3 className="sub-title-text text-main-purple -mt-4">Successful</h3>
        <p className="body-text text-center text-main-black/50">
          We are delighted to inform you that your event, {event.eventName} has
          been published! Thank you for choosing to be a part of this exciting
          event.
        </p>
        <Link
          href={`/explore-events/${slugify(event.eventName)}`}
          className="w-full"
        >
          <Button>View Event</Button>
        </Link>

        <p
          className="body-text text-main-purple underline cursor-pointer"
          onClick={() => setShowShareEvent(true)}
        >
          Share Event
        </p>
      </div>
      {showShareEvent && (
        <div className="bg-main-white rounded-[1.25rem] w-full max-w-xl">
          <div className="p-4 md:p-6 flex-between w-full gap-4 border-b border-b-[#141619]/20">
            <h1 className="sub-title-text text-main-black">Share Event</h1>
            <span
              className="cursor-pointer"
              onClick={() => setShowShareEvent(false)}
            >
              <CloseIcon />
            </span>
          </div>
          <div className="p-4 md:p-6 flex flex-col gap-4">
            <p className="body-text text-black">Share this link via</p>
            <div className="flex-start flex-wrap gap-4 md:gap-6">
              <TwitterShareButton url={url} title={title}>
                <XIcon />
              </TwitterShareButton>
              <WhatsappShareButton url={url} title={title}>
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>
              <LinkedinShareButton url={url} title={title}>
                <LinkedinSvg />
              </LinkedinShareButton>
              <TelegramShareButton url={url}>
                <Telegram />
              </TelegramShareButton>
              <FacebookShareButton url={url}>
                <FacebookIcon />
              </FacebookShareButton>
            </div>
            <p className="body-text text-black">Or copy link</p>
            <div className="w-full flex items-center rounded-sm gap-2 relative border border-main-purple p-2 overflow-hidden">
              <span>
                <Chain />
              </span>
              <p className="body-text w-full truncate">{url}</p>
              <span
                className="-right-[1px] -top-[1px] -bottom-[1px] px-6 cursor-pointer absolute bg-main-purple rounded-sm flex-center text-main-white body-text"
                onClick={copyLink}
              >
                Copy
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
