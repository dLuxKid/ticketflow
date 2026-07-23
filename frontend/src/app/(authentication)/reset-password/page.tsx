"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import EyeIcon from "@/assets/svg/eye-icon";
import EyeSlashed from "@/assets/svg/eye-slashed";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import { baseUrl } from "@/utils/urls";
import axios from "axios";
import { toast } from "sonner";

const initialState = {
  password: "",
  passwordConfirm: "",
};

function ResetPasswordForm() {
  const [formData, setFormData] = useState<typeof initialState>(initialState);

  const [viewPassword, setViewPassword] = useState<boolean>(false);
  const [viewConfirmPassword, setViewConfirmPassword] =
    useState<boolean>(false);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(true);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] =
    useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const params = useSearchParams();
  const router = useRouter();

  const validateFormData = () => {
    setIsPasswordValid(formData.password.length >= 8);
    setIsConfirmPasswordValid(formData.passwordConfirm === formData.password);

    return (
      formData.password.length >= 8 &&
      formData.passwordConfirm === formData.password
    );
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value.trim();
    setFormData((prev) => ({ ...prev, password }));

    if (!isPasswordValid) setIsPasswordValid(password.length >= 8);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const passwordConfirm = e.target.value.trim();
    setFormData((prev) => ({ ...prev, passwordConfirm }));

    if (!isConfirmPasswordValid)
      setIsConfirmPasswordValid(passwordConfirm === formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) return;

    const resetToken = params.get("token");
    if (!resetToken) return toast.error("Reset token not found");

    setLoading(true);

    try {
      const res = await axios({
        method: "PATCH",
        url: `${baseUrl}/api/v1/users/reset-password/${resetToken}`,
        data: formData,
      });

      if (res.data.status === "success") {
        toast.success(res.data.message);
        router.push("/login");
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
        <div className="flex-start flex-col gap-2">
          <h1 className="text-main-purple sub-title-text">
            Reset your password
          </h1>
          <p className="text-sm md:text-base text-main-black">
            Enter a new password
          </p>
        </div>
        <form
          // action=""
          onSubmit={handleSubmit}
          className="mt-6 md:mt-8 w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
        >
          <div>
            <p className="text-sm font-semibold text-main-black mb-1">
              Password
            </p>
            <label className="relative flex flex-shrink-0 w-full">
              <input
                type={viewPassword ? "text" : "password"}
                className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                  !formData.password || isPasswordValid
                    ? "border-main-purple"
                    : "border-red-600"
                }`}
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={() => setIsPasswordValid(formData.password.length >= 8)}
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
                className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                  !formData.passwordConfirm || isConfirmPasswordValid
                    ? "border-main-purple"
                    : "border-red-600"
                }`}
                value={formData.passwordConfirm}
                onChange={handleConfirmPasswordChange}
                onBlur={() =>
                  setIsConfirmPasswordValid(
                    formData.passwordConfirm === formData.password
                  )
                }
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

          <Button title="reset password" disabled={loading}>
            {loading ? <Loader /> : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex-center h-full"><Loader /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
