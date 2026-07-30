import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

productImageSchema.index({ product: 1, sortOrder: 1 });

const ProductImage =
  mongoose.models.ProductImage || mongoose.model('ProductImage', productImageSchema);

export default ProductImage;
