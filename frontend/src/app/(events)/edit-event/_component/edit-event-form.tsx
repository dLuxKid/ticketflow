// "use client";

// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// import Loader from "@/components/ui/loader";
// import Button from "@/components/ui/submit-btn";

// import { categoriesStyles, timezoneStyles } from "@/styles/react-select.styles";
// import { useQuery } from "@tanstack/react-query";
// import Tippy from "@tippyjs/react";
// import { subDays } from "date-fns";
// // @ts-ignore
// import Geonames from "geonames.js";
// import ReactDatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Select, { SingleValue } from "react-select";
// import { toast } from "sonner";
// import "tippy.js/dist/tippy.css";

// import { categories, timzezones } from "@/assets/data/react-select-options";
// import CloseIcon from "@/assets/svg/close-svg";
// import GlobeIcon from "@/assets/svg/globe";
// import { FaPlus } from "react-icons/fa";

// import { newTicketInfo } from "@/assets/data/create-event-data";
// import AddIcon from "@/assets/svg/add-icon";
// import FacebookWhite from "@/assets/svg/fb-white";
// import GlobeWhite from "@/assets/svg/globe-white";
// import IGWhite from "@/assets/svg/ig-white";
// import InfoIcon from "@/assets/svg/info-icon";
// import XWhite from "@/assets/svg/x-white";
// import YoutubeWhite from "@/assets/svg/yt-white";

// import { updateEvent } from "@/utils/actions";
// import { calculateExcludeDates } from "@/utils/utils";

// const geonames = Geonames({
//   username: "myusername",
//   lan: "en",
//   encoding: "JSON",
// });

// const isTicketInfoFilled = (ticketInfoArray: ticketType[]): boolean => {
//   for (const ticketInfo of ticketInfoArray) {
//     for (const value of Object.values(ticketInfo)) {
//       if (value === "") {
//         return false;
//       }
//     }
//   }
//   return true;
// };

// export default function EditEventForm({ event }: { event: eventData }) {
//   // Events from the DB can be missing nested objects (an invite-only event has no
//   // ticketDetails; older events predate accessMode; some events have no socialMediaLinks).
//   // Merge safe defaults so the form never dereferences an undefined nested field and 500s.
//   const [eventData, setEventData] = useState<eventData>({
//     ...event,
//     accessMode: event.accessMode ?? "public",
//     ticketDetails: event.ticketDetails ?? [],
//     socialMediaLinks: event.socialMediaLinks ?? {
//       twitter: "",
//       instagram: "",
//       youtube: "",
//       facebook: "",
//       others: "",
//     },
//     eventLocation: event.eventLocation ?? {
//       address: "",
//       city: "",
//       postalCode: "",
//       state: "",
//       country: "",
//     },
//   });

//   const { data: countryOptions } = useQuery<CountryOptions[]>({
//     queryKey: ["country"],
//     queryFn: async () => {
//       const response = await geonames.countryInfo({});
//       return response.geonames.map((country: any) => ({
//         label: country.countryName,
//         value: country.countryName,
//         id: country.geonameId,
//         currency: country.currencyCode,
//       }));
//     },
//   });

//   const { data: stateOptions } = useQuery<reactSelectOptions[]>({
//     queryKey: ["states", eventData.eventLocation.country, countryOptions],
//     queryFn: async () => {
//       if (eventData.eventLocation.country && countryOptions) {
//         const selectedCountry = countryOptions.find(
//           (country) => country.value == eventData.eventLocation.country
//         );
//         if (selectedCountry?.id as string) {
//           const states = await geonames.children({
//             geonameId: selectedCountry?.id as string,
//           });

//           return states.geonames.map((state: any) => ({
//             label: state.name,
//             value: state.name.split(" ")[0],
//           }));
//         }
//       }
//     },
//     enabled: !!eventData.eventLocation.country,
//   });

//   const router = useRouter();

//   const [loading, setLoading] = useState<boolean>(false);

//   const [numberOfTickets, setNumberOfTickets] = useState<number>(
//     // Invite-only events have no ticket tiers - start with 0 rows so the ticket section
//     // renders nothing and never dereferences an empty ticketInfo array.
//     eventData.ticketDetails.length ||
//       (eventData.accessMode === "invite_only" ? 0 : 1)
//   );
//   const [ticketInfo, setTicketInfo] = useState<ticketType[]>(
//     eventData.ticketDetails ?? []
//   );

//   const handleTicketInfo = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
//     idx: number
//   ) => {
//     const { name, value } = e.target;

//     const updatedTicketInfo = [...ticketInfo];
//     const currentTicketFieldInFocus = updatedTicketInfo[idx];
//     const updatedTicketField = { ...currentTicketFieldInFocus, [name]: value };
//     updatedTicketInfo[idx] = updatedTicketField;
//     setTicketInfo(updatedTicketInfo);
//     setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
//   };

//   const addTicketInfoInput = () => {
//     setNumberOfTickets((prev) => prev + 1);
//     setTicketInfo((prev) => [...prev, newTicketInfo]);
//   };

//   const removeTicketInfo = (i: number) => {
//     setNumberOfTickets((prev) => prev - 1);
//     const updatedTicketInfo = ticketInfo.filter((_, idx) => idx !== i);

//     setTicketInfo(updatedTicketInfo);
//     setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
//   };

//   const handleSocialMediaLink = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     const newSocialMediaLinks = { ...eventData.socialMediaLinks };
//     if (
//       name === "others" ||
//       name === "facebook" ||
//       name === "twitter" ||
//       name === "instagram" ||
//       name === "facebook"
//     )
//       newSocialMediaLinks[name] = value;

//     setEventData((prev) => ({
//       ...prev,
//       socialMediaLinks: newSocialMediaLinks,
//     }));
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;

//     setEventData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleChangeCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;
//     const selectedFile = e.target.files[0];

//     if (!selectedFile.type.includes("image"))
//       return toast.error("Please select images only");
//     if (selectedFile.size > 10 * 1024 * 1024)
//       return toast.error("Images cannot be larger than 10mb");

//     const reader = new FileReader();
//     reader.readAsDataURL(selectedFile);
//     reader.onload = () => {
//       setEventData((prev) => ({
//         ...prev,
//         coverImage: reader.result as string,
//       }));
//     };
//     reader.onerror = (err) => {
//       console.error(err);
//       return toast.error("An error occured while reading the image");
//     };
//   };

//   const handleChangeAdditonalImages = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     i: number
//   ) => {
//     if (!e.target.files) return;
//     const selectedFile = e.target.files[0];

//     if (!selectedFile.type.includes("image"))
//       return toast.error("Please select images only");
//     if (selectedFile.size > 10 * 1024 * 1024)
//       return toast.error("Images cannot be larger than 10mb");

//     const reader = new FileReader();
//     reader.readAsDataURL(selectedFile);
//     reader.onload = () => {
//       const additionalImgs = [...eventData.otherImages];
//       additionalImgs[i] = reader.result as string;
//       setEventData((prev) => ({
//         ...prev,
//         otherImages: additionalImgs,
//       }));
//     };
//     reader.onerror = (err) => {
//       console.error(err);
//       return toast.error("An error occured while reading the image");
//     };
//   };

//   const handleEventLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     const newEventLocation = { ...eventData.eventLocation };
//     if (name === "address" || name === "city" || name === "postalCode")
//       newEventLocation[name] = value;

