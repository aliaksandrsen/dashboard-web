import { useContext, useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import { changeProductSearch, updateUser, userStore } from '../UserInfo/UserInfo.State';
import useUserInfo from '../UserInfo/useUserInfo';

interface AccountFormValues {
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

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: #111827;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 900px) {
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
  gap: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
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

const Settings = () => {
  const userSnap = useSnapshot(userStore);
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const idPrefix = useId();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const { userData, refetchUser } = useUserInfo();

  useEffect(() => {
    if (userData && !userStore.user.name) {
      updateUser(userData);
    }
  }, [userData]);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
  } = useForm<AccountFormValues>({
    mode: 'onBlur',
    defaultValues: {
      name: userSnap.user.name ?? '',
      email: userSnap.user.email ?? '',
      address: userSnap.user.address ?? '',
    },
  });

  useEffect(() => {
    resetProfile({
      name: userSnap.user.name ?? '',
      email: userSnap.user.email ?? '',
      address: userSnap.user.address ?? '',
    });
  }, [userSnap.user.name, userSnap.user.email, userSnap.user.address, resetProfile]);

  const onSaveAccount = async (values: AccountFormValues) => {
    setFeedback(null);
    try {
      const targetId = userSnap.user.id;
      const response = targetId
        ? await axios.patch(`/v1/users/${targetId}`, values)
        : await axios.post('/v1/users', values);

      updateUser({
        ...userSnap.user,
        id: response.data?.id ?? targetId,
        name: response.data?.name ?? values.name,
        email: response.data?.email ?? values.email,
        address: response.data?.address ?? values.address,
      });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await refetchUser();
      setFeedback({ type: 'success', text: 'Account settings saved.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to save account settings.' });
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await axios.post<{
        message: string;
        result: { processed: number; created: number; skipped: number };
      }>('/v1/jobs/sync-stripe', {});
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      setFeedback({
        type: 'success',
        text: `${res.data.message} (processed: ${res.data.result.processed}, created: ${res.data.result.created}, skipped: ${res.data.result.skipped})`,
      });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to trigger Stripe synchronization.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const nameId = `${idPrefix}-settings-name`;
  const emailId = `${idPrefix}-settings-email`;
  const addressId = `${idPrefix}-settings-address`;

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
        <PageTitle>Account &amp; System Settings</PageTitle>

        {feedback && (
          <Alert
            severity={feedback.type}
            role={feedback.type === 'error' ? 'alert' : 'status'}
            onClose={() => setFeedback(null)}
          >
            {feedback.text}
          </Alert>
        )}

        <CardsGrid>
          <Panel aria-labelledby={`${idPrefix}-profile-heading`}>
            <PanelTitle id={`${idPrefix}-profile-heading`}>
              {userSnap.user.id
                ? `Active User Profile (#${userSnap.user.id})`
                : 'Create User Profile'}
            </PanelTitle>
            <FormStack
              aria-labelledby={`${idPrefix}-profile-heading`}
              noValidate
              onSubmit={handleProfileSubmit(onSaveAccount)}
            >
              <FieldGroup>
                <FieldLabel htmlFor={nameId}>Full Name</FieldLabel>
                <StyledInput
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={profileErrors.name ? 'true' : 'false'}
                  {...registerProfile('name', { required: 'Full name is required' })}
                />
                {profileErrors.name && <ErrorText>{profileErrors.name.message}</ErrorText>}
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
                  aria-invalid={profileErrors.email ? 'true' : 'false'}
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
                {profileErrors.email && <ErrorText>{profileErrors.email.message}</ErrorText>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor={addressId}>Shipping Address</FieldLabel>
                <StyledInput
                  id={addressId}
                  type="text"
                  autoComplete="street-address"
                  required
                  aria-invalid={profileErrors.address ? 'true' : 'false'}
                  {...registerProfile('address', { required: 'Address is required' })}
                />
                {profileErrors.address && <ErrorText>{profileErrors.address.message}</ErrorText>}
              </FieldGroup>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button type="submit" variant="contained" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button component={SafeLink} to="/users" variant="outlined">
                  Manage All Users
                </Button>
              </div>
            </FormStack>
          </Panel>

          <Panel aria-labelledby={`${idPrefix}-jobs-heading`}>
            <PanelTitle id={`${idPrefix}-jobs-heading`}>Background Jobs</PanelTitle>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>
              Manually synchronize Stripe invoices with database orders via{' '}
              <code>POST /v1/jobs/sync-stripe</code>.
            </p>
            <div>
              <Button
                type="button"
                variant="contained"
                disabled={isSyncing}
                onClick={handleTriggerSync}
              >
                {isSyncing ? 'Running Sync...' : 'Run Stripe Orders Sync'}
              </Button>
            </div>
          </Panel>
        </CardsGrid>
      </PageBody>
    </Container>
  );
};

export default Settings;
