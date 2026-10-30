"use client";
// Last-resort error screen (replaces the root layout), shown only if something
// fails outside the store's own error boundary.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0e1112",
          color: "#eef1ee",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ letterSpacing: "0.2em", fontSize: 11, color: "#9cbfae", margin: 0 }}>LOGICTECH RESALE</p>
          <h1 style={{ fontSize: 34, letterSpacing: "-0.03em", margin: "14px 0" }}>Something went wrong.</h1>
          <p style={{ color: "#8e9894", lineHeight: 1.6 }}>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ marginTop: 18, padding: "14px 22px", borderRadius: 999, border: 0, background: "#eef1ee", color: "#111415", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
