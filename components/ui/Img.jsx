import Image from "next/image";

// Neutral placeholder used while remote images load (Sanity images use their own LQIP).
export const BLUR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6'%3E%3Crect width='8' height='6' fill='%23e9ebe7'/%3E%3C/svg%3E";

/** next/image with a blur-up placeholder and a branded fallback when there is no image. */
export function Img({ src, lqip, alt = "", className = "", ...props }) {
  if (!src)
    return (
      <div className={`img-fallback ${className}`} aria-hidden="true">
        LOGICTECH
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      placeholder="blur"
      blurDataURL={lqip || BLUR_FALLBACK}
      {...props}
    />
  );
}
