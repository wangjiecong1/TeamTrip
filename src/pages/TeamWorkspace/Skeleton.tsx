import React from "react";
import { Layout, Skeleton } from "antd";
import { BrandMark } from "../../components/BrandMark";

const { Sider, Content } = Layout;

type SkeletonLineStyle = React.CSSProperties & {
  "--workspace-skeleton-width": string;
  "--workspace-skeleton-height": string;
  "--workspace-skeleton-radius": string;
};

const line = (width: React.CSSProperties["width"], height = 16, borderRadius = 6): SkeletonLineStyle => ({
  "--workspace-skeleton-width": typeof width === "number" ? `${width}px` : String(width),
  "--workspace-skeleton-height": `${height}px`,
  "--workspace-skeleton-radius": `${borderRadius}px`,
  width,
  height,
  borderRadius,
});

const calendarCells = Array.from({ length: 42 });
const preferenceRows = Array.from({ length: 9 });
const preferenceSegments = Array.from({ length: 9 });

export function TeamWorkspaceSkeleton() {
  return (
    <>
      <Sider
        aria-label="团队导航加载中"
        breakpoint="lg"
        className="workspace-sidebar workspace-skeleton"
        collapsedWidth={80}
        theme="light"
        trigger={null}
        width={252}
      >
        <div className="workspace-sidebar__brand">
          <BrandMark />
          <span>TeamTrip</span>
        </div>

        <nav className="workspace-nav workspace-skeleton__nav" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="workspace-nav__item" key={index}>
              <span className="workspace-skeleton__icon" />
              <Skeleton.Input active size="small" style={line(index === 2 ? 92 : 78, 18)} />
            </div>
          ))}
        </nav>

        <div className="workspace-sidebar__user">
          <Skeleton.Avatar active size={54} />
          <span className="workspace-sidebar__user-info">
            <Skeleton.Input active size="small" style={line(76, 17, 4)} />
            <Skeleton.Input active size="small" style={line(58, 24, 999)} />
          </span>
          <span className="workspace-skeleton__icon workspace-skeleton__icon--small" />
        </div>
      </Sider>

      <Layout className="workspace-main-layout">
        <Content className="workspace-main workspace-skeleton">
          <section className="workspace-hero-card workspace-skeleton__hero" aria-label="团队信息加载中">
          <Skeleton.Input active className="workspace-skeleton__hero-cover" />

          <div className="workspace-hero-card__body">
            <div className="workspace-title-row">
              <Skeleton.Input active style={line(220, 32, 8)} />
              <span className="workspace-skeleton__icon workspace-skeleton__icon--button" />
            </div>
            <div className="workspace-skeleton__hero-meta">
              <Skeleton.Input active size="small" style={line("52%", 18, 4)} />
              <Skeleton.Input active size="small" style={line(84, 28, 999)} />
            </div>

            <div className="workspace-team-stats">
              {[72, 62, 72, 86].map((valueWidth, index) => (
                <div key={index}>
                  <Skeleton.Input active size="small" style={line(index === 2 ? "88%" : "72%", 14, 4)} />
                  <div className="workspace-skeleton__stat-value">
                    {index === 0 && <Skeleton.Avatar active size={28} />}
                    <Skeleton.Input active size="small" style={line(`${valueWidth}%`, 24)} />
                    {index === 3 && <span className="workspace-skeleton__icon workspace-skeleton__icon--button" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-hero-card__cta">
            <Skeleton.Button active className="workspace-skeleton__cta-button" />
            <Skeleton.Input active size="small" style={line(180, 14, 4)} />
            <Skeleton.Input active size="small" style={line(132, 30, 8)} />
          </div>
          </section>

          <div className="workspace-grid">
            <section className="workspace-left-column">
            <article className="workspace-card">
              <h3 className="workspace-skeleton__heading">
                <span className="workspace-skeleton__icon" />
                <Skeleton.Input active size="small" style={line(86, 22)} />
              </h3>

              <div className="readiness-list">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div className="readiness-item workspace-skeleton__readiness-item" key={index}>
                    <Skeleton.Avatar active shape="square" size={38} style={{ borderRadius: 12 }} />
                    <span>
                      <Skeleton.Input active size="small" style={line(index ? 82 : 94, 18, 4)} />
                      <Skeleton.Input active size="small" style={line(index ? "82%" : "92%", 14, 4)} />
                    </span>
                    <Skeleton.Input active size="small" style={line(64, 28, 999)} />
                    <span className="workspace-skeleton__icon workspace-skeleton__icon--small" />
                  </div>
                ))}
              </div>
            </article>

            <article className="workspace-card calendar-card">
              <h3 className="workspace-skeleton__heading">
                <Skeleton.Input active size="small" style={line(142, 22)} />
                <span className="workspace-skeleton__icon workspace-skeleton__icon--small" />
              </h3>

              <div className="calendar-actions">
                <div className="team-availability-calendar workspace-skeleton__calendar" aria-label="日历加载中">
                  <div className="team-calendar-header">
                    <div className="team-calendar-header__nav">
                      <span className="workspace-skeleton__calendar-control" />
                      <span className="workspace-skeleton__calendar-control" />
                    </div>
                    <Skeleton.Input active size="small" style={line(94, 18)} />
                    <div className="team-calendar-header__nav">
                      <span className="workspace-skeleton__calendar-control" />
                      <span className="workspace-skeleton__calendar-control" />
                    </div>
                  </div>

                  <div className="workspace-skeleton__calendar-weekdays">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <Skeleton.Input active key={index} size="small" style={line(16, 13, 4)} />
                    ))}
                  </div>
                  <div className="workspace-skeleton__calendar-grid">
                    {calendarCells.map((_, index) => (
                      <Skeleton.Input
                        active
                        className="workspace-skeleton__calendar-cell"
                        key={index}
                        size="small"
                        style={{ borderRadius: 999 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="workspace-skeleton__legend" aria-hidden="true">
                  {[42, 42, 42].map((width, index) => (
                    <span key={index}>
                      <i />
                      <Skeleton.Input active size="small" style={line(width, 13, 4)} />
                    </span>
                  ))}
                </div>
              </div>
            </article>
            </section>

            <section className="workspace-card workspace-insight-card">
            <h3 className="workspace-skeleton__heading">
              <Skeleton.Input active size="small" style={line(124, 22)} />
            </h3>

            <div className="workspace-insight-grid">
              <div className="ai-summary-panel">
                <h4 className="workspace-skeleton__heading">
                  <span className="workspace-skeleton__icon" />
                  <Skeleton.Input active size="small" style={line(112, 20)} />
                </h4>

                {Array.from({ length: 3 }).map((_, index) => (
                  <article className="ai-summary-item" key={index}>
                    <span className="workspace-skeleton__icon" />
                    <div>
                      <Skeleton.Input active size="small" style={line(index === 0 ? "42%" : "32%", 18, 4)} />
                      <Skeleton active paragraph={{ rows: 2, width: ["96%", index === 1 ? "72%" : "84%"] }} title={false} />
                    </div>
                  </article>
                ))}

                <div className="ai-note">
                  <Skeleton.Input active size="small" style={line(76, 18)} />
                  <Skeleton active paragraph={{ rows: 2, width: ["94%", "66%"] }} title={false} />
                </div>
              </div>

              <div className="preference-panel">
                <article className="preference-card">
                  <div className="preference-card__heading">
                    <Skeleton.Input active size="small" style={line(116, 20)} />
                    <Skeleton.Input active size="small" style={line(96, 13, 4)} />
                  </div>
                  <div className="preference-list">
                    {preferenceRows.map((_, index) => (
                      <div className="preference-row" key={index}>
                        <Skeleton.Input active size="small" style={line(index % 3 === 0 ? 42 : 36, 13, 4)} />
                        <Skeleton.Input active size="small" style={line(32, 12, 4)} />
                        <span className="workspace-skeleton__preference-line">
                          {preferenceSegments.map((_, segmentIndex) => (
                            <em key={segmentIndex} />
                          ))}
                          <i style={{ left: `${38 + ((index * 7) % 48)}%` }} />
                        </span>
                        <Skeleton.Input active size="small" style={line(32, 12, 4)} />
                      </div>
                    ))}
                  </div>
                </article>

                <article className="preference-card keywords-card">
                  <h4>
                    <Skeleton.Input active size="small" style={line(136, 20)} />
                    <Skeleton.Input active size="small" style={line(58, 13, 4)} />
                  </h4>
                  <div className="keyword-cloud">
                    {[72, 92, 58, 104, 76, 64].map((width, index) => (
                      <Skeleton.Input active key={index} size="small" style={line(width, 32, 8)} />
                    ))}
                  </div>
                </article>
              </div>
            </div>
            </section>
          </div>
        </Content>
      </Layout>
    </>
  );
}
