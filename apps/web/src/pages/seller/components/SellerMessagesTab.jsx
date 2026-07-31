import React from 'react';
import { MessageCircle } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';

/**
 * Secure dispute chat / order messaging belongs to a later phase.
 * Keep the tab shell without mock StoreContext purchase threads.
 */
const SellerMessagesTab = () => (
  <EmptyState
    icon={MessageCircle}
    title="Messaging coming soon"
    description="Buyer–seller dispute chat will appear here in a later phase."
  />
);

export default SellerMessagesTab;
