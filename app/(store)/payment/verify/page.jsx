import { Suspense } from "react";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";

export const metadata = { title: "Payment status", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="container page state-page" aria-busy="true" />}>
      <PaymentStatus />
    </Suspense>
  );
}
