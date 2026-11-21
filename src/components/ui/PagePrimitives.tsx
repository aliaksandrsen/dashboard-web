import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 0 48px;
`;

export const PageHeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

export const PageHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: #0f172a;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #475569;
`;

export const PageHeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

export const FilterToolbar = styled.div.attrs({ role: 'search' })`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
`;

export const SearchInputBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 280px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #767676;
  border-radius: 8px;
  background-color: #ffffff;

  &:focus-within {
    outline: 3px solid #0b57d0;
    outline-offset: 1px;
    border-color: #0b57d0;
  }
`;

export const ToolbarSearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 8px 0;
  font: inherit;
  font-size: max(1rem, 0.9375rem);
  color: #0f172a;

  &:focus {
    outline: none;
  }
`;

export const ToolbarSelect = styled.select`
  font: inherit;
  font-size: max(1rem, 0.9375rem);
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #767676;
  border-radius: 8px;
  background-color: #ffffff;
  color: #0f172a;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid #0b57d0;
    outline-offset: 1px;
  }
`;

export const CardPanel = styled.section`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FormCardPanel = styled(CardPanel)`
  max-width: 640px;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #0f172a;
`;

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
`;

export const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
`;

export const TextInput = styled.input`
  font: inherit;
  font-size: max(1rem, 1em);
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #767676;
  border-radius: 8px;
  background-color: #ffffff;
  color: #0f172a;
  box-sizing: border-box;

  &:focus-visible {
    outline: 3px solid #0b57d0;
    outline-offset: 2px;
  }

  &[aria-invalid='true'] {
    border-color: #dc2626;
  }
`;

export const SelectInput = styled.select`
  font: inherit;
  font-size: max(1rem, 1em);
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #767676;
  border-radius: 8px;
  background-color: #ffffff;
  color: #0f172a;
  box-sizing: border-box;

  &:focus-visible {
    outline: 3px solid #0b57d0;
    outline-offset: 2px;
  }
`;

export const FieldHint = styled.span`
  font-size: 0.8125rem;
  color: #475569;
`;

export const FieldError = styled.span`
  color: #b91c1c;
  font-size: 0.8125rem;
  font-weight: 500;
`;

export const FormActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
`;

export const DetailList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px 16px;
  font-size: 0.9375rem;

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }

  dt {
    color: #475569;
    font-weight: 500;
  }

  dd {
    margin: 0;
    color: #0f172a;
    font-weight: 600;
    word-break: break-word;
  }
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  clip-path: inset(50%);
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  white-space: nowrap;
`;

export const EmptyStateText = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.9375rem;
`;

export const BadgePill = styled.span<{ $tone?: 'neutral' | 'accent' }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ $tone }) => ($tone === 'accent' ? '#dbeafe' : '#f1f5f9')};
  color: ${({ $tone }) => ($tone === 'accent' ? '#1e40af' : '#334155')};
`;
