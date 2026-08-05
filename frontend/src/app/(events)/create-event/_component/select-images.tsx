import Image from "next/image";

import { FaPlus } from "react-icons/fa6";

import Button from "@/components/ui/submit-btn";

import { toast } from "sonner";

type Props = {
  eventData: eventData;
  setEventData: React.Dispatch<React.SetStateAction<eventData>>;
  nextStep: () => void;
};

export default function SelectImages({
  eventData,
  setEventData,
  nextStep,
}: Props) {
  const handleChangeCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (!selectedFile.type.includes("image"))
      return toast.error("Please select images only");
    if (selectedFile.size > 10 * 1024 * 1024)
      return toast.error("Images cannot be larger than 10mb");

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      setEventData((prev) => ({
        ...prev,
        coverImage: reader.result as string,
      }));
    };
    reader.onerror = (err) => {
      console.error(err);
      return toast.error("An error occured while reading the image");
    };
  };

  const handleChangeAdditonalImages = (
    e: React.ChangeEvent<HTMLInputElement>,
    i: number
  ) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (!selectedFile.type.includes("image"))
      return toast.error("Please select images only");
    if (selectedFile.size > 10 * 1024 * 1024)
      return toast.error("Images cannot be larger than 10mb");

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      const additionalImgs = [...eventData.otherImages];
      additionalImgs[i] = reader.result as string;
      setEventData((prev) => ({
        ...prev,
        otherImages: additionalImgs,
      }));
    };
    reader.onerror = (err) => {
      console.error(err);
      return toast.error("An error occured while reading the image");
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventData.coverImage) {
      nextStep();
    }
  };

  return (
    <div className="flex-center flex-col w-full max-w-screen-md">
      <h3 className="text-main-black sub-title-text capitalize">
        Image Upload
      </h3>
      <form
        className="mt-6 md:mt-8 w-full flex items-stretch justify-center flex-col gap-6 md:gap-8"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor="coverImg"
          className="h-60 md:h-96 full flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer rounded-big overflow-hidden"
        >
          {eventData.coverImage ? (
            <Image
              src={eventData.coverImage}
              alt="cover image"
              width={100}
              height={100}
              className="w-full h-full object-center"
            />
          ) : (
            <div className="flex-center flex-col gap-2 w-full h-full bg-transparent border border-dashed border-main-purple rounded-big overflow-hidden">
              <span className="text-3xl text-main-purple font-normal">
                <FaPlus />
              </span>
              <p className="text-base font-medium text-main-black capitalize">
                Add Cover Photos
              </p>
            </div>
          )}
          <input
            type="file"
            id="coverImg"
            name="coverImg"
            accept="image/*"
            className="hidden"
            onChange={handleChangeCoverImage}
          />
        </label>

        <div>
          <p className="text-base font-medium text-main-black mb-1">
            Additional Images
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <label
                key={i}
                htmlFor={i.toString()}
                className="h-24 w-full rounded-sm flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer overflow-hidden"
              >
                {eventData.otherImages[i] ? (
                  <Image
                    src={eventData.otherImages[i]}
                    alt="additional Image"
                    className="w-full h-full"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div className="flex-center flex-col gap-2 w-full h-full bg-sec-grey border border-dashed border-main-purple rounded-big overflow-hidden">
                    <span className="text-xl text-main-purple font-normal">
                      <FaPlus />
                    </span>
                  </div>
                )}
                <input
                  title="additional image"
                  type="file"
                  id={i.toString()}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleChangeAdditonalImages(e, i)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="max-w-md w-full mt-4 self-center">
          <Button disabled={!eventData.coverImage} onClick={handleSubmit}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
