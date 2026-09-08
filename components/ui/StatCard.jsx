import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default", // default, emerald, rose, gold, blue
  trend, // { value: "+12%", isPositive: true }
}) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {(subtitle || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-trend ${trend.isPositive ? "trend-up" : "trend-down"}`}>
                {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend.value}
              </span>
            )}
            {subtitle && <span className="stat-card-sub">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
