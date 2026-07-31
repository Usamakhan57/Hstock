import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as productService from '../../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.user || null);
  return sendSuccess(res, {
    message: 'Products',
    data: result.items,
    meta: result.meta,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const data = await productService.getProduct(req.params.idOrSlug, req.user || null);
  return sendSuccess(res, { message: 'Product', data });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = await productService.createProduct(req.body, req.user);
  return sendSuccess(res, { statusCode: 201, message: 'Product created', data });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = await productService.updateProduct(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Product updated', data });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const data = await productService.deleteProduct(req.params.id, req.user);
  return sendSuccess(res, { message: 'Product deleted', data });
});

export const submitProduct = asyncHandler(async (req, res) => {
  const data = await productService.submitProduct(req.params.id, req.user);
  return sendSuccess(res, { message: 'Product submitted for approval', data });
});

export const moderateProduct = asyncHandler(async (req, res) => {
  const data = await productService.moderateProduct(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Product moderated', data });
});

export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitProduct,
  moderateProduct,
};
