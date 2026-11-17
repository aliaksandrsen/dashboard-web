import SearchIcon from '@mui/icons-material/Search';
import { Input, InputAdornment, InputLabel } from '@mui/material';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

export type SearchBarProps = {
  name: string;
  onSubmitSearch: (searchText: string) => void;
};

interface SearchFormValues {
  search: string;
}

const FullWidthForm = styled.form`
  width: 450px;
  max-width: 100%;

  @media (max-width: 500px) {
    width: 100%;
  }
`;

const ErrorMessage = styled.span`
  color: #d32f2f;
  display: block;
  font-size: 0.75rem;
  margin-top: 4px;
`;

const SearchBar = (props: SearchBarProps) => {
  const { name, onSubmitSearch } = props;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    defaultValues: { search: '' },
  });

  const inputId = `${name}-search`;
  const errorId = `${name}-search-error`;
  const { ref, ...searchRegisterProps } = register('search', {
    required: 'Please enter a search term',
    minLength: {
      value: 3,
      message: 'Search text must be at least 3 characters',
    },
    maxLength: {
      value: 15,
      message: 'Search text must be at most 15 characters',
    },
  });

  return (
    <FullWidthForm
      aria-label={`${name} search form`}
      noValidate
      onSubmit={handleSubmit((data) => onSubmitSearch(data.search))}
    >
      <InputLabel htmlFor={inputId}>Search {name}</InputLabel>
      <Input
        id={inputId}
        placeholder={`Search ${name}...`}
        type="search"
        fullWidth
        error={Boolean(errors.search)}
        inputRef={ref}
        slotProps={{
          input: {
            maxLength: 15,
            minLength: 3,
            required: true,
            'aria-invalid': errors.search ? 'true' : 'false',
            ...(errors.search ? { 'aria-describedby': errorId } : {}),
          },
        }}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon aria-hidden="true" />
          </InputAdornment>
        }
        {...searchRegisterProps}
      />
      {errors.search && (
        <ErrorMessage id={errorId} role="alert">
          {errors.search.message}
        </ErrorMessage>
      )}
    </FullWidthForm>
  );
};

export default SearchBar;
