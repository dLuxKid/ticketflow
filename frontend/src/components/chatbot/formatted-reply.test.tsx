import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormattedReply } from "./chat-widget";

/**
 * The assistant's reply used to render inside a plain <p>, so newlines collapsed into spaces
 * and a six-field answer arrived as one unbroken wall of text — and any `**bold**` the model
 * produced showed up as literal asterisks. These pin the three constructs the system prompt
 * is instructed to emit.
 */

describe("FormattedReply", () => {
  it("renders '- ' lines as a real list, not literal hyphens", () => {
    render(
      <FormattedReply content={"Intro line.\n\n- **Venue:** The Roundhouse\n- **Date:** 12 Sept 2026"} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Venue: The Roundhouse");
  });

  it("renders **bold** as emphasis rather than asterisks", () => {
    const { container } = render(
      <FormattedReply content={"- **Tickets:** NGN 5,000"} />,
    );

    expect(container.querySelector("strong")).toHaveTextContent("Tickets:");
    // The raw markers must never survive into the visible text.
    expect(container.textContent).not.toContain("**");
  });

  it("keeps paragraphs separate instead of collapsing them", () => {
    const { container } = render(
      <FormattedReply content={"First paragraph.\n\nSecond paragraph."} />,
    );

    const paras = container.querySelectorAll("p");
    expect(paras).toHaveLength(2);
    expect(paras[1]).toHaveTextContent("Second paragraph.");
  });

  it("does not render HTML from the model as markup", () => {
    // The reply is built from React elements, never dangerouslySetInnerHTML, so a model that
    // echoes user input cannot inject markup.
    const { container } = render(
      <FormattedReply content={"<img src=x onerror=alert(1)>"} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
  });
});
