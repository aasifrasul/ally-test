import { render, screen } from "@testing-library/react";
import React from "react";
import Counter from "../Counter";

describe("Counter tests", () => {
  it("should display the counter value", () => {
    render(<Counter />);
    const counterElement = screen.getByTestId("counter");
    expect(counterElement).toHaveTextContent("0");
  });

  // Add more test cases for incrementing and decrementing the counter
});
