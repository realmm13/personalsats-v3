// Impersonation is not used in production. This file is now a no-op.
export function useIsImpersonating() {
  return {
    isImpersonating: false,
    impersonatedUserName: null,
  };
}
