import Link from "next/link";

type SiteLogoProps = {
  href?: string;
  className?: string;
};

export function SiteLogo({ href = "/cars", className = "" }: SiteLogoProps) {
  return (
    <Link
      href={href}
      className={`site-logo inline-flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)] ${className}`}
      aria-label="Carsensor"
    >
      Carsensor
    </Link>
  );
}
