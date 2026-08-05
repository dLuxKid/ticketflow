"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import avatar from "@/assets/images/default-avatar.png";
import EditIcon from "@/assets/svg/edit-icon";

import { genderOptions } from "@/assets/data/react-select-options";
import { categoriesStyles } from "@/styles/react-select.styles";
import Select, { SingleValue } from "react-select";

import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";

import { toast } from "sonner";
import validator from "validator";

import { useUser } from "@/store/useUser";
import { updateUserDetails } from "@/utils/actions";

const initialState = {
  name: "",
  email: "",
  phoneNumber: "",
  gender: "",
  photo: "",
};

function areObjectsEqual(
  obj1: { [key: string]: string },
  obj2: { [key: string]: string }
) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  for (let key of keys2) {
    if (!(key in obj1)) {
      return false;
    }
  }

  return true;
}

export default function Profile() {
  const { data } = useUser();

  const [formData, setFormData] = useState<typeof initialState>(initialState);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    if (data && data.data.user)
      return setFormData({
        name: data.data.user.name,
        email: data.data.user.email,
        phoneNumber: data.data.user.phoneNumber,
        gender: data.data.user.gender,
        photo: data.data.user.photo,
      });
  }, [data]);

  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isGenderValid, setIsGenderValid] = useState<boolean>(true);
  const [isNumberValid, setIsNumberValid] = useState<boolean>(true);

  const runValidators = () => {
    const fullNameRegex = /^[a-zA-Z\s\-]+$/;
    const phoneNumberRegex =
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}$/;

    setIsNameValid(
      fullNameRegex.test(formData.name) && formData.name.length >= 4
    );
    setIsEmailValid(validator.isEmail(formData.email));
    setIsGenderValid(validator.isAlpha(formData.gender));
    setIsNumberValid(phoneNumberRegex.test(formData.phoneNumber));

    return isNameValid && isEmailValid && isNumberValid && isGenderValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (!selectedFile.type.includes("image"))
      return toast.error("Please select images only");
    if (selectedFile.size > 10 * 1024 * 1024)
      return toast.error("Images cannot be larger than 10mb");

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.onerror = (err) => {
      return toast.error("An error occured while reading the image");
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user: typeof initialState = {
      name: data.data.user.name,
      email: data.data.user.email,
      phoneNumber: data.data.user.phoneNumber,
      gender: data.data.user.gender,
      photo: data.data.user.photo,
    };
    if (!runValidators() || areObjectsEqual(user, formData)) return;
    setLoading(true);

    try {
      const result = await updateUserDetails(formData, "data");

      if (result.status === "success") {
        toast.success("Updated details successfully");
        router.refresh();
      }
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.response
          ? error.response.data.message
          : "Error updating your details"
      );
    }

    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="size-40 md:size-[100px] bg-main-black rounded-full relative">
            <Image
              src={formData.photo || avatar}
              alt="profile picture"
              className="w-full h-full object-cover object-center rounded-full"
              width={100}
              height={100}
            />
            <label htmlFor="userPhoto">
              <span className="absolute bottom-0 -right-5 cursor-pointer">
                <EditIcon />
              </span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              id="userPhoto"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-lg font-semibold hidden md:block">
            {data?.data?.user?.name}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <label className="flex-1">
            <p className="text-base md:text-lg font-medium mb-1">Fullname</p>
            <input
              type="text"
              className={`bg-sec-grey w-full h-12 px-4 rounded-sm border-[0.5px] text-main-black ${
                !formData.name || isNameValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </label>
          <label className="flex-1">
            <p className="text-base md:text-lg font-medium mb-1">
              Email Address
            </p>
            <input
              type="text"
              name="email"
              className={`bg-sec-grey w-full h-12 px-4 rounded-sm border-[0.5px] text-main-black ${
                !formData.name || isEmailValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.email}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <label className="flex-1">
            <p className="text-base md:text-lg font-medium mb-1">
              Phone Number
            </p>
            <input
              type="tel"
              placeholder="(234) 8012345678"
              name="phoneNumber"
              className={`bg-sec-grey placeholder:text-main-black/70 w-full h-12 px-4 rounded-sm border-[0.5px] text-main-black ${
                !formData.name || isNumberValid
                  ? "border-main-purple"
                  : "border-red-600"
              }`}
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </label>
          <label className="flex-1">
            <p className="text-base md:text-lg font-medium mb-1">Gender</p>
            <Select
              styles={categoriesStyles}
              value={
                genderOptions.find(
                  (option) => option.value === formData.gender
                ) || null
              }
              classNamePrefix="select"
              options={genderOptions}
              onChange={(category: SingleValue<reactSelectOptions>) => {
                if (category)
                  setFormData((prev) => ({
                    ...prev,
                    gender: category.value,
                  }));
              }}
              isSearchable={true}
              name="gender"
              placeholder="Select Gender"
            />
          </label>
        </div>

        <div className="self-center max-w-md w-full mt-6 md:mt-8">
          <Button
            title="update details"
            disabled={
              !formData.email ||
              !formData.gender ||
              !formData.name ||
              !formData.phoneNumber ||
              loading
            }
          >
            {loading ? <Loader /> : "Update"}
          </Button>
        </div>
      </form>
    </div>
  );
}
