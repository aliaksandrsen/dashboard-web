import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styled from 'styled-components';
import {
  CardPanel,
  DetailList,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  PanelTitle,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { StripeSyncResponse } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

const SettingsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 720px;
`;

const SyncDescription = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #475569;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const ResultCard = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ResultLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
`;

const ResultValue = styled.strong`
  font-size: 1.25rem;
  color: #0f172a;
`;

const Settings = () => {
  useDocumentTitle('Settings');

  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [lastResult, setLastResult] = useState<StripeSyncResponse['result'] | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await axios.post<StripeSyncResponse>('/v1/jobs/sync-stripe', {});
      setLastResult(res.data.result);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({
        type: 'success',
        text: `${res.data.message} (processed: ${res.data.result.processed}, created: ${res.data.result.created}, skipped: ${res.data.result.skipped})`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: extractApiError(error, 'Failed to trigger Stripe synchronization.'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Settings</PageTitle>
          <PageSubtitle>Manage external integrations and scheduled background jobs.</PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      {feedback && (
        <Alert
          severity={feedback.type}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          onClose={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}

      <SettingsStack>
        <CardPanel aria-labelledby="stripe-sync-heading">
          <PanelTitle id="stripe-sync-heading">Stripe Orders Synchronization</PanelTitle>
          <SyncDescription>
            Reconcile Stripe invoices from the last 24 hours with database orders. Existing invoices
            are skipped safely to prevent duplicate revenue records.
          </SyncDescription>

          <DetailList>
            <dt>Scheduled Job</dt>
            <dd>sync_stripe_orders</dd>
            <dt>Default Schedule</dt>
            <dd>Daily at 00:05 (America/New_York)</dd>
          </DetailList>

          <div>
            <Button
              type="button"
              variant="contained"
              color="primary"
              disabled={isSyncing}
              onClick={() => void handleTriggerSync()}
            >
              {isSyncing ? 'Running Sync...' : 'Sync Stripe Orders Now'}
            </Button>
          </div>

          {lastResult && (
            <ResultGrid aria-label="Last synchronization result">
              <ResultCard>
                <ResultLabel>Processed</ResultLabel>
                <ResultValue>{lastResult.processed}</ResultValue>
              </ResultCard>
              <ResultCard>
                <ResultLabel>Created</ResultLabel>
                <ResultValue>{lastResult.created}</ResultValue>
              </ResultCard>
              <ResultCard>
                <ResultLabel>Skipped</ResultLabel>
                <ResultValue>{lastResult.skipped}</ResultValue>
              </ResultCard>
            </ResultGrid>
          )}
        </CardPanel>
      </SettingsStack>
    </PageWrapper>
  );
};

export default Settings;
