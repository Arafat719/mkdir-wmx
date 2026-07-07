import type { HTMLAttributes, ReactNode } from "react";
import "./Card.css";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Card({ title, footer, className, children, ...rest }: CardProps) {
  const classes = ["wmx-card", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...rest}>
      {title && <div className="wmx-card__header">{title}</div>}
      <div className="wmx-card__body">{children}</div>
      {footer && <div className="wmx-card__footer">{footer}</div>}
    </div>
  );
}
