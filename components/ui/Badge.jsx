export default function Badge({ children, variant = "default", size = "md" }) {
  // variants: emerald (success), rose (danger), amber (warning), blue (info), slate (neutral)
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
