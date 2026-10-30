"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container page state-page">
      <div className="eyebrow">SOMETHING WENT WRONG</div>
      <h1 className="display">
        A small <em>hiccup.</em>
      </h1>
      <p>We couldn’t load this page. Please try again — if it keeps happening, contact us.</p>
      <div className="state-page__actions">
        <button className="btn btn--dark" onClick={reset}>
          <span>Try again</span> <RotateCcw size={16} />
        </button>
        <Link className="btn btn--ghost" href="/">
          <span>Back home</span>
        </Link>
      </div>
    </div>
  );
}
