// A stand-in for a real photo: a soft on-palette gradient with a small
// label, so grids and cards read correctly before real images exist.
// Deliberately doesn't change with light/dark mode — like a real photo,
// it should look the same regardless of the site's theme.
const GRADIENTS = [
  "bg-gradient-to-br from-cream via-gold/60 to-pine/40",
  "bg-gradient-to-tr from-gold/50 via-cream to-dahlia/20",
  "bg-gradient-to-b from-pine/30 via-gold/50 to-cream",
];

export default function PlaceholderImage({
  label,
  variant = 0,
  className = "",
}: {
  label: string;
  variant?: number;
  className?: string;
}) {
  const gradient = GRADIENTS[variant % GRADIENTS.length];

  return (
    <div
      className={`flex items-center justify-center ${gradient} ${className}`}
    >
      <span className="px-4 text-center text-xs font-medium uppercase tracking-widest text-dahlia/70">
        {label}
      </span>
    </div>
  );
}