//     setEventData((prev) => ({
//       ...prev,
//       eventLocation: newEventLocation,
//     }));
//   };

//   const minDate: Date = new Date();
//   const excludeDates = [
//     minDate,
//     ...Array.from({ length: minDate.getDate() }).map((_, i) =>
//       subDays(minDate, i)
//     ),
//   ];

//   const isInviteOnly = eventData.accessMode === "invite_only";

//   const isAllInputFilled = () => {
//     const base =
//       eventData.eventName &&
//       eventData.startDate &&
//       eventData.startTime &&
//       eventData.endDate &&
//       eventData.endTime &&
//       eventData.timezone &&
//       eventData.eventLocation.address &&
//       eventData.eventLocation.city &&
//       eventData.eventLocation.country &&
//       eventData.eventLocation.state &&
//       eventData.eventCategory &&
//       eventData.eventDescription;

//     // Invite-only events carry no ticket tiers (the backend rejects tiers on one
//     // outright), so sales dates/ticket fields simply don't apply.
//     if (isInviteOnly) return base;

//     return (
//       base &&
//       eventData.ticketDetails.length &&
//       isTicketInfoFilled(eventData.ticketDetails) &&
//       eventData.salesStartDate &&
//       eventData.salesEndDate &&
//       eventData.salesEndTime &&
//       eventData.salesStartTime
//     );
//   };

//   const [isSellingNow, setIsSellingNow] = useState<boolean>(false);

//   const startSelling = () => {
//     const val = isSellingNow;
//     setIsSellingNow((prev) => !prev);
//     if (val) {
//       setEventData((prev) => ({
//         ...prev,
//         salesStartDate: null,
//         salesStartTime: null,
//       }));
//     } else {
//       setEventData((prev) => ({
//         ...prev,
//         salesStartDate: new Date(),
//         salesStartTime: new Date(),
//       }));
//     }
//   };

//   useEffect(() => {
//     setIsSellingNow(
//       new Date(eventData.salesStartDate as Date).getDate() ===
//         new Date().getDate() &&
//         new Date(eventData.salesStartTime as Date).getTime() ===
//           new Date().getTime()
//     );
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isAllInputFilled()) return;
//     setLoading(true);

//     const body = {
//       id: eventData.id,
//       eventName: eventData.eventName,
//       startDate: eventData.startDate,
//       startTime: eventData.startTime,
//       endDate: eventData.endDate,
//       endTime: eventData.endTime,
//       timezone: eventData.timezone,
//       eventDescription: eventData.eventDescription,
//       eventLocation: eventData.eventLocation,
//       eventCategory: eventData.eventCategory,
//       socialMediaLinks: eventData.socialMediaLinks,
//       ticketDetails: eventData.ticketDetails,
//       salesEndDate: eventData.salesEndDate,
//       salesStartDate: eventData.salesStartDate,
//       salesEndTime: eventData.salesEndTime,
//       salesStartTime: eventData.salesStartTime,
//       coverImage: eventData.coverImage,
//       currency: eventData.currency,
//       otherImages: eventData.otherImages,
//       accessMode: eventData.accessMode,
//     };

//     try {
//       const res = await updateEvent(body);

