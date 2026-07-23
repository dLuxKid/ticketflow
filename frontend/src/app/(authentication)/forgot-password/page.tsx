"use client";

import { useState } from "react";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import { baseUrl } from "@/utils/urls";

import axios from "axios";
import { toast } from "sonner";
import validator from "validator";

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    setEmail(email);

    if (!isEmailValid) setIsEmailValid(validator.isEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validator.isEmail(email)) return;
    setLoading(true);
    setSuccess(false);

    try {
      const res = await axios({
        method: "POST",
        url: `${baseUrl}/api/v1/users/forgot-password`,
        data: { email },
      });

      if (res.data.status === "success") {
        toast.success("Reset token url has been sent to your email");
        setSuccess(true);
        return setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response.data.message || "Something went wrong");
      return setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex-center p-[5%] h-full">
      <div className="flex-start flex-col w-full max-w-lg">
        <div className="flex-start flex-col gap-4">
          <h1 className="text-main-purple sub-title-text">
            Forgot your Password?
          </h1>
          {success ? (
            <p className="text-sm font-semibold md:text-base text-green-600">
              Log in to your email to view reset token details
            </p>
          ) : (
            <p className="text-sm md:text-base text-main-black">
              Enter your email to receive instructions to reset your password
            </p>
          )}
        </div>
        <form
          action=""
          onSubmit={handleSubmit}
          className="mt-6 md:mt-8 w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
        >
          <label>
            <p className="text-sm font-semibold text-main-black mb-1">
              Enter your email address
            </p>
            <input
              type="text"
              name="email"
              className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                !email || isEmailValid ? "border-main-purple" : "border-red-600"
              }`}
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setIsEmailValid(validator.isEmail(email))}
              disabled={loading}
            />
            {!!email.length && !isEmailValid && (
              <p className="error-text">Email is not valid</p>
            )}
          </label>

          <Button
            title="forgot password"
            className="mt-4"
            disabled={loading || success}
          >
            {loading ? <Loader /> : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
