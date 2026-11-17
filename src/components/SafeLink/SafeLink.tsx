import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps, useInRouterContext } from 'react-router-dom';

interface SafeLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: ReactNode;
}

const SafeLink = ({ to, children, ...rest }: SafeLinkProps) => {
  const inRouter = useInRouterContext();

  if (inRouter) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={to} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  );
};

export default SafeLink;
