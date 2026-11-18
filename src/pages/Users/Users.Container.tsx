import { useContext, useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import { useUsers } from '../../hooks/useUsers';
import {
  type UserInfoData,
  changeProductSearch,
  setActiveUser,
  updateUsersList,
  userStore,
} from '../UserInfo/UserInfo.State';

interface CreateUserValues {
  name: string;
  email: string;
  address: string;
}

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
`;

const TopBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: #111827;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Panel = styled.section`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
`;

const UsersList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserCard = styled.li`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  background-color: #f9fafb;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const UserNameLink = styled(SafeLink)`
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    color: #0b57d0;
  }
`;

const UserSubtext = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const StyledInput = styled.input`
  font: inherit;
  font-size: max(1rem, 0.875rem);
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid #767676;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 1px;
  }
`;

const ErrorText = styled.span`
  color: #d32f2f;
  font-size: 0.75rem;
`;

const Users = () => {
  const userSnap = useSnapshot(userStore);
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const idPrefix = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { usersAreLoading, usersError, usersData, refetchUsers } = useUsers(searchTerm);

  useEffect(() => {
    if (usersData && !searchTerm.trim()) {
      updateUsersList(usersData);
    }
  }, [usersData, searchTerm]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', address: '' },
  });

  const onCreateUser = async (values: CreateUserValues) => {
    setStatusBanner(null);
    try {
      const response = await axios.post('/v1/users', {
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      });
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await refetchUsers();
      reset();
      setStatusBanner({
        type: 'success',
        text: `User "${response.data?.name ?? values.name}" created (#${response.data?.id ?? ''}).`,
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to create user.')
        : 'Failed to create user.';
      setStatusBanner({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const handleDeleteUser = async (user: UserInfoData) => {
    if (!user.id) return;
    setStatusBanner(null);
    try {
      await axios.delete(`/v1/users/${user.id}`);
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await refetchUsers();
      setStatusBanner({ type: 'success', text: `Deleted user "${user.name}".` });
    } catch {
      setStatusBanner({ type: 'error', text: `Failed to delete user "${user.name}".` });
    }
  };

  const searchInputId = `${idPrefix}-users-search`;
  const nameId = `${idPrefix}-user-name`;
  const emailId = `${idPrefix}-user-email`;
  const addressId = `${idPrefix}-user-address`;

  const visibleUsers = usersData ?? [];

  return (
    <Container component="section" maxWidth="xl">
      <Header
        userName={userSnap.user.name}
        joinedDate={userSnap.user.joinedDate}
        onSubmitSearch={(query) => {
          changeProductSearch(query);
          navigate('/products');
        }}
      />

      <PageBody>
        <TopBar>
          <PageTitle>Users Directory</PageTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FieldLabel htmlFor={searchInputId}>Filter users</FieldLabel>
            <StyledInput
              id={searchInputId}
              type="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </TopBar>

        {statusBanner && (
          <Alert
            severity={statusBanner.type}
            role={statusBanner.type === 'error' ? 'alert' : 'status'}
            onClose={() => setStatusBanner(null)}
          >
            {statusBanner.text}
          </Alert>
        )}

        <TwoColumnGrid>
          <Panel aria-label="Registered users">
            <PanelTitle>All Users</PanelTitle>
            {usersAreLoading ? (
              <CircularProgress data-testid="users-loading-circle" />
            ) : usersError ? (
              <Alert
                severity="error"
                action={
                  <Button size="small" onClick={() => refetchUsers()}>
                    Retry
                  </Button>
                }
              >
                Failed to load users
              </Alert>
            ) : visibleUsers.length === 0 ? (
              <UserSubtext>No users found.</UserSubtext>
            ) : (
              <UsersList>
                {visibleUsers.map((user) => {
                  const isActive = user.id !== undefined && user.id === userSnap.activeUserId;
                  return (
                    <UserCard key={user.id ?? user.email}>
                      <UserMeta>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserNameLink to={`/users/${user.id}`}>{user.name}</UserNameLink>
                          {isActive && <Chip label="Active" size="small" color="primary" />}
                        </div>
                        <UserSubtext>
                          {user.email} · {user.address} · {user.recentOrders} orders
                        </UserSubtext>
                      </UserMeta>
                      <CardActions>
                        {!isActive && user.id !== undefined && (
                          <Button
                            size="small"
                            variant="outlined"
                            type="button"
                            onClick={() => {
                              setActiveUser(user.id!);
                              setStatusBanner({
                                type: 'success',
                                text: `Active user switched to "${user.name}".`,
                              });
                            }}
                          >
                            Set Active
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          component={SafeLink}
                          to={`/users/${user.id}`}
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          type="button"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => handleDeleteUser(user)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </UserCard>
                  );
                })}
              </UsersList>
            )}
          </Panel>

          <Panel aria-labelledby={`${idPrefix}-create-user-title`}>
            <PanelTitle id={`${idPrefix}-create-user-title`}>Create User</PanelTitle>
            <FormStack
              aria-labelledby={`${idPrefix}-create-user-title`}
              noValidate
              onSubmit={handleSubmit(onCreateUser)}
            >
              <FieldGroup>
                <FieldLabel htmlFor={nameId}>Full Name</FieldLabel>
                <StyledInput
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={errors.name ? 'true' : 'false'}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor={emailId}>Email Address</FieldLabel>
                <StyledInput
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
                {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor={addressId}>Shipping Address</FieldLabel>
                <StyledInput
                  id={addressId}
                  type="text"
                  autoComplete="street-address"
                  required
                  aria-invalid={errors.address ? 'true' : 'false'}
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && <ErrorText>{errors.address.message}</ErrorText>}
              </FieldGroup>

              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </FormStack>
          </Panel>
        </TwoColumnGrid>
      </PageBody>
    </Container>
  );
};

export default Users;
