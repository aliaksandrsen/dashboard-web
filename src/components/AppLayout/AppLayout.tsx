import Box, { type BoxProps } from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import NavBar from '../NavBar';

const AppContainer = styled(Box)<BoxProps>`
  display: flex;

  @media (max-width: 599.95px) {
    flex-direction: column;
  }
`;

const CurrentScreen = styled(Box)<BoxProps>`
  width: calc(100% - 240px);
  margin-left: 240px;

  @media (max-width: 599.95px) {
    margin-left: 0;
    width: 100%;
  }
`;

const AppLayout = () => (
  <AppContainer>
    <NavBar />
    <CurrentScreen component="main">
      <Outlet />
    </CurrentScreen>
  </AppContainer>
);

export default AppLayout;
