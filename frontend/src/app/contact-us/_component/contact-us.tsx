"use client";

import { useState } from "react";

import Loader from "@/components/ui/loader";

import emailjs from "@emailjs/browser";
import { toast } from "sonner";

/**
 * Contact form.
 *
 * Fields carry real <label>s rather than placeholders alone. A placeholder disappears the
 * moment someone starts typing and is not reliably announced by assistive technology, so a
 * placeholder-only field fails WCAG 3.3.2 Labels or Instructions.
 *
 * The submit handler now awaits the send and clears `loading` in a `finally`. It previously
 * fired the request without awaiting it and cleared the flag on a fixed 1s timer, so the
 * button could return to its idle state while the request was still in flight - and a send
 * that failed after that second showed an error against an apparently-idle form.
 */

const FIELD =
  "w-full rounded-xl border border-main-light-grey bg-main-grey-bg px-4 py-3 text-main-black transition-colors placeholder:text-sec-black/45 hover:border-main-purple/30 focus:border-main-purple/50 focus:bg-main-white focus:outline-none focus:ring-2 focus:ring-main-purple/20";

const LABEL = "mb-1.5 block text-sm font-semibold text-main-black";

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
    if (loading) return;
    setLoading(true);

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
        formData,
        { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string },
      );
      toast.success(
        "Thank you for contacting us, your feedback is much appreciated.",
      );
      setFormData({ email: "", subject: "", message: "", fullname: "" });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.text || "Error sending your message");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-main-black">Send us a message</h2>
        <p className="mt-1 text-sm text-sec-black/70">
          All fields are required.
        </p>
      </div>

      <div>
        <label htmlFor="fullname" className={LABEL}>
          Full name
        </label>
        <input
          id="fullname"
          type="text"
          name="fullname"
          autoComplete="name"
          placeholder="Ada Lovelace"
          className={FIELD}
          required
          onChange={handleChange}
          value={formData.fullname}
        />
      </div>

      <div>
        <label htmlFor="email" className={LABEL}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={FIELD}
          required
          onChange={handleChange}
          value={formData.email}
        />
      </div>

      <div>
        <label htmlFor="subject" className={LABEL}>
          Subject
        </label>
        <input
          id="subject"
          type="text"
          name="subject"
          placeholder="What is this about?"
          className={FIELD}
          required
          onChange={handleChange}
          value={formData.subject}
        />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us how we can help…"
          className={`${FIELD} resize-y`}
          required
          onChange={handleChange}
          value={formData.message}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-main-purple text-base font-semibold text-main-white shadow-lg shadow-main-purple/25 transition-all hover:-translate-y-0.5 hover:bg-main-purple/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader /> : "Send message"}
      </button>
    </form>
  );
}
