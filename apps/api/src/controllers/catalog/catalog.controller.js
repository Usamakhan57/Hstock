import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as catalogService from '../../services/catalog.service.js';

function listHandler(listFn, message) {
  return asyncHandler(async (req, res) => {
    const result = await listFn(req.query);
    return sendSuccess(res, {
      message,
      data: result.items,
      meta: result.meta,
    });
  });
}

export const listCategories = listHandler(catalogService.listCategories, 'Categories');
export const listBrands = listHandler(catalogService.listBrands, 'Brands');
export const listTags = listHandler(catalogService.listTags, 'Tags');

export const getCategory = asyncHandler(async (req, res) => {
  const data = await catalogService.getCategory(req.params.idOrSlug);
  return sendSuccess(res, { message: 'Category', data });
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = await catalogService.createCategory(req.body, req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Category created', data });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await catalogService.updateCategory(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { message: 'Category updated', data });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const data = await catalogService.deleteCategory(req.params.id, req.user.id);
  return sendSuccess(res, { message: 'Category deleted', data });
});

export const getBrand = asyncHandler(async (req, res) => {
  const data = await catalogService.getBrand(req.params.idOrSlug);
  return sendSuccess(res, { message: 'Brand', data });
});

export const createBrand = asyncHandler(async (req, res) => {
  const data = await catalogService.createBrand(req.body, req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Brand created', data });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const data = await catalogService.updateBrand(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { message: 'Brand updated', data });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const data = await catalogService.deleteBrand(req.params.id, req.user.id);
  return sendSuccess(res, { message: 'Brand deleted', data });
});

export const getTag = asyncHandler(async (req, res) => {
  const data = await catalogService.getTag(req.params.idOrSlug);
  return sendSuccess(res, { message: 'Tag', data });
});

export const createTag = asyncHandler(async (req, res) => {
  const data = await catalogService.createTag(req.body, req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Tag created', data });
});

export const updateTag = asyncHandler(async (req, res) => {
  const data = await catalogService.updateTag(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { message: 'Tag updated', data });
});

export const deleteTag = asyncHandler(async (req, res) => {
  const data = await catalogService.deleteTag(req.params.id);
  return sendSuccess(res, { message: 'Tag deleted', data });
});
