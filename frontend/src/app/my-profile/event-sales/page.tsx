import Search from "@/components/ui/searchbar";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Event Sales",
};

export default function EventSales() {
  return (
    <Suspense fallback={<div />}>
      <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex-center flex-col gap-4 border-[0.5px] border-main-purple rounded-sm p-4">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
            >
              <circle cx="19" cy="19" r="19" fill="#7036FB" fillOpacity="0.8" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M22.7234 16.4279L17.1513 22L14 18.8487L14.4279 18.4208L17.1513 21.1442L22.2955 16L22.7234 16.4279Z"
                fill="#FDFEFF"
              />
              <rect
                x="10.75"
                y="10.75"
                width="15.6579"
                height="16.5"
                stroke="#FDFEFF"
                strokeWidth="0.5"
              />
            </svg>
          </span>
          <p className="text-base font-semibold">0</p>
          <p className="text-body">Ticket Sold</p>
        </div>
        <div className="flex-center flex-col gap-4 border-[0.5px] border-main-purple rounded-sm p-4">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
            >
              <circle cx="19" cy="19" r="19" fill="#FCECED" />
              <path
                d="M19.3496 19L22 21.6543L21.6543 22L19 19.3496L16.3457 22L16 21.6543L18.6504 19L16 16.3457L16.3457 16L19 18.6504L21.6543 16L22 16.3457L19.3496 19Z"
                fill="#E3414B"
              />
              <rect
                x="10.75"
                y="10.75"
                width="15.6579"
                height="16.5"
                stroke="#E3414B"
                strokeWidth="0.5"
              />
            </svg>
          </span>
          <p className="text-base font-semibold">0</p>
          <p className="text-body">Ticket Available</p>
        </div>
        <div className="flex-center flex-col gap-4 border-[0.5px] border-main-purple rounded-sm p-4">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
            >
              <circle cx="19" cy="19" r="19" fill="#E6F6F1" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M19.7655 19.1485C19.7042 18.9751 19.5907 18.825 19.4405 18.7189C19.2904 18.6127 19.1111 18.5557 18.9272 18.5557V18.3335H18.4827V18.5557C18.2469 18.5557 18.0208 18.6494 17.8541 18.8161C17.6874 18.9828 17.5938 19.2089 17.5938 19.4447C17.5938 19.6805 17.6874 19.9066 17.8541 20.0733C18.0208 20.24 18.2469 20.3337 18.4827 20.3337V21.2226C18.2894 21.2226 18.1247 21.0993 18.0633 20.9264C18.0542 20.8981 18.0396 20.8719 18.0202 20.8494C18.0008 20.8269 17.9771 20.8085 17.9504 20.7953C17.9238 20.7821 17.8948 20.7744 17.8651 20.7726C17.8355 20.7708 17.8058 20.775 17.7777 20.7849C17.7497 20.7948 17.724 20.8102 17.702 20.8302C17.6801 20.8503 17.6624 20.8745 17.6499 20.9015C17.6375 20.9285 17.6306 20.9577 17.6297 20.9874C17.6287 21.0171 17.6337 21.0467 17.6444 21.0744C17.7057 21.2477 17.8193 21.3978 17.9694 21.504C18.1195 21.6101 18.2989 21.6671 18.4827 21.6671V21.8893H18.9272V21.6671C19.163 21.6671 19.3891 21.5734 19.5558 21.4067C19.7225 21.24 19.8162 21.0139 19.8162 20.7781C19.8162 20.5424 19.7225 20.3163 19.5558 20.1496C19.3891 19.9828 19.163 19.8892 18.9272 19.8892V19.0002C19.0191 19.0002 19.1088 19.0287 19.1838 19.0817C19.2589 19.1348 19.3157 19.2098 19.3463 19.2965C19.366 19.352 19.4069 19.3976 19.4601 19.423C19.4864 19.4356 19.5149 19.4428 19.5441 19.4444C19.5732 19.446 19.6024 19.4418 19.6299 19.432C19.6574 19.4223 19.6828 19.4073 19.7045 19.3878C19.7262 19.3682 19.7438 19.3447 19.7564 19.3183C19.769 19.292 19.7763 19.2634 19.7779 19.2343C19.7794 19.2051 19.7752 19.176 19.7655 19.1485ZM18.4827 19.0002C18.3648 19.0002 18.2518 19.047 18.1684 19.1304C18.0851 19.2138 18.0382 19.3268 18.0382 19.4447C18.0382 19.5626 18.0851 19.6756 18.1684 19.759C18.2518 19.8424 18.3648 19.8892 18.4827 19.8892V19.0002ZM18.9272 21.2226C19.0451 21.2226 19.1581 21.1758 19.2415 21.0924C19.3248 21.0091 19.3717 20.896 19.3717 20.7781C19.3717 20.6603 19.3248 20.5472 19.2415 20.4638C19.1581 20.3805 19.0451 20.3337 18.9272 20.3337V21.2226Z"
                fill="#136446"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.2945 15.5825C16.8399 15.3156 17.7346 15 18.7138 15C19.6726 15 20.5438 15.3025 21.0863 15.5658L21.1169 15.5807C21.2805 15.6616 21.4125 15.7381 21.5054 15.8001L20.6844 17.0002C22.577 18.935 24.0389 23 18.7138 23C13.3887 23 14.8113 19.0088 16.7203 17.0002L15.9047 15.8001C15.9676 15.759 16.0474 15.7112 16.1425 15.6605C16.1896 15.6352 16.2403 15.6089 16.2945 15.5825ZM20.1568 16.9844L20.814 16.0236C20.2028 16.0676 19.4757 16.2112 18.7756 16.4139C18.2756 16.5584 17.72 16.5364 17.2055 16.4415C17.0758 16.4174 16.9471 16.3888 16.8195 16.3557L17.2462 16.9839C18.1607 17.3095 19.2421 17.3095 20.1568 16.9844ZM16.9895 17.3624C18.0596 17.7758 19.3457 17.7758 20.4158 17.362C20.8624 17.8328 21.2361 18.3679 21.5243 18.9494C21.8248 19.5624 21.9883 20.1751 21.9617 20.7031C21.9359 21.2127 21.7354 21.6481 21.2776 21.9717C20.8005 22.3088 19.9979 22.5555 18.7136 22.5555C17.4279 22.5555 16.6217 22.3131 16.1401 21.9797C15.6789 21.6603 15.4765 21.2307 15.4478 20.728C15.4178 20.2058 15.5778 19.5962 15.8772 18.979C16.1627 18.3905 16.5612 17.824 16.9895 17.3624ZM16.7339 15.8703C16.9117 15.9232 17.0975 15.9692 17.2859 16.0041C17.7638 16.0921 18.2429 16.105 18.6518 15.9865C19.1284 15.8477 19.613 15.7385 20.1031 15.6596C19.6941 15.5365 19.2159 15.4445 18.7136 15.4445C17.948 15.4445 17.2339 15.6581 16.7339 15.8703Z"
                fill="#136446"
              />
              <rect
                x="10.75"
                y="10.75"
                width="15.6579"
                height="16.5"
                stroke="#136446"
                strokeWidth="0.5"
              />
            </svg>
          </span>
          <p className="text-base font-semibold">0</p>
          <p className="text-body">Gross Sales</p>
        </div>
      </div>
      <div className="border-[0.5px] border-main-purple rounded-sm p-4">
        <div className="flex-between gap-4 w-full">
          <div className="flex gap-4">
            <div className="flex">
              <Search
                placeholder="Search Name or Email"
                className="w-full max-w-sm bg-sec-grey border border-main-purple text-main-black text-sm placeholder:text-sm placeholder:text-main-black h-12 rounded-sm pl-8 pr-3"
              />
            </div>
          </div>
          <div className="flex-center gap-2 border border-main-purple px-4 h-12 rounded-sm">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M7 10.577L3.462 7.038L4.169 6.319L6.5 8.65V0H7.5V8.65L9.83 6.32L10.538 7.038L7 10.577ZM0 14V9.962H1V13H13V9.962H14V14H0Z"
                  fill="#1F1F1F"
                />
              </svg>
            </span>
            <p className="text-xs font-normal text-main-black/50">Export</p>
          </div>
        </div>
        <div className="mt-8 w-full">
          <div className="md:hidden">
            <div className="mb-2 w-full rounded-md bg-white">
              <div className="flex w-full items-center justify-between py-2 border-b pb-2">
                <div>
                  <p className="text-lg font-medium">John Doe</p>
                  <p>johndoe@gmail.com</p>
                  <p className="text-sm text-gray-500">Regular (1)</p>
                </div>
                <div className="flex justify-end gap-2">
                  <div className="h-4 w-4 rounded-sm border border-main-purple bg-transparent" />
                </div>
              </div>
            </div>
          </div>

          <table className="hidden min-w-full text-main-black md:table">
            <thead className="rounded-big text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">
                  <div className="h-4 w-4 rounded-sm border border-main-purple bg-transparent" />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ticket Qty
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ticket Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-main-white text-left">
              <tr className="w-full border-b py-3 text-sm cursor-pointer last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                <td className="whitespace-nowrap py-3 px-3">
                  <div className="h-4 w-4 rounded-sm border border-main-purple bg-transparent" />
                </td>
                <td className="whitespace-nowrap px-3 py-3">John Doe</td>
                <td className="whitespace-nowrap px-3 py-3">
                  johndoe@gmail.com
                </td>
                <td className="whitespace-nowrap px-3 py-3">1</td>
                <td className="whitespace-nowrap py-3 px-3">regular</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </Suspense>
  );
}
