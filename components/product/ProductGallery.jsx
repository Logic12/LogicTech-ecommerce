"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/components/ui/Img";

/** Main image with crossfade, thumbnails, keyboard/swipe navigation and hover zoom. */
export function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const touch = useRef(null);
  const count = images.length;
  const go = (d) => setActive((i) => (i + d + count) % count);

  if (!count)
    return (
      <div className="gallery">
        <div className="gallery__stage">
          <Img src={null} alt="" />
        </div>
      </div>
    );

  return (
    <div className="gallery">
      <div
        className={`gallery__stage ${zoom ? "is-zooming" : ""}`}
        onMouseMove={(e) => {
          if (window.matchMedia("(hover: none)").matches) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        style={zoom ? { "--zx": `${zoom.x}%`, "--zy": `${zoom.y}%` } : undefined}
      >
        {images.map((img, i) => (
          <Img
            key={img.url}
            src={img.url}
            lqip={img.lqip}
            alt={i === 0 ? name : `${name} — view ${i + 1}`}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            priority={i === 0}
            className={`gallery__img ${i === active ? "is-active" : ""}`}
            aria-hidden={i !== active}
          />
        ))}
        {count > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={20} />
            </button>
            <span className="gallery__count">
              {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              className={i === active ? "is-active" : ""}
              onClick={() => setActive(i)}
            >
              <Img src={img.url} lqip={img.lqip} alt="" fill sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
