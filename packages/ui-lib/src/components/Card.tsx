import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
