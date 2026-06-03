import type { ReactNode } from "react";
import "./index.less";

type TravelBtiPageShellProps = {
  header: ReactNode;
  children: ReactNode;
  compact?: boolean;
};

export function TravelBtiPageShell({ header, children, compact = false }: TravelBtiPageShellProps) {
  return (
    <main className={`travel-bti-page-shell ${compact ? "compact" : ""}`}>
      <div className="travel-bti-background" aria-hidden="true" />
      {header}
      <div className="travel-bti-page-inner">{children}</div>
    </main>
  );
}
