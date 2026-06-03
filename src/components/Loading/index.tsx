import type { CSSProperties } from "react";
import "./index.less";

type LoadingProps = {
  text?: string;
  size?: number;
  fullscreen?: boolean;
  overlay?: boolean;
  withStars?: boolean;
  className?: string;
};

export function Loading({
  text = "LOADING",
  size = 104,
  fullscreen = false,
  overlay = false,
  withStars = true,
  className = "",
}: LoadingProps) {
  const letters = text.replace(/\s/g, "").slice(0, 10).split("");
  const wrapperClassName = ["teamtrip-loading-shell", fullscreen ? "fullscreen" : "", overlay ? "overlay" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName} role="status" aria-live="polite" aria-label={text}>
      <div className="teamtrip-loading" style={{ "--loading-size": `${size}px` } as CSSProperties}>
        <span className="teamtrip-loading__orb" aria-hidden="true" />
        {letters.map((letter, index) => (
          <span
            className="teamtrip-loading__letter"
            key={`${letter}-${index}`}
            style={{ "--letter-delay": `${index * 0.1}s` } as CSSProperties}
          >
            {letter}
          </span>
        ))}
        {withStars &&
          Array.from({ length: 7 }, (_, index) => (
            <span className={`teamtrip-loading__spark teamtrip-loading__spark--${index + 1}`} key={index} aria-hidden="true" />
          ))}
      </div>
    </div>
  );
}
