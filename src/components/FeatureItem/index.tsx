import type { ReactNode } from "react";
import "./index.less";

type FeatureItemProps = {
  tone: "green" | "blue" | "violet";
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export function FeatureItem({ tone, icon, title, children }: FeatureItemProps) {
  return (
    <article className="feature-item">
      <span className={`feature-icon ${tone}`}>{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </article>
  );
}
