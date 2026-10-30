"use client";
import dynamic from "next/dynamic";
const Studio = dynamic(
  () => import("next-sanity/studio").then((m) => m.NextStudio),
  { ssr: false },
);
import config from "../../../sanity.config";
export default function Page() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
    return <p>Set your Sanity project ID in .env.local first.</p>;
  return <Studio config={config} />;
}
