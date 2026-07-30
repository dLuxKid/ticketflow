"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import EyeIcon from "@/assets/svg/eye-icon";
import EyeSlashed from "@/assets/svg/eye-slashed";

import { authenticateUser } from "@/utils/actions";

import { toast } from "sonner";
import validator from "validator";

const initialState = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

const fullNameRegex = /^[a-zA-Z\s\-]+$/;

export default function SignupForm() {
  const [formData, setFormData] = useState<typeof initialState>(initialState);
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(true);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] =
    useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [viewPassword, setViewPassword] = useState<boolean>(false);
  const [viewConfirmPassword, setViewConfirmPassword] =
    useState<boolean>(false);

  const router = useRouter();

  const validateFormData = () => {
    setIsNameValid(
      fullNameRegex.test(formData.name) && formData.name.length >= 4,
    );
    setIsEmailValid(validator.isEmail(formData.email));
    setIsPasswordValid(formData.password.length >= 8);
    setIsConfirmPasswordValid(formData.passwordConfirm === formData.password);

    return (
      validator.isEmail(formData.email) &&
      formData.password.length >= 8 &&
      fullNameRegex.test(formData.name) &&
      formData.name.length >= 4 &&
      formData.passwordConfirm === formData.password
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name }));

    if (!isNameValid)
      setIsNameValid(fullNameRegex.test(name) && name.length >= 4);
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

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const passwordConfirm = e.target.value.trim();
    setFormData((prev) => ({ ...prev, passwordConfirm }));

    if (!isConfirmPasswordValid)
      setIsConfirmPasswordValid(passwordConfirm === formData.password);
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) return;
    setLoading(true);

    const result = await authenticateUser(formData, "signup");

    if (result.status === "success") {
      toast.success(
        `Welcome to the TicketFlow family ${result.data.user.name}`,
      );
      document.cookie = `jwt=${result.token}; path=/; max-age=${
        30 * 24 * 60 * 60
      }; expires=${Date.now() - 30 * 24 * 60 * 60 * 1000}`;

      router.push("/");
    } else {
      toast.error(result.message);
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex-1 flex-center p-[5%] h-full">
      <div className="flex-center flex-col w-full max-w-lg">
        <div className="flex-start flex-col gap-3">
          <h1 className="text-main-purple sub-title-text">
            Sign Up For TicketFlow
          </h1>
          <p className="text-sm md:text-base text-main-black">
            Paint us a picture of who you are, and we&apos;ll craft an
            experience that&apos;s as colorful as your personality
          </p>
        </div>
        <form
          onSubmit={signup}
          className="mt-6 w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
        >
          <label>
            <p className="text-sm font-semibold text-main-black mb-1">
              Fullname
            </p>
            <input
              type="text"
              name="name"
              className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                !formData.name || isNameValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.name}
              onChange={handleNameChange}
              onBlur={() =>
                setIsNameValid(
                  fullNameRegex.test(formData.name) &&
                    formData.name.length >= 4,
                )
              }
              disabled={loading}
            />
            {!!formData.name.length && !isNameValid && (
              <p className="error-text">
                Name must contain only letters and be at least 4 characters
                long.
              </p>
            )}
          </label>
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

          <div>
            <p className="text-sm font-semibold text-main-black mb-1">
              Confirm Password
            </p>
            <label className="relative flex flex-shrink-0 w-full">
              <input
                type={viewConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                  !formData.passwordConfirm || isConfirmPasswordValid
                    ? "border-main-purple"
                    : "border-red-600"
                }`}
                value={formData.passwordConfirm}
                onChange={handleConfirmPasswordChange}
                onBlur={() =>
                  setIsConfirmPasswordValid(
                    formData.passwordConfirm === formData.password,
                  )
                }
                disabled={loading}
              />
              <span
                className="absolute top-[16.5px] right-4"
                onClick={() => setViewConfirmPassword((prev) => !prev)}
              >
                {viewConfirmPassword ? <EyeSlashed /> : <EyeIcon />}
              </span>
            </label>
            {!!formData.passwordConfirm.length && !isConfirmPasswordValid && (
              <p className="error-text">Input must match password above</p>
            )}
          </div>

          <p className="text-sm text-main-black -mt-2 w-full text-start">
            By completing sign up, you agree to TicketFlow&apos;s{" "}
            <span className="text-main-purple cursor-pointer font-medium">
              Terms & Condition
            </span>
          </p>

          <Button title="signup" disabled={loading}>
            {loading ? <Loader /> : "Sign up"}
          </Button>

          <p className="text-sm text-main-black -mt-2 text-center">
            Already have an account?{" "}
            <Link href={"/login"}>
              <span className="text-main-purple cursor-pointer font-medium">
                Log In
              </span>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
