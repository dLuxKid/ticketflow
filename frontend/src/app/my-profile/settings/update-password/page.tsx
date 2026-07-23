"use client";

import { useState } from "react";

import EyeIcon from "@/assets/svg/eye-icon";
import EyeSlashed from "@/assets/svg/eye-slashed";
import Button from "@/components/ui/cta-btn";
import Loader from "@/components/ui/loader";

import { updateUserDetails } from "@/utils/actions";
import { toast } from "sonner";

export default function UpdatePassword() {
  const [viewPassword, setViewPassword] = useState<boolean>(false);
  const [viewNewPassword, setViewNewPassword] = useState<boolean>(false);
  const [viewConfirmNewPassword, setViewConfirmNewPassword] =
    useState<boolean>(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    password: "",
    passwordConfirm: "",
  });
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] =
    useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const handlePrevPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentPassword = e.target.value.trim();
    setFormData((prev) => ({ ...prev, currentPassword }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value.trim();
    setFormData((prev) => ({ ...prev, password }));
    setIsPasswordValid(password.length >= 8);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const passwordConfirm = e.target.value.trim();
    setFormData((prev) => ({ ...prev, passwordConfirm }));
    setIsConfirmPasswordValid(passwordConfirm === formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateUserDetails(formData, "password");

    if (result.status === "success") {
      toast.success("Updated password successfully");
      return setLoading(false);
    } else {
      toast.error("Error updating your password");
      return setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-0">
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
      >
        <div>
          <p className="text-sm font-semibold text-main-black mb-1">
            Current Password
          </p>
          <label className="relative flex flex-shrink-0 w-full">
            <input
              type={viewPassword ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handlePrevPasswordChange}
              className="bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border border-main-purple"
            />
            <span
              className="absolute top-[16.5px] right-4 cursor-pointer"
              onClick={() => setViewPassword((prev) => !prev)}
            >
              {viewPassword ? <EyeSlashed /> : <EyeIcon />}
            </span>
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-main-black mb-1">
            New Password
          </p>
          <label className="relative flex flex-shrink-0 w-full">
            <input
              type={viewNewPassword ? "text" : "password"}
              name="password"
              className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                !formData.password || isPasswordValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.password}
              onChange={handlePasswordChange}
            />
            <span
              className="absolute top-[16.5px] right-4 cursor-pointer"
              onClick={() => setViewNewPassword((prev) => !prev)}
            >
              {viewNewPassword ? <EyeSlashed /> : <EyeIcon />}
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
            Confirm New Password
          </p>
          <label className="relative flex flex-shrink-0 w-full">
            <input
              type={viewConfirmNewPassword ? "text" : "password"}
              name="passwordConfirm"
              className={`bg-sec-grey h-12 rounded-md w-full px-4 text-main-black border ${
                !formData.passwordConfirm || isConfirmPasswordValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.passwordConfirm}
              onChange={handleConfirmPasswordChange}
            />
            <span
              className="absolute top-[16.5px] right-4 cursor-pointer"
              onClick={() => setViewConfirmNewPassword((prev) => !prev)}
            >
              {viewConfirmNewPassword ? <EyeSlashed /> : <EyeIcon />}
            </span>
          </label>
          {!!formData.passwordConfirm.length && !isConfirmPasswordValid && (
            <p className="error-text">Passwords must match</p>
          )}
        </div>
        <Button
          title="update password"
          onClick={handleSubmit}
          disabled={
            loading ||
            !formData.currentPassword ||
            !isConfirmPasswordValid ||
            !isPasswordValid
          }
        >
          {loading ? <Loader /> : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
