import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

type InternalLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

export default function InternalLink({
  prefetch = false,
  ...props
}: InternalLinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
