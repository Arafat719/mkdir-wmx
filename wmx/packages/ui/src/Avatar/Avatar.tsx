import type { HTMLAttributes } from "react";
import "./Avatar.css";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  size?: AvatarSize;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ src, name, size = "md", className, ...rest }: AvatarProps) {
  const classes = ["wmx-avatar", `wmx-avatar--${size}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...rest}>
      {src ? (
        <img className="wmx-avatar__img" src={src} alt={name ?? ""} />
      ) : (
        <span className="wmx-avatar__initials">{name ? getInitials(name) : ""}</span>
      )}
    </span>
  );
}
