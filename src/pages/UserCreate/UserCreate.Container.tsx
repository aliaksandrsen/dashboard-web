import { useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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
import type { ApiUser } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

interface CreateUserValues {
  name: string;
  email: string;
  address: string;
}

const UserCreate = () => {
  useDocumentTitle('Create User');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { name: '', email: '', address: '' },
  });

  const onSubmit = async (values: CreateUserValues) => {
    setSubmitError(null);
    try {
      const response = await axios.post<ApiUser>('/v1/users', {
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ['users'] });

      navigate('/users', {
        state: {
          flash: {
            type: 'success',
            text: `User "${response.data?.name ?? values.name.trim()}" created successfully.`,
          },
        },
      });
    } catch (error) {
      setSubmitError(extractApiError(error, 'Failed to create user.'));
    }
  };

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const addressId = `${idPrefix}-address`;

  return (
    <PageWrapper>
      <Breadcrumbs items={[{ label: 'Users', to: '/users' }, { label: 'Create User' }]} />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Create User</PageTitle>
          <PageSubtitle>Register a new customer record.</PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      <FormCardPanel>
        {submitError && (
          <Alert severity="error" role="alert">
            {submitError}
          </Alert>
        )}

        <FormStack noValidate onSubmit={handleSubmit(onSubmit)}>
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
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
            <Button component={Link} to="/users" variant="outlined" color="secondary">
              Cancel
            </Button>
          </FormActionsRow>
        </FormStack>
      </FormCardPanel>
    </PageWrapper>
  );
};

export default UserCreate;
