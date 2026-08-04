import { createCmsSingleton } from './cmsBackend';
import { seedContactSettings } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const DEFAULT_CONTACT = {
  ...seedContactSettings,
  office: seedContactSettings.office || 'Remote-first support team',
  formTitle: 'Send us a message',
  formDescription: 'Questions about an order, dispute, payout, or becoming a seller? Our team is here to help.',
  supportHours: 'Monday–Friday, 9am–6pm CST. We typically reply within one business day.',
};

const resource = createCmsSingleton(CMS_KEYS.CONTACT, DEFAULT_CONTACT);

export const getContactSettings = resource.get;
export const updateContactSettings = resource.update;
