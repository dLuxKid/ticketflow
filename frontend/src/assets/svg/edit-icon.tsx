import React from "react";

export default function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
    >
      <g filter="url(#filter0_d_4086_412)">
        <circle cx="22" cy="21" r="20" fill="#FFFEFD" />
        <path
          d="M22 28H29H22ZM25.5 14.508C25.8094 14.1828 26.2291 14 26.6667 14C26.8833 14 27.0979 14.0449 27.2981 14.132C27.4982 14.2192 27.6801 14.347 27.8333 14.508C27.9865 14.6691 28.1081 14.8603 28.191 15.0708C28.2739 15.2812 28.3166 15.5068 28.3166 15.7346C28.3166 15.9624 28.2739 16.1879 28.191 16.3984C28.1081 16.6088 27.9865 16.8001 27.8333 16.9611L18.1111 27.1823L15 28L15.7778 24.7292L25.5 14.508Z"
          stroke="#1F1F1F"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_4086_412"
          x="0"
          y="0"
          width="48"
          height="48"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="2" dy="3" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.841667 0 0 0 0 0.841667 0 0 0 0 0.841667 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_4086_412"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_4086_412"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
