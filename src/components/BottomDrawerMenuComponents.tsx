import React from "react";
import { ReactFC, cn } from "@/lib/utils";

// Label
export interface BottomDrawerMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const BottomDrawerMenuLabel: ReactFC<BottomDrawerMenuLabelProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-4 py-2 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400",
        className,
      )}
    >
      {children}
    </div>
  );
};

// Separator
export interface BottomDrawerMenuSeparatorProps {
  className?: string;
}

export const BottomDrawerMenuSeparator: ReactFC<
  BottomDrawerMenuSeparatorProps
> = ({ className }) => {
  return (
    <div
      className={cn(
        "my-1 h-[1px] w-full bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
    />
  );
};

// Group
export interface BottomDrawerMenuGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const BottomDrawerMenuGroup: ReactFC<BottomDrawerMenuGroupProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("flex w-full flex-col", className)}>{children}</div>
  );
};

// MenuItems - Container with divide-y styling
export interface BottomDrawerMenuItemsProps {
  children: React.ReactNode;
  className?: string;
}

export const BottomDrawerMenuItems: ReactFC<BottomDrawerMenuItemsProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800",
        className,
      )}
    >
      {children}
    </div>
  );
};

// Group with title and items
export interface BottomDrawerGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const BottomDrawerGroup: ReactFC<BottomDrawerGroupProps> = ({
  title,
  children,
  className,
  titleClassName,
}) => {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      {title && (
        <BottomDrawerMenuLabel className={titleClassName}>
          {title}
        </BottomDrawerMenuLabel>
      )}
      <BottomDrawerMenuItems>{children}</BottomDrawerMenuItems>
    </div>
  );
};
