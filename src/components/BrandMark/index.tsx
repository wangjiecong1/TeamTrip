import "./index.less";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 72 86" focusable="false">
        <defs>
          <linearGradient id="brandMarkGradient" x1="22" x2="50" y1="4" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#20c6d0" />
            <stop offset="1" stopColor="#00a889" />
          </linearGradient>
        </defs>
        <path
          d="M36 3C17.8 3 5 16.1 5 34.5C5 56.6 28.1 76.4 33.8 80.9C35.1 82 36.9 82 38.2 80.9C43.9 76.4 67 56.6 67 34.5C67 16.1 54.2 3 36 3Z"
          fill="url(#brandMarkGradient)"
        />
        <path
          d="M36 19C27.1 19 20 26.1 20 35C20 45.9 32.1 56.1 34.5 58C35.4 58.7 36.6 58.7 37.5 58C39.9 56.1 52 45.9 52 35C52 26.1 44.9 19 36 19Z"
          fill="none"
          stroke="white"
          strokeLinejoin="round"
          strokeWidth="6.5"
        />
        <circle cx="36" cy="35" r="3.4" fill="white" />
      </svg>
    </span>
  );
}
