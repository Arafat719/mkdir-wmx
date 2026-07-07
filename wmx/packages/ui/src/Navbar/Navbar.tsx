import type { HTMLAttributes, ReactNode } from "react";
import "./Navbar.css";

export interface NavbarLink {
  label: string;
  href: string;
}

export type NavbarVariant =
  | "default"
  | "glass"
  | "pill"
  | "gradient"
  | "minimal"
  | "centered"
  | "underline"
  | "soft"
  | "terminal"
  | "bold";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  links?: NavbarLink[];
  variant?: NavbarVariant;
  children?: ReactNode;
}

export function Navbar({
  brand,
  links = [],
  variant = "default",
  className,
  children,
  ...rest
}: NavbarProps) {
  const classes = ["wmx-navbar", `wmx-navbar--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={classes} {...rest}>
      <div className="wmx-navbar__brand">{brand}</div>
      <ul className="wmx-navbar__links">
        {links.map((link, i) => (
          <li key={`${link.href}-${i}`}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
      {children && <div className="wmx-navbar__actions">{children}</div>}
    </nav>
  );
}
