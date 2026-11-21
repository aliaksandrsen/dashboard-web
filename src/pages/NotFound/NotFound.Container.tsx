import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import {
  CardPanel,
  EmptyStateText,
  FormActionsRow,
  PageHeaderRow,
  PageHeaderText,
  PageTitle,
  PageWrapper,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page Not Found');

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Page Not Found</PageTitle>
        </PageHeaderText>
      </PageHeaderRow>

      <CardPanel style={{ maxWidth: 540 }}>
        <EmptyStateText>
          The page you are looking for does not exist or has been moved.
        </EmptyStateText>
        <FormActionsRow>
          <Button component={Link} to="/" variant="contained" color="primary">
            Go to Dashboard
          </Button>
          <Button component={Link} to="/orders" variant="outlined" color="secondary">
            View Orders
          </Button>
        </FormActionsRow>
      </CardPanel>
    </PageWrapper>
  );
};

export default NotFound;
