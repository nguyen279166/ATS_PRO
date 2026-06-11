import { useState } from "react";
import { getInitials, resolveMediaUrl } from "../utils/media";

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  className?: string;
  imageClassName?: string;
};

export default function Avatar({
  name,
  src,
  className = "h-10 w-10 text-sm",
  imageClassName,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = !failed ? resolveMediaUrl(src) : "";
  const baseClasses =
    "flex shrink-0 items-center justify-center rounded-full bg-[#efe2cc] font-black text-[#8a4518] ring-1 ring-[#d8c8b5]";

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={name ? `${name} avatar` : "Avatar"}
        className={`${className} rounded-full object-cover ${imageClassName || ""}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className={`${baseClasses} ${className}`}>{getInitials(name)}</div>;
}
