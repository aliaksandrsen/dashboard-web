import { useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  FormActionsRow,
  FormCardPanel,
  FormStack,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  TextInput,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUser } from '../../hooks/useUsers';
import { extractApiError } from '../../utils/helpers';

interface EditUserValues {
  name: string;
  email: string;
  address: string;
}

const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { isLoading, error, data: user, refetch } = useUser(id);
  useDocumentTitle(user ? `Edit ${user.name}` : 'Edit User');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { name: '', email: '', address: '' },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        address: user.address,
      });
    }
  }, [user, reset]);

  const onSaveUser = async (values: EditUserValues) => {
    if (!id) return;
    setSubmitError(null);
    try {
      await axios.patch(`/v1/users/${id}`, {
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ['user', id] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });

      navigate(`/users/${id}`, {
        state: {
          flash: {
            type: 'success',
            text: 'User profile updated successfully.',
          },
        },
      });
    } catch (err) {
      setSubmitError(extractApiError(err, 'Failed to update user.'));
    }
  };

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const addressId = `${idPrefix}-address`;

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Users', to: '/users' },
          { label: user ? user.name : `User #${id ?? ''}`, to: `/users/${id ?? ''}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Edit User</PageTitle>
          <PageSubtitle>Update customer contact details and shipping address.</PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      {isLoading ? (
        <CircularProgress data-testid="user-edit-loading" />
      ) : error || !user ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          User #{id} could not be loaded.
        </Alert>
      ) : (
        <FormCardPanel>
          {submitError && (
            <Alert severity="error" role="alert">
              {submitError}
            </Alert>
          )}

          <FormStack noValidate onSubmit={handleSubmit(onSaveUser)}>
            <FieldGroup>
              <FieldLabel htmlFor={nameId}>
                Full Name <span aria-hidden="true">*</span>
              </FieldLabel>
              <TextInput
                id={nameId}
                type="text"
                autoComplete="name"
                required
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? `${nameId}-error` : undefined}
                {...register('name', {
                  required: 'Name is required',
                  validate: (v) => v.trim().length > 0 || 'Name is required',
                })}
              />
              {errors.name && <FieldError id={`${nameId}-error`}>{errors.name.message}</FieldError>}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor={emailId}>
                Email Address <span aria-hidden="true">*</span>
              </FieldLabel>
              <TextInput
                id={emailId}
                type="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? `${emailId}-error` : undefined}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <FieldError id={`${emailId}-error`}>{errors.email.message}</FieldError>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor={addressId}>
                Shipping Address <span aria-hidden="true">*</span>
              </FieldLabel>
              <TextInput
                id={addressId}
                type="text"
                autoComplete="street-address"
                required
                aria-invalid={errors.address ? 'true' : 'false'}
                aria-describedby={errors.address ? `${addressId}-error` : undefined}
                {...register('address', {
                  required: 'Address is required',
                  validate: (v) => v.trim().length > 0 || 'Address is required',
                })}
              />
              {errors.address && (
                <FieldError id={`${addressId}-error`}>{errors.address.message}</FieldError>
              )}
            </FieldGroup>

            <FormActionsRow>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Customer Changes'}
              </Button>
              <Button component={Link} to={`/users/${id}`} variant="outlined" color="secondary">
                Cancel
              </Button>
            </FormActionsRow>
          </FormStack>
        </FormCardPanel>
      )}
    </PageWrapper>
  );
};

export default UserEdit;
