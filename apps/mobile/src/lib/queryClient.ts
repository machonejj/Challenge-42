import { QueryClient } from '@tanstack/react-query';

/** Single shared query client. Conservative defaults suitable for a mobile app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});
