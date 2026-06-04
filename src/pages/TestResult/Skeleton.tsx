import React from "react";
import { Skeleton } from "antd";

const SKELETON_INPUT_BASE: React.CSSProperties = {
  borderRadius: 8,
};

export function TestResultSkeleton() {
  return (
    <>
      <div className="result-main-column">
        <Skeleton.Input
          active
          size="small"
          style={{ width: 184, height: 30, borderRadius: 6 }}
          aria-label="正在加载状态"
        />

        <div style={{ marginTop: 18 }}>
          <Skeleton.Input
            active
            style={{ width: "min(420px, 80%)", height: 46, borderRadius: 10 }}
            aria-label="正在加载标题"
          />
        </div>

        <div style={{ marginTop: 17, maxWidth: 720 }}>
          <Skeleton active paragraph={{ rows: 2, width: ["100%", "72%"] }} title={false} />
        </div>

        <section className="persona-panel" aria-label="正在加载人格画像">
          <div className="persona-summary">
            <Skeleton.Avatar active size={184} shape="circle" />
            <div>
              <Skeleton.Input
                active
                style={{ ...SKELETON_INPUT_BASE, width: 220, height: 36 }}
              />
              <div style={{ marginTop: 11 }}>
                <Skeleton.Input
                  active
                  style={{ ...SKELETON_INPUT_BASE, width: 280, height: 20, borderRadius: 6 }}
                />
              </div>
              <div style={{ marginTop: 16, maxWidth: 570 }}>
                <Skeleton
                  active
                  paragraph={{ rows: 2, width: ["100%", "92%"] }}
                  title={false}
                />
              </div>
            </div>
          </div>

          <div className="dimension-heading">
            <Skeleton.Input
              active
              style={{ ...SKELETON_INPUT_BASE, width: 180, height: 22 }}
            />
            <Skeleton.Input
              active
              style={{ ...SKELETON_INPUT_BASE, width: 110, height: 14, borderRadius: 4 }}
            />
          </div>

          <div className="dimension-grid">
            {Array.from({ length: 10 }).map((_, index) => (
              <div className="dimension-row" key={index}>
                <Skeleton.Avatar active size={32} shape="square" />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ ...SKELETON_INPUT_BASE, width: 78, height: 18, borderRadius: 4 }}
                />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ ...SKELETON_INPUT_BASE, width: "100%", height: 7, borderRadius: 999 }}
                />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ ...SKELETON_INPUT_BASE, width: 28, height: 18, borderRadius: 4 }}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="result-bottom-row">
          <Skeleton
            active
            paragraph={{ rows: 2, width: ["90%", "60%"] }}
            title={false}
          />
          <div className="result-actions">
            <Skeleton.Button active size="large" style={{ height: 58 }} block />
            <Skeleton.Button active size="large" style={{ height: 58 }} block />
          </div>
        </div>
      </div>

      <aside className="result-side-column" aria-label="正在加载结果说明">
        <div className="result-side-card persona-image-card">
          <Skeleton.Input
            active
            style={{ ...SKELETON_INPUT_BASE, width: 120, height: 22 }}
          />
          <div style={{ marginTop: 13 }}>
            <Skeleton.Input
              active
              style={{ ...SKELETON_INPUT_BASE, width: "100%", height: 280, borderRadius: 14 }}
            />
          </div>
        </div>

        <div className="result-side-card">
          <Skeleton.Input
            active
            style={{ ...SKELETON_INPUT_BASE, width: 140, height: 22 }}
          />
          <div className="keyword-list" style={{ marginTop: 13 }}>
            {[68, 84, 56, 96].map((width, index) => (
              <Skeleton.Input
                active
                key={index}
                size="small"
                style={{ ...SKELETON_INPUT_BASE, width, height: 30, borderRadius: 9 }}
              />
            ))}
          </div>
        </div>

        <div className="result-side-card">
          <Skeleton.Input
            active
            style={{ ...SKELETON_INPUT_BASE, width: 140, height: 22 }}
          />
          <div style={{ marginTop: 13 }}>
            <Skeleton
              active
              paragraph={{ rows: 3, width: ["95%", "82%", "68%"] }}
              title={false}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
