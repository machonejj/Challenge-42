// Root entry. The gate in `_layout.tsx` redirects to the correct group once state is ready; this
// renders nothing (the splash overlay covers the brief moment before redirect).
export default function Index(): React.JSX.Element | null {
  return null;
}
