import { useState } from 'react';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, Button, Drawer, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const SidebarInner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 16px;
  box-sizing: border-box;
`;

const BrandLink = styled(Link)`
  display: inline-block;
  font-weight: 700;
  font-size: 1.375rem;
  color: #0f172a;
  padding: 0 12px 24px;
  letter-spacing: -0.02em;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
    border-radius: 6px;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  border-left: 4px solid transparent;
  color: #334155;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover,
  &:focus-visible {
    background-color: #e2e8f0;
    color: #0f172a;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }

  &[aria-current='page'] {
    background-color: #dbeafe;
    color: #1e3a8a;
    font-weight: 700;
    border-left-color: #1d4ed8;
  }
`;

const MobileBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
`;

const NavContent = ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => (
  <SidebarInner>
    <BrandLink to="/" onClick={onNavigate}>
      TestsTore
    </BrandLink>
    <Nav aria-label="Main navigation">
      <NavList>
        <li>
          <NavLink to="/" aria-current={pathname === '/' ? 'page' : undefined} onClick={onNavigate}>
            <GridViewRoundedIcon fontSize="small" aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/orders"
            aria-current={pathname.startsWith('/orders') ? 'page' : undefined}
            onClick={onNavigate}
          >
            <ReceiptLongOutlinedIcon fontSize="small" aria-hidden="true" />
            <span>Orders</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/products"
            aria-current={pathname.startsWith('/products') ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Inventory2OutlinedIcon fontSize="small" aria-hidden="true" />
            <span>Products</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/users"
            aria-current={pathname.startsWith('/users') ? 'page' : undefined}
            onClick={onNavigate}
          >
            <GroupOutlinedIcon fontSize="small" aria-hidden="true" />
            <span>Users</span>
          </NavLink>
        </li>
      </NavList>

      <NavList>
        <li>
          <NavLink
            to="/settings"
            aria-current={pathname === '/settings' ? 'page' : undefined}
            onClick={onNavigate}
          >
            <SettingsOutlinedIcon fontSize="small" aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
        </li>
      </NavList>
    </Nav>
  </SidebarInner>
);

const NavBar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const toggleMobileNav = () => setIsMobileOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileOpen(false);

  return (
    <Box component="aside" aria-label="Sidebar navigation">
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <MobileBar>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
            TestsTore
          </Typography>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<MenuRoundedIcon aria-hidden="true" />}
            aria-label="Toggle navigation"
            aria-expanded={isMobileOpen}
            onClick={toggleMobileNav}
          >
            Menu
          </Button>
        </MobileBar>
      </Box>

      <Drawer
        anchor="left"
        variant="temporary"
        open={isMobileOpen}
        onClose={closeMobileNav}
        ModalProps={{ keepMounted: false }}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        <NavContent pathname={pathname} onNavigate={closeMobileNav} />
      </Drawer>

      <Drawer anchor="left" variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' } }}>
        <NavContent pathname={pathname} />
      </Drawer>
    </Box>
  );
};

export default NavBar;
