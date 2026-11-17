import { Box, Button, Typography } from '@mui/material';
import { getErrorMessage } from 'react-error-boundary';
import type { ErrorFallbackProps } from '../../types/errorTypes';

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  const errorMessage = getErrorMessage(error) ?? 'An unexpected error occurred';

  return (
    <Box
      role="alert"
      sx={{
        margin: '24px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" component="h1">
        Something weird happened
      </Typography>
      <Typography variant="h6" component="h2">
        This is what it was:
      </Typography>
      <Typography color="error" variant="body1">
        {errorMessage}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Refresh the page to try again
      </Button>
    </Box>
  );
};

export default ErrorFallback;
