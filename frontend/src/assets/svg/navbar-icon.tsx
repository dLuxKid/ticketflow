/**
 * Inherits `currentColor` so the caller can recolour it - the mobile trigger has to turn
 * white while the navbar floats over the dark hero, which a hardcoded fill could not do.
 */
export default function NavIcon() {
  return (
    <span className="cursor-pointer text-main-purple transition-colors group-data-[solid=false]/nav:text-main-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="12"
        viewBox="0 0 18 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 12H18V10H0V12ZM0 7H18V5H0V7ZM0 0V2H18V0H0Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
