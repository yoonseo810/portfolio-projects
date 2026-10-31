import type { AnchorHTMLAttributes } from "react";

/** Link that opens in a new tab safely and tells screen-reader users it does. */
export function ExternalLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}{" "}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
