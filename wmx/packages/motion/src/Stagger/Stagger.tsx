import { Children, cloneElement, isValidElement } from "react";
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from "react";
import { useInView } from "../useInView.js";
import "./Stagger.css";

interface StaggerChildProps {
  className?: string;
  style?: CSSProperties;
}

export interface StaggerProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  once?: boolean;
  threshold?: number;
  children: ReactNode;
}

export function Stagger({
  gap = 80,
  once = true,
  threshold = 0.15,
  className,
  children,
  ...rest
}: StaggerProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, once });
  const classes = ["wmx-stagger", inView && "wmx-stagger--visible", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} {...rest}>
      {Children.map(children, (child, index) => {
        if (!isValidElement<StaggerChildProps>(child)) return child;

        return cloneElement(child as ReactElement<StaggerChildProps>, {
          className: ["wmx-stagger__item", child.props.className].filter(Boolean).join(" "),
          style: {
            ...child.props.style,
            transitionDelay: inView ? `${index * gap}ms` : undefined,
          },
        });
      })}
    </div>
  );
}
