"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { generatePagination } from "@/utils/utils";

export default function Pagination({ length }: { length: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const totalPages = Math.ceil(Number(length) / 9);

  const allPages = generatePagination(currentPage, totalPages);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex-center mt-8">
      {totalPages > 1 && (
        <div className="inline-flex">
          <PaginationArrow
            direction="left"
            href={createPageURL(currentPage - 1)}
            isDisabled={currentPage <= 1}
          />

          <div className="flex -space-x-px">
            {allPages.map((page, index) => {
              let position: "first" | "last" | "single" | "middle" | undefined;

              if (index === 0) position = "first";
              if (index === allPages.length - 1) position = "last";
              if (allPages.length === 1) position = "single";
              if (page === "...") position = "middle";

              return (
                <PaginationNumber
                  key={page}
                  href={createPageURL(page)}
                  page={page}
                  position={position}
                  isActive={currentPage === page}
                />
              );
            })}
          </div>

          <PaginationArrow
            direction="right"
            href={createPageURL(currentPage + 1)}
            isDisabled={currentPage >= totalPages}
          />
        </div>
      )}
    </div>
  );
}

function PaginationNumber({
  page,
  href,
  isActive,
  position,
}: {
  page: number | string;
  href: string;
  position?: "first" | "last" | "middle" | "single";
  isActive: boolean;
}) {
  const className = `flex h-6 w-6 sm:h-10 sm:w-10 items-center justify-center text-xs md:text-sm rounded-full font-bold ${
    (position === "first" || position === "single" || position === "last") &&
    "rounded-full"
  } 
  ${isActive && "z-10 bg-main-purple text-main-white"} ${
    !isActive && position !== "middle" && "hover:bg-gray-100 text-main-black/50"
  }
  ${position === "middle" && "text-main-black/50"}
  `;

  return isActive || position === "middle" ? (
    <div className={className}>{page}</div>
  ) : (
    <Link href={href} className={className}>
      {page}
    </Link>
  );
}

function PaginationArrow({
  href,
  direction,
  isDisabled,
}: {
  href: string;
  direction: "left" | "right";
  isDisabled?: boolean;
}) {
  const className = `flex h-6 w-6 sm:h-10 sm:w-10 items-center justify-center ${
    isDisabled
      ? "pointer-events-none text-main-purple/10"
      : "hover:text-main-purle/90"
  } ${direction === "left" ? "mr-2 md:mr-4" : "ml-2 md:ml-4"}`;

  const icon =
    direction === "right" ? (
      <span>
        <svg
          width="14"
          height="23"
          viewBox="0 0 14 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 22L12 11.5L1 1"
            stroke="#6c5ce7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ) : (
      <span className="rotate-180">
        <svg
          width="14"
          height="23"
          viewBox="0 0 14 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 22L12 11.5L1 1"
            stroke="#6c5ce7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );

  return isDisabled ? (
    <div className={className}>{icon}</div>
  ) : (
    <Link className={className} href={href}>
      {icon}
    </Link>
  );
}
