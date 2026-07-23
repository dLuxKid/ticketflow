"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import EyeIcon from "@/assets/svg/eye-icon";
import EyeSlashed from "@/assets/svg/eye-slashed";

import { authenticateUser } from "@/utils/actions";

import { toast } from "sonner";
import validator from "validator";
import { setCookie } from "cookies-next";

const initialState = {
  email: "",
  password: "",
};

function LoginForm() {
  const [formData, setFormData] = useState<typeof initialState>(initialState);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewPassword, setViewPassword] = useState<boolean>(false);

  const router = useRouter();
  const params = useSearchParams();

  const validateFormData = () => {
    setIsEmailValid(validator.isEmail(formData.email));
    setIsPasswordValid(formData.password.length >= 8);

    return validator.isEmail(formData.email) && formData.password.length >= 8;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    setFormData((prev) => ({ ...prev, email }));

    if (!isEmailValid) setIsEmailValid(validator.isEmail(email));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value.trim();
    setFormData((prev) => ({ ...prev, password }));

    if (!isPasswordValid) setIsPasswordValid(password.length >= 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) return;
    setLoading(true);

    const result = await authenticateUser(formData, "login");

    if (result.status === "success") {
      toast.success(`Welcome back ${result.data.user.name}`);
      setCookie("jwt", result.token, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      router.push(params.get("next") || "/");
    } else {
      toast.error(result.message);
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex-1 flex-center p-[5%] h-full">
      <div className="flex-start flex-col w-full max-w-lg">
        <div className="flex-start flex-col gap-4">
          <h1 className="text-main-purple sub-title-text">Log In</h1>
          <p className="body-text text-main-black">
            Welcome back to TicketFlow! Please enter your details
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-6 md:mt-8 w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
        >
          <label>
            <p className="text-sm font-semibold text-main-black mb-1">
              Email Address
            </p>
            <input
              type="text"
              name="email"
              className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                !formData.email || isEmailValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.email}
              onChange={handleEmailChange}
              onBlur={() => setIsEmailValid(validator.isEmail(formData.email))}
              disabled={loading}
            />
            {!!formData.email.length && !isEmailValid && (
              <p className="error-text">Email is not valid</p>
            )}
          </label>
          <div>
            <p className="text-sm font-semibold text-main-black mb-1">
              Password
            </p>
            <label className="relative flex flex-shrink-0 w-full">
              <input
                type={viewPassword ? "text" : "password"}
                name="password"
                className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                  !formData.password || isPasswordValid
                    ? "border-main-purple"
                    : "border-red-600"
                }`}
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={() => setIsPasswordValid(formData.password.length >= 8)}
                disabled={loading}
              />
              <span
                className="absolute top-[16.5px] right-4"
                onClick={() => setViewPassword((prev) => !prev)}
              >
                {viewPassword ? <EyeSlashed /> : <EyeIcon />}
              </span>
            </label>
            {!!formData.password.length && !isPasswordValid && (
              <p className="error-text">
                The password must be at least 8 characters long.
              </p>
            )}
          </div>

          <Link href={"/forgot-password"}>
            <p className="text-sm text-main-purple font-medium cursor-pointer -mt-2">
              Forgot password
            </p>
          </Link>

          <Button title="login" disabled={loading}>
            {loading ? <Loader /> : "Log in"}
          </Button>

          <p className="text-sm text-main-black -mt-2 text-center">
            Don&apos;t have an account?{" "}
            <Link href={"/signup"}>
              <span className="text-main-purple cursor-pointer font-medium">
                Sign Up
              </span>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="flex-1 flex-center h-full"><Loader /></div>}>
      <LoginForm />
    </Suspense>
  );
}
