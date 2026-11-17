import Box, { type BoxProps } from '@mui/material/Box';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { logError } from '../../utils/helpers';
import { ErrorFallback } from '../ErrorFallbacks';
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

const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <AppContainer>
      <NavBar />
      <CurrentScreen component="main">
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={logError}
              onReset={reset}
              resetKeys={[pathname]}
            >
              <Outlet />
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </CurrentScreen>
    </AppContainer>
  );
};

export default AppLayout;
