import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount between tests so queries can't match a previous test's DOM.
afterEach(() => cleanup());

// next/image renders a plain <img> under test: the real component depends on the Next
// image optimisation pipeline, which isn't running here.
vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: any) => {
    const resolved = typeof src === "object" && src !== null ? src.src ?? "" : src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={alt} {...rest} />;
  },
}));
