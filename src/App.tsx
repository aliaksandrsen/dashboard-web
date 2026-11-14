import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import Box, { type BoxProps } from '@mui/material/Box';
import { RouterProvider } from 'react-router-dom';
import styled from 'styled-components';
import theme from './theme';
import router from './routes';

const AppContainer = styled(Box)<BoxProps>`
  display: flex;
`;

const CurrentScreen = styled(Box)<BoxProps>`
  width: calc(100% - 240px);
  margin-left: 240px;
`;

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AppContainer component="main">
          <CurrentScreen component="section">
            <RouterProvider router={router} />
          </CurrentScreen>
        </AppContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
