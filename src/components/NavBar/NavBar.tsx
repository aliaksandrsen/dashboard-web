import { useState } from 'react';
import { Box, Button, Drawer } from '@mui/material';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NavLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  font-weight: 500;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const MobileToggleButton = styled(Button)`
  margin: 8px;
`;

const navContent = (onNavigate?: () => void) => (
  <nav aria-label="Main navigation">
    <NavList>
      <li>
        <NavLink to="/" onClick={onNavigate}>
          Orders
        </NavLink>
      </li>
      <li>
        <NavLink to="/actions" onClick={onNavigate}>
          Actions
        </NavLink>
      </li>
      <li>
        <NavLink to="/" onClick={onNavigate}>
          Products
        </NavLink>
      </li>
      <li>
        <NavLink to="/" onClick={onNavigate}>
          Settings
        </NavLink>
      </li>
      <li>
        <NavLink to="/" onClick={onNavigate}>
          Logout
        </NavLink>
      </li>
    </NavList>
  </nav>
);

const NavBar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
        {navContent(closeMobileNav)}
      </Drawer>

      <Drawer anchor="left" variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' } }}>
        {navContent()}
      </Drawer>
    </Box>
  );
};

export default NavBar;
