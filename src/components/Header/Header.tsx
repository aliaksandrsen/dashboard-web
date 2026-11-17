import { useState } from 'react';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { Badge, IconButton, Popover, Typography, colors } from '@mui/material';
import styled from 'styled-components';
import SearchBar from '../../elements/SearchBar';

const StyledHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;

  @media (max-width: 500px) {
    flex-direction: column-reverse;
    width: 100%;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 500px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const UserAccountContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAccountInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const NotificationBox = styled.div`
  padding: 16px;
  max-width: 280px;
`;

export interface HeaderProps {
  userName: string;
  joinedDate: string;
  onSubmitSearch: (searchText: string) => void;
  searchName?: string;
}

const getCustomerSinceYear = (joinedDate: string): number | null => {
  if (!joinedDate) return null;
  const parsedDate = new Date(joinedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getFullYear();
};

const Header = (props: HeaderProps) => {
  const { userName, joinedDate, onSubmitSearch, searchName = 'products' } = props;
  const customerSinceYear = getCustomerSinceYear(joinedDate);
  const [notifAnchor, setNotifAnchor] = useState<HTMLButtonElement | null>(null);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotifAnchor(null);
  };

  const isNotifOpen = Boolean(notifAnchor);

  return (
    <StyledHeader aria-label="Page header">
      <SearchBar name={searchName} onSubmitSearch={onSubmitSearch} />
      <RightSection>
        <UserAccountContainer>
          <AccountCircleRoundedIcon fontSize="large" aria-hidden="true" />
          <UserAccountInfo>
            <Typography sx={{ fontWeight: 600 }}>{userName || 'Guest User'}</Typography>
            <Typography color={colors.grey[700]} variant="body2">
              {customerSinceYear !== null ? `Customer since ${customerSinceYear}` : 'Customer'}
            </Typography>
          </UserAccountInfo>
        </UserAccountContainer>

        <IconButton
          type="button"
          aria-label="Notifications"
          aria-expanded={isNotifOpen}
          onClick={handleOpenNotifications}
          sx={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            '&:hover': { backgroundColor: '#e5e7eb' },
          }}
        >
          <Badge color="secondary" variant="dot">
            <NotificationsNoneRoundedIcon aria-hidden="true" />
          </Badge>
        </IconButton>

        <Popover
          open={isNotifOpen}
          anchorEl={notifAnchor}
          onClose={handleCloseNotifications}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <NotificationBox>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your order statuses and Stripe sync updates appear automatically on your dashboard.
            </Typography>
          </NotificationBox>
        </Popover>
      </RightSection>
    </StyledHeader>
  );
};

export default Header;
