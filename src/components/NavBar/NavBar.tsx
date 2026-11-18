import { useState } from 'react';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
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

const BrandTitle = styled(Typography)`
  font-weight: 700;
  font-size: 1.375rem;
  color: #374151;
  padding: 0 12px 24px;
  letter-spacing: -0.02em;
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
  gap: 8px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover,
  &:focus-visible {
    background-color: #e5e7eb;
    color: #111827;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }

  &[aria-current='page'] {
    background-color: #6b7280;
    color: #ffffff;
    font-weight: 600;
    border-left: 4px solid #1f2937;
  }
`;

const MobileToggleButton = styled(Button)`
  margin: 8px;
`;

const NavContent = ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => (
  <SidebarInner>
    <BrandTitle variant="h6">TestsTore</BrandTitle>
    <Nav aria-label="Main navigation">
      <NavList>
        <li>
          <NavLink
            to="/"
            aria-current={pathname === '/' || pathname.startsWith('/orders') ? 'page' : undefined}
            onClick={onNavigate}
          >
            <GridViewRoundedIcon fontSize="small" aria-hidden="true" />
            <span>Orders</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/actions"
            aria-current={pathname === '/actions' ? 'page' : undefined}
            onClick={onNavigate}
          >
            <PersonOutlineRoundedIcon fontSize="small" aria-hidden="true" />
            <span>Actions</span>
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
      <MobileToggleButton
        aria-label="Toggle navigation"
        aria-expanded={isMobileOpen}
        onClick={toggleMobileNav}
        sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
      >
        Menu
      </MobileToggleButton>

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
