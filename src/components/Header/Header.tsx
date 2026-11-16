import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { Typography, colors } from '@mui/material';
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

const UserAccountContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserAccountInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export interface HeaderProps {
  userName: string;
  joinedDate: string;
  onSubmitSearch: (searchText: string) => void;
}

const getCustomerSinceYear = (joinedDate: string): number | null => {
  if (!joinedDate) return null;
  const parsedDate = new Date(joinedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getFullYear();
};

const Header = (props: HeaderProps) => {
  const { userName, joinedDate, onSubmitSearch } = props;
  const customerSinceYear = getCustomerSinceYear(joinedDate);

  return (
    <StyledHeader aria-label="Page header">
      <SearchBar name="products" onSubmitSearch={onSubmitSearch} />
      <UserAccountContainer>
        <AccountCircleRoundedIcon aria-hidden="true" />
        <UserAccountInfo>
          <Typography>{userName}</Typography>
          <Typography color={colors.grey[700]} variant="body2">
            {customerSinceYear !== null ? `Customer since ${customerSinceYear}` : 'Customer'}
          </Typography>
        </UserAccountInfo>
      </UserAccountContainer>
    </StyledHeader>
  );
};

export default Header;
