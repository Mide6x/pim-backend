const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'ARCHIVE', 'UNARCHIVE',
      'VARIANT_CREATE', 'VARIANT_UPDATE', 'VARIANT_DELETE',
      'MANUFACTURER_CREATE', 'MANUFACTURER_UPDATE', 'MANUFACTURER_DELETE',
      'APPROVAL_SUBMIT', 'APPROVAL_ACCEPT', 'APPROVAL_REJECT'
    ],
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productCount: {
    type: Number,
    required: false
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: false
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
    required: false
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