//       if (res.status === "success") {
//         toast.success(res.message);
//         router.push("/my-events");
//       }
//     } catch (error: any) {
//       toast.error(
//         error.response
//           ? error.response.data.message
//           : "Error updating your event"
//       );
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="flex-center flex-col w-full max-w-screen-md gap-4 md:gap-6">
//       <form
//         onSubmit={handleSubmit}
//         className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
//       >
//         <h3 className="text-main-purple sub-title-text capitalize mt-4">
//           Event Details
//         </h3>
//         <div className="w-full">
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Event Name
//           </p>
//           <label>
//             <input
//               title="The name of the event"
//               type="text"
//               name="eventName"
//               className="border border-main-purple rounded-md h-12 w-full px-4 text-main-black placeholder:text-main-black/40 placeholder:text-sm bg-sec-grey"
//               placeholder="Type a descriptive event name...."
//               required
//               value={eventData.eventName}
//               onChange={handleChange}
//             />
//           </label>
//         </div>
//         <div className="w-full">
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Who can attend?
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             {(
//               [
//                 { value: "public", label: "Public", description: "Anyone can find and buy a ticket." },
//                 { value: "invite_only", label: "Invite-only", description: "No public tickets - guest list only." },
//                 { value: "hybrid", label: "Hybrid", description: "Public tickets plus invited guests." },
//               ] as { value: eventData["accessMode"]; label: string; description: string }[]
//             ).map((mode) => (
//               <label
//                 key={mode.value}
//                 className={`cursor-pointer rounded-md border p-4 transition-colors ${
//                   eventData.accessMode === mode.value
//                     ? "border-main-purple bg-main-purple/5"
//                     : "border-main-light-grey bg-sec-grey"
//                 }`}
//               >
//                 <input
//                   type="radio"
//                   name="accessMode"
//                   value={mode.value}
//                   checked={eventData.accessMode === mode.value}
//                   onChange={() =>
//                     setEventData((prev) => ({ ...prev, accessMode: mode.value }))
//                   }
//                   className="sr-only"
//                 />
//                 <span className="block text-sm font-semibold text-main-black">
//                   {mode.label}
//                 </span>
//                 <span className="mt-1 block text-xs text-main-black/70">
//                   {mode.description}
//                 </span>
//               </label>
//             ))}
//           </div>
//         </div>
//         <div className="w-full">
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Event Start
//           </p>
//           <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.startDate as Date)}
//                 placeholderText="Date"
//                 name="startDate"
//                 onChange={(date) => {
//                   if (date)
//                     setEventData((prev) => ({
//                       ...prev,
//                       startDate: date,
//                       endDate: null,
//                     }));
//                 }}
//                 className="bg-transparent text-main-black"
//                 minDate={minDate}
//                 excludeDates={excludeDates}
//               />
//             </label>
//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.startTime as Date)}
//                 placeholderText="Time"
//                 name="startTime"
//                 onChange={(date) => {
//                   if (date) {
//                     setEventData((prev) => ({
//                       ...prev,
//                       startTime: date,
//                     }));
//                   }
//                 }}
//                 showTimeSelect
//                 showTimeSelectOnly
//                 timeIntervals={15}
//                 timeCaption="Time"
//                 dateFormat="h:mm aa"
//                 className="bg-transparent text-main-black"
//               />
//             </label>
//           </div>
//         </div>

//         <div>
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize ">
//             Event End
//           </p>
//           <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.endDate as Date)}
//                 placeholderText="Date"
//                 name="endDate"
//                 onChange={(date) => {
//                   if (date)
//                     setEventData((prev) => ({
//                       ...prev,
//                       endDate: date,
//                     }));
//                 }}
//                 className="bg-transparent text-main-black"
//                 minDate={new Date(eventData.startDate as Date) || minDate}
//                 excludeDates={
//                   new Date(eventData.startDate as Date)
//                     ? excludeDates.slice(
//                         0,
//                         new Date(eventData.startDate as Date).getDate()
//                       )
//                     : excludeDates
//                 }
//               />
//             </label>
//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.endTime as Date)}
//                 placeholderText="Time"
//                 name="endTime"
//                 onChange={(date) => {
//                   if (date)
//                     setEventData((prev) => ({
//                       ...prev,
//                       endTime: date,
//                     }));
//                 }}
//                 showTimeSelect
//                 showTimeSelectOnly
//                 timeIntervals={15}
//                 timeCaption="Time"
//                 dateFormat="h:mm aa"
//                 className="bg-transparent text-main-black"
//               />
//             </label>
//           </div>
//         </div>

//         <div>
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Timezone
//           </p>
//           <label className="relative flex flex-1 flex-shrink-0">
//             <Select
//               styles={timezoneStyles}
//               value={timzezones.find(
//                 (option) => option.value === eventData.timezone || null
//               )}
//               classNamePrefix="select"
//               options={timzezones}
//               onChange={(timezone: SingleValue<reactSelectOptions>) =>
//                 setEventData((prev) => ({
//                   ...prev,
//                   timezone: timezone?.value as string,
//                 }))
//               }
//               isSearchable={true}
//               name="timezone"
//               placeholder="Timezone"
//             />
//             <span className="absolute left-3 bottom-[12px] text-main-white">
//               <GlobeIcon />
//             </span>
//           </label>
//         </div>

//         <div>
//           <label>
//             <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//               Event Description
//             </p>
//             <textarea
//               title="description"
//               name="eventDescription"
//               className="h-40 w-full bg-transparent rounded-md text-main-black p-4 border border-main-purple"
//               value={eventData.eventDescription}
//               onChange={handleChange}
//             />
//           </label>
//         </div>

//         <div>
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Location
//           </p>
//           <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
//             <label>
//               <Select
//                 styles={categoriesStyles}
//                 value={
//                   countryOptions?.find(
//                     (option) => option.value === eventData.eventLocation.country
//                   ) || null
//                 }
//                 classNamePrefix="select"
//                 options={countryOptions}
//                 onChange={(country: SingleValue<CountryOptions>) => {
//                   const newEventLocation = { ...eventData.eventLocation };
//                   if (country) {
//                     newEventLocation.country = country.value;
//                     newEventLocation.state = "";

//                     setEventData((prev) => ({
//                       ...prev,
//                       currency: country.currency,
//                       eventLocation: newEventLocation,
//                     }));
//                   }
//                 }}
//                 isSearchable={true}
//                 name="country"
//                 placeholder="Country"
//               />
//             </label>
//             <label>
//               <Select
//                 styles={categoriesStyles}
//                 value={
//                   stateOptions?.find(
//                     (option) => option.value === eventData.eventLocation.state
//                   ) || null
//                 }
//                 classNamePrefix="select"
//                 options={stateOptions}
//                 onChange={(state: SingleValue<reactSelectOptions>) => {
//                   const newEventLocation = { ...eventData.eventLocation };
//                   newEventLocation.state = state?.value as string;

//                   setEventData((prev) => ({
//                     ...prev,
//                     eventLocation: newEventLocation,
//                   }));
//                 }}
//                 isSearchable={true}
//                 name="state"
//                 placeholder="State/County"
//               />
//             </label>
//             <input
//               name="city"
//               type="text"
//               placeholder="City"
//               className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
//               value={eventData.eventLocation.city}
//               onChange={handleEventLocation}
//             />
//             <input
//               name="postalCode"
//               type="tel"
//               placeholder="Postal Code"
//               className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
//               value={eventData.eventLocation.postalCode}
//               onChange={handleEventLocation}
//             />
//           </div>
//           <label className="bg-transparent rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple mt-4">
//             <input
//               name="address"
//               type="text"
//               placeholder="Fill in address"
//               className="bg-transparent text-main-black placeholder:text-main-black/40"
//               value={eventData.eventLocation.address}
//               onChange={handleEventLocation}
//             />
//           </label>
//         </div>

//         <div>
//           <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//             Category
//           </p>
//           <label>
//             <Select
//               styles={categoriesStyles}
//               value={
//                 categories.find(
//                   (option) => option.value === eventData.eventCategory
//                 ) || null
//               }
//               classNamePrefix="select"
//               options={categories}
//               onChange={(category: SingleValue<reactSelectOptions>) =>
//                 setEventData((prev) => ({
//                   ...prev,
//                   eventCategory: category?.value as string,
//                 }))
//               }
//               isSearchable={true}
//               name="eventCategory"
//               placeholder="Select Category"
//             />
//           </label>
//         </div>

//         <div>
//           <p className="text-sm font-semibold text-main-black mb-2 capitalize">
//             Social media handles
//           </p>
//           <div className="flex-center flex-col w-full gap-4">
//             <label className="flex flex-1 flex-shrink-0 relative w-full">
//               <input
//                 name="twitter"
//                 placeholder="Twitter URL"
//                 type="text"
//                 className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
//                 value={eventData.socialMediaLinks.twitter}
//                 onChange={handleSocialMediaLink}
//               />
//               <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
//                 <XWhite />
//               </span>
//             </label>
//             <label className="flex flex-1 flex-shrink-0 relative w-full">
//               <input
//                 name="instagram"
//                 type="text"
//                 placeholder="Instagram URL"
//                 className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
//                 value={eventData.socialMediaLinks.instagram}
//                 onChange={handleSocialMediaLink}
//               />
//               <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
//                 <IGWhite />
//               </span>
//             </label>
//             <label className="flex flex-1 flex-shrink-0 relative w-full">
//               <input
//                 name="youtube"
//                 type="text"
//                 placeholder="Youtube URL"
//                 className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
//                 value={eventData.socialMediaLinks.youtube}
//                 onChange={handleSocialMediaLink}
//               />
//               <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
//                 <YoutubeWhite />
//               </span>
//             </label>
//             <label className="flex flex-1 flex-shrink-0 relative w-full">
//               <input
//                 name="facebook"
//                 type="text"
//                 placeholder="Facebook URL"
//                 className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
//                 value={eventData.socialMediaLinks.facebook}
//                 onChange={handleSocialMediaLink}
//               />
//               <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
//                 <FacebookWhite />
//               </span>
//             </label>
//             <label className="flex flex-1 flex-shrink-0 relative w-full">
//               <input
//                 name="others"
//                 type="text"
//                 placeholder="Website URL"
//                 className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
//                 value={eventData.socialMediaLinks.others}
//                 onChange={handleSocialMediaLink}
//               />
//               <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
//                 <GlobeWhite />
//               </span>
//             </label>
//           </div>
//         </div>

//         {!isInviteOnly && (
//           <>
//         <div className="flex-between">
//           <h3 className="text-main-purple sub-title-text capitalize mt-4">
//             Add Tickets
//           </h3>
//           <span onClick={addTicketInfoInput} className="cursor-pointer">
//             <AddIcon />
//           </span>
//         </div>

//         <div className="flex gap-4 items-stretch justify-center flex-col">
//           {Array.from({ length: numberOfTickets }).map((_, i) => {
//             // Guard: if the row count ever exceeds the ticketInfo array (e.g. an event
//             // with no tiers), skip rather than dereference undefined and crash the page.
//             if (!ticketInfo[i]) return null;
//             return (
//             <div
//               className="flex flex-col gap-4 md:gap-6 rounded-big border border-main-light-grey bg-main-white p-4 sm:p-6"
//               key={i}
//             >
//               <div className="flex-between border-b border-main-light-grey/60 pb-3">
//                 <span className="inline-flex items-center gap-2 text-sm font-semibold text-main-purple">
//                   <span className="flex-center h-6 w-6 rounded-full bg-main-purple/10 text-xs">
//                     {i + 1}
//                   </span>
//                   Ticket {i + 1}
//                 </span>
//                 {numberOfTickets > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeTicketInfo(i)}
//                     className="text-xs font-medium text-main-error-red"
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//               <div>
//                 <div className="w-full flex items-center justify-between gap-4 mb-1">
//                   <p className="text-sm font-semibold text-main-black capitalize">
//                     Ticket Name
//                   </p>
//                 </div>
//                 <label>
//                   <input
//                     required
//                     title="ticket name"
//                     type="text"
//                     name="ticketName"
//                     className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
//                     value={ticketInfo[i].ticketName}
//                     onChange={(e) => handleTicketInfo(e, i)}
//                   />
//                 </label>
//               </div>
//               <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 <label>
//                   <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//                     quantity
//                   </p>
//                   <input
//                     required
//                     title="ticket quantity"
//                     type="text"
//                     name="ticketQuantity"
//                     className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
//                     value={ticketInfo[i].ticketQuantity}
//                     onChange={(e) => handleTicketInfo(e, i)}
//                   />
//                 </label>
//                 <div>
//                   <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//                     price
//                   </p>
//                   <label className="flex flex-1 flex-shrink-0 relative">
//                     <input
//                       required
//                       title="ticket price"
//                       type="tel"
//                       name="ticketPrice"
//                       className="bg-transparent border border-main-purple rounded-md h-12 w-full pl-16 pr-4 text-main-black"
//                       value={ticketInfo[i].ticketPrice}
//                       onChange={(e) => handleTicketInfo(e, i)}
//                     />
//                     <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-black rounded-l-md flex-center text-main-white body-text">
//                       {eventData.currency}
//                     </span>
//                   </label>
//                 </div>
//               </div>
//               <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 <label>
//                   <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//                     minimum buying limit
//                   </p>
//                   <input
//                     title="minimum buying limit"
//                     type="text"
//                     name="minimumBuyingLimit"
//                     className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
//                     value={ticketInfo[i].minimumBuyingLimit}
//                     onChange={(e) => handleTicketInfo(e, i)}
//                     readOnly
//                   />
//                 </label>
//                 <label>
//                   <p className="text-sm font-semibold text-main-black mb-1 capitalize">
//                     maximum buying limit
//                   </p>
//                   <input
//                     title="maximum buying limit"
//                     type="text"
//                     name="maximumBuyingLimit"
//                     className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
//                     value={ticketInfo[i].maximumBuyingLimit}
//                     onChange={(e) => handleTicketInfo(e, i)}
//                   />
//                 </label>
//               </div>
//             </div>
//             );
//           })}
//         </div>

//         <hr className="h-0.5 rounded-sm w-full bg-transparent" />

//         <div>
//           <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div>
//               <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
//                 Ticket sale start date
//                 <Tippy
//                   content="Sales Start Date is the date your  tickets become available for purchase."
//                   placement="right"
//                   className="!bg-main-white border border-main-purple !text-main-black"
//                   arrow={false}
//                   animation="fade"
//                 >
//                   <button>
//                     <InfoIcon />
//                   </button>
//                 </Tippy>
//               </p>

//               <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//                 <ReactDatePicker
//                   selected={new Date(eventData.salesStartDate as Date)}
//                   placeholderText="Date"
//                   name="salesStartDate"
//                   onChange={(date) => {
//                     if (date)
//                       setEventData((prev) => ({
//                         ...prev,
//                         salesStartDate: date,
//                         salesStartTime: null,
//                         salesEndDate: null,
//                         salesEndTime: null,
//                       }));
//                   }}
//                   className="bg-transparent text-main-black placeholder:text-main-black/40"
//                   minDate={minDate}
//                   excludeDates={calculateExcludeDates(
//                     minDate,
//                     new Date(eventData.startDate as Date)
//                   )}
//                 />
//               </label>
//             </div>
//             <div>
//               <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
//                 Ticket sale start time
//                 <Tippy
//                   content="Sales Start Time is the time your tickets become available for purchase."
//                   placement="right"
//                   className="!bg-main-white border border-main-purple !text-main-black"
//                   arrow={false}
//                   animation="fade"
//                 >
//                   <button>
//                     <InfoIcon />
//                   </button>
//                 </Tippy>
//               </p>
//               <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//                 <ReactDatePicker
//                   selected={new Date(eventData.salesStartTime as Date)}
//                   placeholderText="Time"
//                   name="salesStartTime"
//                   onChange={(date) => {
//                     if (date) {
//                       setEventData((prev) => ({
//                         ...prev,
//                         salesStartTime: date,
//                       }));
//                     }
//                   }}
//                   showTimeSelect
//                   showTimeSelectOnly
//                   timeIntervals={15}
//                   timeCaption="Time"
//                   dateFormat="h:mm aa"
//                   className="bg-transparent text-main-black placeholder:text-main-black/40"
//                 />
//               </label>
//             </div>
//           </div>
//           <div className="flex mt-2 gap-2">
//             <label
//               htmlFor="startnow"
//               className="cursor-pointer flex items-center gap-1"
//             >
//               <input
//                 title="start selling now"
//                 id="startnow"
//                 type="checkbox"
//                 className="cursor-pointer hidden peer"
//                 defaultChecked={isSellingNow}
//                 onChange={startSelling}
//               />
//               <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple h-5 w-5 rounded-sm" />
//               NOW
//             </label>
//           </div>
//         </div>

//         <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
//           <div>
//             <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
//               Ticket sale end date
//               <Tippy
//                 content="Sales End Date is the date your tickets become unavailable for purchase."
//                 placement="right"
//                 className="!bg-main-white border border-main-purple !text-main-black"
//                 arrow={false}
//                 animation="fade"
//               >
//                 <button>
//                   <InfoIcon />
//                 </button>
//               </Tippy>
//             </p>

//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.salesEndDate as Date)}
//                 placeholderText="Date"
//                 name="salesEndDate"
//                 onChange={(date) => {
//                   if (date)
//                     setEventData((prev) => ({
//                       ...prev,
//                       salesEndDate: date,
//                     }));
//                 }}
//                 className="bg-transparent text-main-black placeholder:text-main-black/40"
//                 minDate={new Date(eventData.salesEndDate as Date) || minDate}
//                 excludeDates={calculateExcludeDates(
//                   new Date(eventData.startDate as Date),
//                   new Date(eventData.endDate as Date)
//                 )}
//               />
//             </label>
//           </div>
//           <div>
//             <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
//               Ticket sale end time
//               <Tippy
//                 content="Sales End Time is the time your tickets become unavailable for purchase."
//                 placement="right"
//                 className="!bg-main-white border border-main-purple !text-main-black"
//                 arrow={false}
//                 animation="fade"
//               >
//                 <button>
//                   <InfoIcon />
//                 </button>
//               </Tippy>
//             </p>
//             <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
//               <ReactDatePicker
//                 selected={new Date(eventData.salesEndTime as Date)}
//                 placeholderText="Time"
//                 name="salesEndTime"
//                 onChange={(date) => {
//                   if (date) {
//                     setEventData((prev) => ({
//                       ...prev,
//                       salesEndTime: date,
//                     }));
//                   }
//                 }}
//                 showTimeSelect
//                 showTimeSelectOnly
//                 timeIntervals={15}
//                 timeCaption="Time"
//                 dateFormat="h:mm aa"
//                 className="bg-transparent text-main-black placeholder:text-main-black/40"
//               />
//             </label>
//           </div>
//         </div>
//           </>
//         )}

//         <h3 className="text-main-purple sub-title-text capitalize mt-4">
//           Image Upload
//         </h3>
//         <label
//           htmlFor="coverImg"
//           className="h-60 md:h-96 full flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer rounded-big overflow-hidden"
//         >
//           {eventData.coverImage ? (
//             <Image
//               src={eventData.coverImage}
//               alt="cover image"
//               width={100}
//               height={100}
//               className="w-full h-full object-center"
//             />
//           ) : (
//             <div className="flex-center flex-col gap-2 w-full h-full bg-transparent border border-dashed border-main-purple rounded-big overflow-hidden">
//               <span className="text-3xl text-main-purple font-normal">
//                 <FaPlus />
//               </span>
//               <p className="text-base font-medium text-main-black capitalize">
//                 Add Cover Photos
//               </p>
//             </div>
//           )}
//           <input
//             type="file"
//             id="coverImg"
//             name="coverImg"
//             accept="image/*"
//             className="hidden"
//             onChange={handleChangeCoverImage}
//           />
//         </label>

//         <div>
//           <p className="text-base font-medium text-main-black mb-1">
//             Additional Images
//           </p>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {Array.from({ length: 4 }).map((_, i) => (
//               <label
//                 key={i}
//                 htmlFor={i.toString()}
//                 className="h-24 w-full rounded-sm flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer overflow-hidden"
//               >
//                 {eventData.otherImages[i] ? (
//                   <Image
//                     src={eventData.otherImages[i]}
//                     alt="additional Image"
//                     className="w-full h-full"
//                     width={100}
//                     height={100}
//                   />
//                 ) : (
//                   <div className="flex-center flex-col gap-2 w-full h-full bg-sec-grey border border-dashed border-main-purple rounded-big overflow-hidden">
//                     <span className="text-xl text-main-purple font-normal">
//                       <FaPlus />
//                     </span>
//                   </div>
//                 )}
//                 <input
//                   title="additional image"
//                   type="file"
//                   id={i.toString()}
//                   accept="image/*"
//                   className="hidden"
//                   onChange={(e) => handleChangeAdditonalImages(e, i)}
//                 />
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="max-w-md w-full mt-4 self-center">
//           <Button disabled={loading}>
//             {loading ? <Loader /> : "Update Event"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }




"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import { categoriesStyles, timezoneStyles } from "@/styles/react-select.styles";
import { useQuery } from "@tanstack/react-query";
import Tippy from "@tippyjs/react";
import { subDays } from "date-fns";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select, { SingleValue } from "react-select";
import { toast } from "sonner";
import "tippy.js/dist/tippy.css";

import {
  categories,
  timzezones,
  supportedCurrencies,
} from "@/assets/data/react-select-options";
import CloseIcon from "@/assets/svg/close-svg";
import GlobeIcon from "@/assets/svg/globe";
import { FaPlus } from "react-icons/fa";

import { newTicketInfo } from "@/assets/data/create-event-data";
import AddIcon from "@/assets/svg/add-icon";
import FacebookWhite from "@/assets/svg/fb-white";
import GlobeWhite from "@/assets/svg/globe-white";
import IGWhite from "@/assets/svg/ig-white";
import InfoIcon from "@/assets/svg/info-icon";
import XWhite from "@/assets/svg/x-white";
import YoutubeWhite from "@/assets/svg/yt-white";

import { updateEvent } from "@/utils/actions";
import { calculateExcludeDates } from "@/utils/utils";

const GEONAMES_BASE_URL = "https://secure.geonames.org";

interface GeoNamesCountry {
  countryName: string;
  geonameId: number;
  currencyCode: string;
}

interface GeoNamesCountryOption {
  label: string;
  value: string;
  id: number;
  currency: string;
}

interface GeoNamesState {
  name: string;
  geonameId: number;
}

interface GeoNamesCountryResponse {
  geonames?: GeoNamesCountry[];
  status?: {
    message?: string;
    value?: number;
  };
}

interface GeoNamesChildrenResponse {
  geonames?: GeoNamesState[];
  status?: {
    message?: string;
    value?: number;
  };
}

const getGeoNamesUsername = (): string => {
  const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME;

  if (!username) {
    throw new Error(
      "NEXT_PUBLIC_GEONAMES_USERNAME is missing from your environment variables"
    );
  }

  return username;
};

const fetchGeoNames = async <T,>(endpoint: string): Promise<T> => {
  const response = await fetch(`${GEONAMES_BASE_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`GeoNames request failed with status ${response.status}`);
  }

  const data = (await response.json()) as T & {
    status?: { message?: string };
  };

  if (data.status?.message) {
    throw new Error(data.status.message);
  }

  return data;
};

const isTicketInfoFilled = (ticketInfoArray: ticketType[]): boolean => {
  for (const ticketInfo of ticketInfoArray) {
    for (const value of Object.values(ticketInfo)) {
      if (value === "") {
        return false;
      }
    }
  }
  return true;
};

export default function EditEventForm({ event }: { event: eventData }) {
  // Events from the DB can be missing nested objects (an invite-only event has no
  // ticketDetails; older events predate accessMode; some events have no socialMediaLinks).
  // Merge safe defaults so the form never dereferences an undefined nested field and 500s.
  const [eventData, setEventData] = useState<eventData>({
    ...event,
    accessMode: event.accessMode ?? "public",
    // Events predating the field report undefined; they had networking, so default
    // to on rather than silently switching it off on the next save.
    networkingEnabled: event.networkingEnabled ?? true,
    venueName: event.venueName ?? "",
    dressCode: event.dressCode ?? "",
    parkingInfo: event.parkingInfo ?? "",
    accessibilityInfo: event.accessibilityInfo ?? "",
    ageRestriction: event.ageRestriction ?? "",
    ticketDetails: event.ticketDetails ?? [],
    socialMediaLinks: event.socialMediaLinks ?? {
      twitter: "",
      instagram: "",
      youtube: "",
      facebook: "",
      others: "",
    },
    eventLocation: event.eventLocation ?? {
      address: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    },
  });

  const { data: countryOptions = [] } = useQuery<GeoNamesCountryOption[]>({
    queryKey: ["countries"],
    queryFn: async (): Promise<GeoNamesCountryOption[]> => {
      const username = getGeoNamesUsername();
      const params = new URLSearchParams({
        username,
        lang: "en",
      });

      const data = await fetchGeoNames<GeoNamesCountryResponse>(
        `countryInfoJSON?${params.toString()}`
      );

      return (data.geonames ?? []).map((country) => ({
        label: country.countryName,
        value: country.countryName,
        id: country.geonameId,
        currency: country.currencyCode,
      }));
    },
  });

  const { data: stateOptions = [] } = useQuery<reactSelectOptions[]>({
    queryKey: ["states", eventData.eventLocation.country],
    queryFn: async (): Promise<reactSelectOptions[]> => {
      const selectedCountry = countryOptions.find(
        (country) => country.value === eventData.eventLocation.country
      );

      if (!selectedCountry) {
        return [];
      }

      const username = getGeoNamesUsername();
      const params = new URLSearchParams({
        geonameId: String(selectedCountry.id),
        username,
        lang: "en",
      });

      const data = await fetchGeoNames<GeoNamesChildrenResponse>(
        `childrenJSON?${params.toString()}`
      );

      return (data.geonames ?? []).map((state) => ({
        label: state.name,
        value: state.name,
      }));
    },
    enabled:
      Boolean(eventData.eventLocation.country) && countryOptions.length > 0,
  });

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);

  const [numberOfTickets, setNumberOfTickets] = useState<number>(
    // Invite-only events have no ticket tiers - start with 0 rows so the ticket section
    // renders nothing and never dereferences an empty ticketInfo array.
    eventData.ticketDetails.length ||
      (eventData.accessMode === "invite_only" ? 0 : 1)
  );
  const [ticketInfo, setTicketInfo] = useState<ticketType[]>(
    eventData.ticketDetails ?? []
  );

  const handleTicketInfo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number
  ) => {
    const { name, value } = e.target;

    const updatedTicketInfo = [...ticketInfo];
    const currentTicketFieldInFocus = updatedTicketInfo[idx];
    const updatedTicketField = { ...currentTicketFieldInFocus, [name]: value };
    updatedTicketInfo[idx] = updatedTicketField;
    setTicketInfo(updatedTicketInfo);
    setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
  };

  const addTicketInfoInput = () => {
    setNumberOfTickets((prev) => prev + 1);
    setTicketInfo((prev) => [...prev, newTicketInfo]);
  };

  const removeTicketInfo = (i: number) => {
    setNumberOfTickets((prev) => prev - 1);
    const updatedTicketInfo = ticketInfo.filter((_, idx) => idx !== i);

    setTicketInfo(updatedTicketInfo);
    setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
  };

  const handleSocialMediaLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newSocialMediaLinks = { ...eventData.socialMediaLinks };
    if (
      name === "others" ||
      name === "facebook" ||
      name === "twitter" ||
      name === "instagram" ||
      name === "facebook"
    )
      newSocialMediaLinks[name] = value;

    setEventData((prev) => ({
      ...prev,
      socialMediaLinks: newSocialMediaLinks,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEventData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleEventLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newEventLocation = { ...eventData.eventLocation };
    if (name === "address" || name === "city" || name === "postalCode")
      newEventLocation[name] = value;

    setEventData((prev) => ({
      ...prev,
      eventLocation: newEventLocation,
    }));
  };

  const minDate: Date = new Date();
  const excludeDates = [
    minDate,
    ...Array.from({ length: minDate.getDate() }).map((_, i) =>
      subDays(minDate, i)
    ),
  ];

  const isInviteOnly = eventData.accessMode === "invite_only";

  const isAllInputFilled = () => {
    const base =
      eventData.eventName &&
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime &&
      eventData.timezone &&
      eventData.eventLocation.address &&
      eventData.eventLocation.city &&
      eventData.eventLocation.country &&
      eventData.eventLocation.state &&
      eventData.eventCategory &&
      eventData.eventDescription;

    // Invite-only events carry no ticket tiers (the backend rejects tiers on one
    // outright), so sales dates/ticket fields simply don't apply.
    if (isInviteOnly) return base;

    return (
      base &&
      eventData.ticketDetails.length &&
      isTicketInfoFilled(eventData.ticketDetails) &&
      eventData.salesStartDate &&
      eventData.salesEndDate &&
      eventData.salesEndTime &&
      eventData.salesStartTime
    );
  };

  const [isSellingNow, setIsSellingNow] = useState<boolean>(false);

  const startSelling = () => {
    const val = isSellingNow;
    setIsSellingNow((prev) => !prev);
    if (val) {
      setEventData((prev) => ({
        ...prev,
        salesStartDate: null,
        salesStartTime: null,
      }));
    } else {
      setEventData((prev) => ({
        ...prev,
        salesStartDate: new Date(),
        salesStartTime: new Date(),
      }));
    }
  };

  useEffect(() => {
    setIsSellingNow(
      new Date(eventData.salesStartDate as Date).getDate() ===
        new Date().getDate() &&
        new Date(eventData.salesStartTime as Date).getTime() ===
          new Date().getTime()
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllInputFilled()) return;
    setLoading(true);

    const body = {
      id: eventData.id,
      eventName: eventData.eventName,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
      timezone: eventData.timezone,
      eventDescription: eventData.eventDescription,
      eventLocation: eventData.eventLocation,
      eventCategory: eventData.eventCategory,
      socialMediaLinks: eventData.socialMediaLinks,
      ticketDetails: eventData.ticketDetails,
      salesEndDate: eventData.salesEndDate,
      salesStartDate: eventData.salesStartDate,
      salesEndTime: eventData.salesEndTime,
      salesStartTime: eventData.salesStartTime,
      coverImage: eventData.coverImage,
      currency: eventData.currency,
      otherImages: eventData.otherImages,
      accessMode: eventData.accessMode,
      networkingEnabled: eventData.networkingEnabled,
      venueName: eventData.venueName,
      dressCode: eventData.dressCode,
      parkingInfo: eventData.parkingInfo,
      accessibilityInfo: eventData.accessibilityInfo,
      ageRestriction: eventData.ageRestriction,
    };

    try {
      const res = await updateEvent(body);

      if (res.status === "success") {
        toast.success(res.message);
        router.push("/my-events");
      }
    } catch (error: any) {
      toast.error(
        error.response
          ? error.response.data.message
          : "Error updating your event"
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex-center flex-col w-full max-w-screen-md gap-4 md:gap-6">
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
      >
        <h3 className="text-main-purple sub-title-text capitalize mt-4">
          Event Details
        </h3>
        <div className="w-full">
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Event Name
          </p>
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
        </div>
        <div className="w-full">
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Who can attend?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { value: "public", label: "Public", description: "Anyone can find and buy a ticket." },
                { value: "invite_only", label: "Invite-only", description: "No public tickets - guest list only." },
                { value: "hybrid", label: "Hybrid", description: "Public tickets plus invited guests." },
              ] as { value: eventData["accessMode"]; label: string; description: string }[]
            ).map((mode) => (
              <label
                key={mode.value}
                className={`cursor-pointer rounded-md border p-4 transition-colors ${
                  eventData.accessMode === mode.value
                    ? "border-main-purple bg-main-purple/5"
                    : "border-main-light-grey bg-sec-grey"
                }`}
              >
                <input
                  type="radio"
                  name="accessMode"
                  value={mode.value}
                  checked={eventData.accessMode === mode.value}
                  onChange={() =>
                    setEventData((prev) => ({ ...prev, accessMode: mode.value }))
                  }
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-main-black">
                  {mode.label}
                </span>
                <span className="mt-1 block text-xs text-main-black/70">
                  {mode.description}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="w-full">
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Event Start
          </p>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.startDate as Date)}
                placeholderText="Date"
                name="startDate"
                onChange={(date) => {
                  if (date)
                    setEventData((prev) => ({
                      ...prev,
                      startDate: date,
                      endDate: null,
                    }));
                }}
                className="bg-transparent text-main-black"
                minDate={minDate}
                excludeDates={excludeDates}
              />
            </label>
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.startTime as Date)}
                placeholderText="Time"
                name="startTime"
                onChange={(date) => {
                  if (date) {
                    setEventData((prev) => ({
                      ...prev,
                      startTime: date,
                    }));
                  }
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="bg-transparent text-main-black"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-main-black mb-1 capitalize ">
            Event End
          </p>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.endDate as Date)}
                placeholderText="Date"
                name="endDate"
                onChange={(date) => {
                  if (date)
                    setEventData((prev) => ({
                      ...prev,
                      endDate: date,
                    }));
                }}
                className="bg-transparent text-main-black"
                minDate={new Date(eventData.startDate as Date) || minDate}
                excludeDates={
                  new Date(eventData.startDate as Date)
                    ? excludeDates.slice(
                        0,
                        new Date(eventData.startDate as Date).getDate()
                      )
                    : excludeDates
                }
              />
            </label>
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.endTime as Date)}
                placeholderText="Time"
                name="endTime"
                onChange={(date) => {
                  if (date)
                    setEventData((prev) => ({
                      ...prev,
                      endTime: date,
                    }));
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="bg-transparent text-main-black"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Timezone
          </p>
          <label className="relative flex flex-1 flex-shrink-0">
            <Select
              styles={timezoneStyles}
              value={timzezones.find(
                (option) => option.value === eventData.timezone || null
              )}
              classNamePrefix="select"
              options={timzezones}
              onChange={(timezone: SingleValue<reactSelectOptions>) =>
                setEventData((prev) => ({
                  ...prev,
                  timezone: timezone?.value as string,
                }))
              }
              isSearchable={true}
              name="timezone"
              placeholder="Timezone"
            />
            <span className="absolute left-3 bottom-[12px] text-main-white">
              <GlobeIcon />
            </span>
          </label>
        </div>

        <div>
          <label>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize">
              Event Description
            </p>
            <textarea
              title="description"
              name="eventDescription"
              className="h-40 w-full bg-transparent rounded-md text-main-black p-4 border border-main-purple"
              value={eventData.eventDescription}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Location
          </p>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <label>
              <Select
                styles={categoriesStyles}
                value={
                  countryOptions?.find(
                    (option) => option.value === eventData.eventLocation.country
                  ) || null
                }
                classNamePrefix="select"
                options={countryOptions}
                onChange={(country: SingleValue<GeoNamesCountryOption>) => {
                  const newEventLocation = { ...eventData.eventLocation };
                  if (country) {
                    newEventLocation.country = country.value;
                    newEventLocation.state = "";

                    // Country no longer overwrites the currency on an existing event.
                    // Doing so silently repriced a published event the moment an organiser
                    // corrected its location — and could set it to a currency the payment
                    // provider cannot settle. Currency is its own field below.
                    setEventData((prev) => ({
                      ...prev,
                      eventLocation: newEventLocation,
                    }));
                  }
                }}
                isSearchable={true}
                name="country"
                placeholder="Country"
              />
            </label>
            <label>
              <Select
                styles={categoriesStyles}
                value={
                  stateOptions?.find(
                    (option) => option.value === eventData.eventLocation.state
                  ) || null
                }
                classNamePrefix="select"
                options={stateOptions}
                onChange={(state: SingleValue<reactSelectOptions>) => {
                  const newEventLocation = { ...eventData.eventLocation };
                  newEventLocation.state = state?.value as string;

                  setEventData((prev) => ({
                    ...prev,
                    eventLocation: newEventLocation,
                  }));
                }}
                isSearchable={true}
                name="state"
                placeholder="State/County"
              />
            </label>
            <input
              name="city"
              type="text"
              placeholder="City"
              className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
              value={eventData.eventLocation.city}
              onChange={handleEventLocation}
            />
            <input
              name="postalCode"
              type="tel"
              placeholder="Postal Code"
              className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
              value={eventData.eventLocation.postalCode}
              onChange={handleEventLocation}
            />
          </div>

          <div className="mt-4 max-w-sm">
            <p className="text-sm font-semibold text-main-black mb-1">
              Ticket currency
            </p>
            <Select
              styles={categoriesStyles}
              value={
                supportedCurrencies.find(
                  (option) => option.value === eventData.currency
                ) || null
              }
              classNamePrefix="select"
              options={supportedCurrencies}
              onChange={(currency: SingleValue<reactSelectOptions>) => {
                setEventData((prev) => ({
                  ...prev,
                  currency: currency?.value as string,
                }));
              }}
              isSearchable={true}
              name="currency"
              placeholder="Select currency"
            />
            {/* Changing this on a live event repricies it for future buyers only — tickets
                already sold keep the price and currency stamped at purchase, so past sales
                are never retroactively re-denominated. */}
            <p className="text-xs text-main-black/60 mt-1">
              Applies to tickets sold from now on. Tickets already purchased keep
              the currency they were bought in.
            </p>
          </div>
          <label className="bg-transparent rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple mt-4">
            <input
              name="address"
              type="text"
              placeholder="Fill in address"
              className="bg-transparent text-main-black placeholder:text-main-black/40"
              value={eventData.eventLocation.address}
              onChange={handleEventLocation}
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-main-black mb-1 capitalize">
            Category
          </p>
          <label>
            <Select
              styles={categoriesStyles}
              value={
                categories.find(
                  (option) => option.value === eventData.eventCategory
                ) || null
              }
              classNamePrefix="select"
              options={categories}
              onChange={(category: SingleValue<reactSelectOptions>) =>
                setEventData((prev) => ({
                  ...prev,
                  eventCategory: category?.value as string,
                }))
              }
              isSearchable={true}
              name="eventCategory"
              placeholder="Select Category"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-main-black mb-2 capitalize">
            Social media handles
          </p>
          <div className="flex-center flex-col w-full gap-4">
            <label className="flex flex-1 flex-shrink-0 relative w-full">
              <input
                name="twitter"
                placeholder="Twitter URL"
                type="text"
                className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
                value={eventData.socialMediaLinks.twitter}
                onChange={handleSocialMediaLink}
              />
              <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                <XWhite />
              </span>
            </label>
            <label className="flex flex-1 flex-shrink-0 relative w-full">
              <input
                name="instagram"
                type="text"
                placeholder="Instagram URL"
                className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
                value={eventData.socialMediaLinks.instagram}
                onChange={handleSocialMediaLink}
              />
              <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                <IGWhite />
              </span>
            </label>
            <label className="flex flex-1 flex-shrink-0 relative w-full">
              <input
                name="youtube"
                type="text"
                placeholder="Youtube URL"
                className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
                value={eventData.socialMediaLinks.youtube}
                onChange={handleSocialMediaLink}
              />
              <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                <YoutubeWhite />
              </span>
            </label>
            <label className="flex flex-1 flex-shrink-0 relative w-full">
              <input
                name="facebook"
                type="text"
                placeholder="Facebook URL"
                className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
                value={eventData.socialMediaLinks.facebook}
                onChange={handleSocialMediaLink}
              />
              <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                <FacebookWhite />
              </span>
            </label>
            <label className="flex flex-1 flex-shrink-0 relative w-full">
              <input
                name="others"
                type="text"
                placeholder="Website URL"
                className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
                value={eventData.socialMediaLinks.others}
                onChange={handleSocialMediaLink}
              />
              <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                <GlobeWhite />
              </span>
            </label>
          </div>
        </div>

        {!isInviteOnly && (
          <>
        <div className="flex-between">
          <h3 className="text-main-purple sub-title-text capitalize mt-4">
            Add Tickets
          </h3>
          <span onClick={addTicketInfoInput} className="cursor-pointer">
            <AddIcon />
          </span>
        </div>

        <div className="flex gap-4 items-stretch justify-center flex-col">
          {Array.from({ length: numberOfTickets }).map((_, i) => {
            // Guard: if the row count ever exceeds the ticketInfo array (e.g. an event
            // with no tiers), skip rather than dereference undefined and crash the page.
            if (!ticketInfo[i]) return null;
            return (
            <div
              className="flex flex-col gap-4 md:gap-6 rounded-big border border-main-light-grey bg-main-white p-4 sm:p-6"
              key={i}
            >
              <div className="flex-between border-b border-main-light-grey/60 pb-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-main-purple">
                  <span className="flex-center h-6 w-6 rounded-full bg-main-purple/10 text-xs">
                    {i + 1}
                  </span>
                  Ticket {i + 1}
                </span>
                {numberOfTickets > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicketInfo(i)}
                    className="text-xs font-medium text-main-error-red"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <div className="w-full flex items-center justify-between gap-4 mb-1">
                  <p className="text-sm font-semibold text-main-black capitalize">
                    Ticket Name
                  </p>
                </div>
                <label>
                  <input
                    required
                    title="ticket name"
                    type="text"
                    name="ticketName"
                    className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                    value={ticketInfo[i].ticketName}
                    onChange={(e) => handleTicketInfo(e, i)}
                  />
                </label>
              </div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label>
                  <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                    quantity
                  </p>
                  <input
                    required
                    title="ticket quantity"
                    type="text"
                    name="ticketQuantity"
                    className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                    value={ticketInfo[i].ticketQuantity}
                    onChange={(e) => handleTicketInfo(e, i)}
                  />
                </label>
                <div>
                  <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                    price
                  </p>
                  <label className="flex flex-1 flex-shrink-0 relative">
                    <input
                      required
                      title="ticket price"
                      type="tel"
                      name="ticketPrice"
                      className="bg-transparent border border-main-purple rounded-md h-12 w-full pl-16 pr-4 text-main-black"
                      value={ticketInfo[i].ticketPrice}
                      onChange={(e) => handleTicketInfo(e, i)}
                    />
                    <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-black rounded-l-md flex-center text-main-white body-text">
                      {eventData.currency}
                    </span>
                  </label>
                </div>
              </div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label>
                  <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                    minimum buying limit
                  </p>
                  <input
                    title="minimum buying limit"
                    type="text"
                    name="minimumBuyingLimit"
                    className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                    value={ticketInfo[i].minimumBuyingLimit}
                    onChange={(e) => handleTicketInfo(e, i)}
                    readOnly
                  />
                </label>
                <label>
                  <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                    maximum buying limit
                  </p>
                  <input
                    title="maximum buying limit"
                    type="text"
                    name="maximumBuyingLimit"
                    className="bg-transparent border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                    value={ticketInfo[i].maximumBuyingLimit}
                    onChange={(e) => handleTicketInfo(e, i)}
                  />
                </label>
              </div>
            </div>
            );
          })}
        </div>

        <hr className="h-0.5 rounded-sm w-full bg-transparent" />

        <div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start date
                <Tippy
                  content="Sales Start Date is the date your  tickets become available for purchase."
                  placement="right"
                  className="!bg-main-white border border-main-purple !text-main-black"
                  arrow={false}
                  animation="fade"
                >
                  <button>
                    <InfoIcon />
                  </button>
                </Tippy>
              </p>

              <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
                <ReactDatePicker
                  selected={new Date(eventData.salesStartDate as Date)}
                  placeholderText="Date"
                  name="salesStartDate"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        salesStartDate: date,
                        salesStartTime: null,
                        salesEndDate: null,
                        salesEndTime: null,
                      }));
                  }}
                  className="bg-transparent text-main-black placeholder:text-main-black/40"
                  minDate={minDate}
                  excludeDates={calculateExcludeDates(
                    minDate,
                    new Date(eventData.startDate as Date)
                  )}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start time
                <Tippy
                  content="Sales Start Time is the time your tickets become available for purchase."
                  placement="right"
                  className="!bg-main-white border border-main-purple !text-main-black"
                  arrow={false}
                  animation="fade"
                >
                  <button>
                    <InfoIcon />
                  </button>
                </Tippy>
              </p>
              <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
                <ReactDatePicker
                  selected={new Date(eventData.salesStartTime as Date)}
                  placeholderText="Time"
                  name="salesStartTime"
                  onChange={(date) => {
                    if (date) {
                      setEventData((prev) => ({
                        ...prev,
                        salesStartTime: date,
                      }));
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="bg-transparent text-main-black placeholder:text-main-black/40"
                />
              </label>
            </div>
          </div>
          <div className="flex mt-2 gap-2">
            <label
              htmlFor="startnow"
              className="cursor-pointer flex items-center gap-1"
            >
              <input
                title="start selling now"
                id="startnow"
                type="checkbox"
                className="cursor-pointer hidden peer"
                defaultChecked={isSellingNow}
                onChange={startSelling}
              />
              <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple h-5 w-5 rounded-sm" />
              NOW
            </label>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
              Ticket sale end date
              <Tippy
                content="Sales End Date is the date your tickets become unavailable for purchase."
                placement="right"
                className="!bg-main-white border border-main-purple !text-main-black"
                arrow={false}
                animation="fade"
              >
                <button>
                  <InfoIcon />
                </button>
              </Tippy>
            </p>

            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.salesEndDate as Date)}
                placeholderText="Date"
                name="salesEndDate"
                onChange={(date) => {
                  if (date)
                    setEventData((prev) => ({
                      ...prev,
                      salesEndDate: date,
                    }));
                }}
                className="bg-transparent text-main-black placeholder:text-main-black/40"
                minDate={new Date(eventData.salesEndDate as Date) || minDate}
                excludeDates={calculateExcludeDates(
                  new Date(eventData.startDate as Date),
                  new Date(eventData.endDate as Date)
                )}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
              Ticket sale end time
              <Tippy
                content="Sales End Time is the time your tickets become unavailable for purchase."
                placement="right"
                className="!bg-main-white border border-main-purple !text-main-black"
                arrow={false}
                animation="fade"
              >
                <button>
                  <InfoIcon />
                </button>
              </Tippy>
            </p>
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={new Date(eventData.salesEndTime as Date)}
                placeholderText="Time"
                name="salesEndTime"
                onChange={(date) => {
                  if (date) {
                    setEventData((prev) => ({
                      ...prev,
                      salesEndTime: date,
                    }));
                  }
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="bg-transparent text-main-black placeholder:text-main-black/40"
              />
            </label>
          </div>
        </div>
          </>
        )}

        <h3 className="text-main-purple sub-title-text capitalize mt-4">
          Image Upload
        </h3>
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
          <Button disabled={loading}>
            {loading ? <Loader /> : "Update Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}