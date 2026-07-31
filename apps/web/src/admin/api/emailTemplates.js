import { createResource } from './db';
import { seedEmailTemplates } from './seedData';

const resource = createResource('email_templates', seedEmailTemplates);

export const getEmailTemplates = resource.getAll;
export const getEmailTemplate = resource.getById;
export const updateEmailTemplate = resource.update;
