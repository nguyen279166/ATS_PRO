import { useState } from "react";
import { getInitials, resolveMediaUrl } from "../utils/media";

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export default function Avatar({
  name,
  src,
  className = "h-10 w-10 text-sm",
  imageClassName,
  alt,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null | undefined>();
  const resolvedSrc = failedSrc !== src ? resolveMediaUrl(src) : "";
  const baseClasses =
    "flex shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-strong)] font-black text-[var(--color-primary)] ring-1 ring-[var(--color-border)]";
  const accessibleLabel =
    alt ?? (name ? "Ảnh đại diện của " + name : "Ảnh đại diện");
  const decorative = alt === "";

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={accessibleLabel}
        className={
          className +
          " rounded-full object-cover " +
          (imageClassName || "")
        }
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <div
      className={baseClasses + " " + className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : accessibleLabel}
      aria-hidden={decorative || undefined}
    >
      <span aria-hidden={decorative ? undefined : "true"}>
        {getInitials(name)}
      </span>
    </div>
  );
}
