import { createCmsList } from './cmsBackend';
import { seedEmailTemplates } from './seedData';
import { CMS_KEYS } from '../../services/cmsApi';

const resource = createCmsList(CMS_KEYS.EMAIL_TEMPLATES, seedEmailTemplates);

export const getEmailTemplates = resource.getAll;
export const getEmailTemplate = resource.getById;
export const createEmailTemplate = resource.create;
export const updateEmailTemplate = resource.update;
export const deleteEmailTemplate = resource.remove;
export const deleteEmailTemplates = resource.removeMany;
