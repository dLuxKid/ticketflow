import { IoMdArrowRoundBack } from "react-icons/io";

interface Props extends React.ComponentPropsWithoutRef<"div"> {}

export default function GoBack({ ...props }: Props) {
  return (
    <div
      {...props}
      className="absolute left-[5%] top-4 cursor-pointer flex items-center gap-1 justify-center text-black hover:text-main-purple font-semibold"
    >
      <IoMdArrowRoundBack />
      <p className="text-base">back</p>
    </div>
  );
}
