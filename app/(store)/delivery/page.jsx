import { PolicyPage, policyMetadata } from "@/components/policy/PolicyPage";

export const revalidate = 60;

export function generateMetadata() {
  return policyMetadata("delivery");
}

export default function Page() {
  return <PolicyPage slug="delivery" />;
}
