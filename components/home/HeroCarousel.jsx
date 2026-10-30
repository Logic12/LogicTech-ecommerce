"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/components/ui/Img";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Autoplaying hero. The active indicator's CSS progress animation is the
 * timer: when it ends we advance. Pausing (hover, focus, hidden tab) just
 * pauses that animation, so the bar and the slide change never drift apart.
 * Under prefers-reduced-motion the animation is removed, so there is no autoplay.
 */
export function HeroCarousel({ slides, interval = 7000 }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const touchX = useRef(null);
  const n = slides.length;
  const paused = hovered || focused || hidden;

  const go = useCallback((i) => setIndex(((i % n) + n) % n), [n]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <section
      className={`hero ${paused ? "is-paused" : ""}`}
      aria-roledescription="carousel"
      aria-label="Featured collections"
      style={{ "--hero-interval": `${interval}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="hero__content">
        <div className="hero__stack">
          {slides.map((s, i) => {
            const active = i === index;
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <div
                key={s.id}
                className={`hero__text ${active ? "is-active" : ""}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}`}
                aria-hidden={!active}
                inert={!active}
              >
                <div className="hero__kicker">
                  <span className="hero__dot" />
                  <span className="mask"><span>{s.kicker}</span></span>
                </div>
                <Heading className="hero__title">
                  <span className="mask"><span>{s.title[0]}</span></span>
                  <span className="mask"><em>{s.title[1]}</em></span>
                </Heading>
                <p className="hero__copy">{s.copy}</p>
                <div className="hero__ctas">
                  <Link href={s.primary.href} className="btn btn--light">
                    <span>{s.primary.label}</span> <ArrowUpRight size={18} />
                  </Link>
                  <Link href={s.secondary.href} className="link-arrow link-arrow--light">
                    {s.secondary.label} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hero__foot">
          <span className="hero__counter" aria-live="polite">
            <strong>{pad(index + 1)}</strong> / {pad(n)}
          </span>
          <div className="hero__indicators">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`hero__indicator ${i === index ? "is-active" : ""} ${i < index ? "is-done" : ""}`}
                aria-label={`Show slide ${i + 1}: ${s.label}`}
                aria-current={i === index}
                onClick={() => go(i)}
              >
                <span
                  onAnimationEnd={
                    i === index ? (e) => e.animationName === "hero-timer" && go(index + 1) : undefined
                  }
                />
              </button>
            ))}
          </div>
          <div className="hero__arrows">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="hero__media">
        {slides.map((s, i) => (
          <div key={s.id} className={`hero__frame ${i === index ? "is-active" : ""}`} aria-hidden={i !== index}>
            <Img src={s.image} alt={s.imageAlt} fill priority={i === 0} sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
        ))}
        <Link href={slides[index].primary.href} className="hero__label">
          <span key={index}>{slides[index].label}</span> <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
