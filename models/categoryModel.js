const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subcategories: [
      {
        type: String,
        required: true,
      },
    ],
    archivedSubcategories: [
      {
        type: String,
      },
    ],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
