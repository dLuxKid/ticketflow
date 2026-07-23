"use client";

import { useState } from "react";

import Loader from "@/components/ui/loader";

import emailjs from "@emailjs/browser";
import { toast } from "sonner";

export default function ContactUsForm() {
  const [formData, setFormData] = useState<{
    email: string;
    subject: string;
    message: string;
    fullname: string;
  }>({ email: "", subject: "", message: "", fullname: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (
      formData.email &&
      formData.fullname &&
      formData.message &&
      formData.subject
    )
      emailjs
        .send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
          formData,
          {
            publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string,
          }
        )
        .then(
          () => {
            toast.success(
              "Thank you for contacting us, your feedback is much appreciated."
            );
            setFormData({ email: "", subject: "", message: "", fullname: "" });
          },
          (error: any) => {
            console.error(error);
            toast.error(error.text || "Error sending your message");
          }
        );

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
    >
      <label>
        <input
          title="fullname"
          type="text"
          name="fullname"
          placeholder="Full name"
          className="bg-sec-grey h-[3.75rem] rounded-[20px] w-full px-4 md:px-6 text-main-black border border-main-purple"
          required
          onChange={handleChange}
          value={formData.fullname}
        />
      </label>
      <label>
        <input
          title="email"
          type="email"
          name="email"
          placeholder="Email"
          className="bg-sec-grey h-[3.75rem] rounded-[20px] w-full px-4 md:px-6 text-main-black border border-main-purple"
          required
          onChange={handleChange}
          value={formData.email}
        />
      </label>
      <label>
        <input
          title="subject of message"
          type="text"
          name="subject"
          placeholder="Subject"
          className="bg-sec-grey h-[3.75rem] rounded-[20px] w-full px-4 md:px-6 text-main-black border border-main-purple"
          required
          onChange={handleChange}
          value={formData.subject}
        />
      </label>
      <label>
        <textarea
          required
          title="message"
          name="message"
          placeholder="Message"
          className="bg-sec-grey h-48 w-full p-4 md:p-6 text-main-black border border-main-purple placeholder:text-main-black rounded-[20px]"
          onChange={handleChange}
          value={formData.message}
        />
      </label>
      <button
        type="submit"
        className="rounded-[2.9375rem] w-full max-w-xl mx-auto px-9 py-3 body-text bg-main-purple flex-center text-main-white"
        disabled={loading}
      >
        {loading ? <Loader /> : "Submit"}
      </button>
    </form>
  );
}
