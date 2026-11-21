import { useEffect, useId, useRef } from 'react';
import Button from '@mui/material/Button';
import styled from 'styled-components';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const NativeDialog = styled.dialog`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  max-width: 440px;
  width: calc(100% - 32px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  background-color: #ffffff;
  color: #0f172a;

  &[open] {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &:modal {
    overscroll-behavior: contain;
  }

  &::backdrop {
    background-color: rgba(15, 23, 42, 0.5);
    overflow: hidden;
    overscroll-behavior: contain;
  }
`;

const DialogHeading = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
`;

const DialogDescription = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #475569;
`;

const DialogActions = styled.form`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`;

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onCancelRef.current = onCancel;
    onConfirmRef.current = onConfirm;
  }, [onCancel, onConfirm]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
    } else if (dialog.open || dialog.hasAttribute('open')) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const value = dialog.returnValue;
      dialog.returnValue = '';
      if (value === 'confirm') {
        onConfirmRef.current();
      } else if (open) {
        onCancelRef.current();
      }
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [open]);

  const handleManualCancel = () => {
    const dialog = dialogRef.current;
    if (dialog && typeof dialog.close === 'function' && dialog.open) {
      dialog.close('cancel');
    } else {
      onCancel();
    }
  };

  const handleManualConfirm = () => {
    const dialog = dialogRef.current;
    if (dialog && typeof dialog.close === 'function' && dialog.open) {
      dialog.close('confirm');
    } else {
      onConfirm();
    }
  };

  return (
    <NativeDialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <DialogHeading id={titleId}>{title}</DialogHeading>
      <DialogDescription id={descId}>{description}</DialogDescription>
      <DialogActions
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          autoFocus
          disabled={isConfirming}
          onClick={handleManualCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="error"
          disabled={isConfirming}
          onClick={handleManualConfirm}
        >
          {isConfirming ? 'Deleting...' : confirmLabel}
        </Button>
      </DialogActions>
    </NativeDialog>
  );
};

export default ConfirmDialog;
