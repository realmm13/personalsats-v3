"use client";

import * as React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactFC, type Size } from "@/lib/utils";
import { ConditionalTooltip } from "@/components/ConditionalTooltip";
import { useLinkableComponent } from "@/hooks/useLinkableComponent";

export interface HoverableIconClassNames {
  root?: string;
  icon?: string;
  tooltip?: string;
}

export const iconSizes: Record<Size, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

type ElementAttributes = React.JSX.IntrinsicElements['a'] | React.JSX.IntrinsicElements['button'];

export interface HoverableIconProps {
  Icon: LucideIcon;
  href?: string;
  external?: boolean;
  size?: Size | number;
  defaultColor?: string;
  tooltip?: string;
  classNames?: HoverableIconClassNames;
}

export const HoverableIcon: ReactFC<HoverableIconProps> = ({
  Icon,
  href,
  external = true,
  size = "md",
  defaultColor,
  tooltip,
  classNames = {},
}) => {
  const { Component, linkProps } = useLinkableComponent({
    href,
    external,
  });

  // Determine icon size - either from predefined sizes or custom number
  const iconSize = typeof size === "string" ? iconSizes[size] : size;

  // Setup base className for the element
  const elementClassName = cn(
    defaultColor,
    "opacity-80 hover:opacity-100 transition-opacity cursor-pointer",
    classNames.root,
  );

  // Setup attributes based on component type
  const elementAttributes: ElementAttributes = {
    className: elementClassName,
    ...linkProps,
  };

  // Add href only if it's an anchor or Link
  if (href && (Component === "a" || Component === Link)) {
    (elementAttributes as React.JSX.IntrinsicElements['a']).href = href;
  }

  const iconElement = (
    <Component {...elementAttributes}>
      <Icon size={iconSize} className={cn(classNames.icon)} />
    </Component>
  );

  return (
    <ConditionalTooltip
      condition={!!tooltip}
      content={tooltip}
      classNames={{ tooltip: classNames.tooltip }}
    >
      {iconElement}
    </ConditionalTooltip>
  );
};
