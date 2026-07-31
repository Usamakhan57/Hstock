import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    image: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    showInHeader: {
      type: Boolean,
      default: false,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    seoTitle: {
      type: String,
      default: null,
    },
    seoDescription: {
      type: String,
      default: null,
    },
    ogImage: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ status: 1, displayOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
