import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as inventoryService from '../../services/inventory.service.js';

export const replaceInventory = asyncHandler(async (req, res) => {
  const data = await inventoryService.replaceProductInventory(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Product inventory updated',
    data,
  });
});

export const listInventory = asyncHandler(async (req, res) => {
  const data = await inventoryService.listProductInventory(
    req.params.id,
    req.user,
    { includeSold: req.query?.includeSold === 'true' },
  );
  return sendSuccess(res, {
    message: 'Product inventory',
    data,
  });
});

export default {
  replaceInventory,
  listInventory,
};
