import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders correctly", () => {
    render(<App />);
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });
});
