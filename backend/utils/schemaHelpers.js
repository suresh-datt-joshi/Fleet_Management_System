import mongoose from 'mongoose';

export const auditFields = {
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
};

export const softDeleteFields = {
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
};

export const applySoftDeleteQuery = (schema) => {
  schema.query.notDeleted = function notDeleted() {
    return this.where({ isDeleted: false });
  };
};

export default { auditFields, softDeleteFields, applySoftDeleteQuery };
