"use client";

export function Skeleton({ width = "100%", height = "20px", borderRadius = "var(--radius-sm, 6px)", style = {} }) {
  return (
    <div
      className="skeleton-loader"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--border-subtle, #e2e8f0)",
        opacity: 0.7,
        animation: "skeletonPulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <Skeleton width="45%" height="14px" />
      <Skeleton width="70%" height="28px" />
      <Skeleton width="30%" height="12px" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <Skeleton width={i === 0 ? "80%" : "60%"} height="16px" />
        </td>
      ))}
    </tr>
  );
}
