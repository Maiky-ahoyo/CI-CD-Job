import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders Vite and React logos", () => {
    render(<App />);
    const viteLogo = screen.getByAltText("Vite logo");
    const reactLogo = screen.getByAltText("React logo");

    expect(viteLogo).toBeInTheDocument();
    expect(reactLogo).toBeInTheDocument();
  });

  it("renders initial count", () => {
    render(<App />);
    expect(screen.getByText("count is 0")).toBeInTheDocument();
  });

  it("increments count on click", () => {
    render(<App />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByText("count is 1")).toBeInTheDocument();
  });

  //it("renders custom message", () => {
  //  render(<App />);
  //  expect(screen.getByText(/dshyjGADSKUGVSA/i)).toBeInTheDocument();
  //});
});
