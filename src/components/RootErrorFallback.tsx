"use client";

import type { FallbackProps } from "react-error-boundary";

export function RootErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  // Defensive: handle undefined or non-object errors
  const message = typeof error === 'object' && error && 'message' in error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'An unknown error occurred.';
  return (
    <div role="alert" className="p-4">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
