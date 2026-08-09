export function truncate(str: string, n: number) {
  return str?.length > n ? str.substring(0, n - 1) + "..." : str;
}

export function formatNumber(number: number) {
  const suffixes = ["", "k", "m", "b", "t"];
  const tier = (Math.log10(Math.abs(number)) / 3) | 0;

  if (tier === 0) return number;

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;

  return scaled.toFixed(1) + suffix;
}

export const formatDate = (date: Date) => {
  const dateObject = new Date(date).toLocaleTimeString();
  const dateArray = dateObject.split(":");

  return `${dateArray[0]}:${dateArray[1]} ${dateArray[2].split(" ")[1]}`;
};

export const calculateExcludeDates = (minDate: Date, maxDate: Date) => {
  const excludedDates = [];
  const currentDate = new Date();
  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  ); // Remove time component from currentDate
  // Add all dates before today and after eventData.startDate to excludedDates
  for (
    let date = new Date(minDate);
    date < today;
    date.setDate(date.getDate() + 1)
  ) {
    if (!isSameDay(date, maxDate)) {
      excludedDates.push(new Date(date));
    }
  }
  return excludedDates;
};

// Function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date) => {
  if (date1 && date2)
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
};

export function formatDateRange(startDate: Date, endDate: Date) {
  const format = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formatWithoutYear = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  const formattedStartDate = formatWithoutYear.format(startDate);
  const formattedEndDate = format.format(endDate);

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${format.format(startDate)}`;
  } else {
    const monthYear = formattedStartDate.slice(0, 7);

    if (monthYear === formattedEndDate.slice(0, 7)) {
      return `${formattedStartDate.slice(0, 6)} - ${formattedEndDate.slice(
        0,
        6,
      )}`;
    } else {
      return `${formattedStartDate} - ${formattedEndDate}`;
    }
  }
}

export function formatTimeRange(startTime: Date, endTime: Date) {
  const format = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const formattedStartTime = format.format(startTime);
  const formattedEndTime = format.format(endTime);

  return `${formattedStartTime} - ${formattedEndTime}`;
}

export const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

/**
 * REMOVED: `calculateFinalPrice`.
 *
 * It grossed a ticket price up by a hardcoded "5% + 100" markup and rounded to the nearest
 * 10, so the checkout page displayed ₦5,380 for a ₦5,000 ticket. That was a legacy fee model
 * from before the platform fee existed, and by the time it was found it was wrong twice over:
 * the fee is now 3%, and it is deducted from the organiser's settlement rather than added to
 * the buyer's bill (see `pricingService` on the backend). The amount charged is computed
 * server-side from the event's own tiers, so this figure was not even the one Paystack took —
 * the page quoted a price nobody was charging.
 *
 * The buyer pays the advertised ticket price. If a buyer-visible booking fee is ever wanted,
 * it must be added on the server where the charge is built, not re-derived in the browser.
 */
