import { createResource } from './db';
import { seedSellers } from './seedData';

const resource = createResource('sellers', seedSellers);

export const getSellers = resource.getAll;
export const getSeller = resource.getById;
export const createSeller = resource.create;
export const updateSeller = resource.update;
export const deleteSeller = resource.remove;
export const deleteSellers = resource.removeMany;

// Workflow helpers — thin wrappers around update() so callers read like
// intent ("approveSeller") rather than a generic status patch.
export const approveSeller = (id) => resource.update(id, { status: 'approved' });
export const rejectSeller = (id) => resource.update(id, { status: 'rejected' });
export const suspendSeller = (id) => resource.update(id, { status: 'suspended' });
export const reinstateSeller = (id) => resource.update(id, { status: 'approved' });
