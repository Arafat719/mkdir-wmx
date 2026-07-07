import { forwardRef } from "react";
import type { ReactNode, SVGAttributes } from "react";

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "strokeWidth"> {
  size?: number | string;
  strokeWidth?: number;
}

export function createIcon(displayName: string, children: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 20, strokeWidth = 1.75, ...rest }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {children}
      </svg>
    )
  );
  Icon.displayName = displayName;
  return Icon;
}
