import { Link } from 'react-router-dom';
import styled from 'styled-components';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Nav = styled.nav`
  font-size: 0.875rem;
  color: #475569;
`;

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const Item = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const CrumbLink = styled(Link)`
  color: #1d4ed8;
  text-decoration: none;
  font-weight: 500;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const CurrentLabel = styled.span`
  color: #0f172a;
  font-weight: 600;
`;

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <Nav aria-label="Breadcrumb">
      <List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Item key={`${item.label}-${index}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast || !item.to ? (
                <CurrentLabel aria-current={isLast ? 'page' : undefined}>{item.label}</CurrentLabel>
              ) : (
                <CrumbLink to={item.to}>{item.label}</CrumbLink>
              )}
            </Item>
          );
        })}
      </List>
    </Nav>
  );
};

export default Breadcrumbs;
