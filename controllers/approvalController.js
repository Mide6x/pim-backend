const Approval = require("../models/approvalModel");
const { createAuditNotification } = require('../services/notificationService');

// Get all products awaiting approval
exports.getAllAwaitingApproval = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const approvals = await Approval.find(query);
    res.status(200).json(approvals);
  } catch (error) {
    next(error);
    res.status(500).json({ message: error.message });
  }
};

// Create new products awaiting approval
exports.createApproval = async (req, res, next) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const createdApprovals = [];
    for (const productData of products) {
      const approval = new Approval({
        manufacturerName: productData.manufacturerName,
        brand: productData.brand,
        productCategory: productData.productCategory,
        productSubcategory: productData.productSubcategory,
        productName: productData.productName,
        variantType: productData.variantType,
        variant: productData.variant,
        weightInKg: productData.weightInKg,
        imageUrl: productData.imageUrl,
        createdBy: productData.createdBy,
      });

      const savedApproval = await approval.save();
      createdApprovals.push(savedApproval);
    }

    res.status(201).json(createdApprovals);
  } catch (error) {
    console.error("Error saving products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a product awaiting approval by ID
exports.updateApproval = async (req, res, next) => {
  try {
    const updateData = req.body;
    const userEmail = req.headers['user-email'];

    if (updateData.productSubcategory === undefined) {
      updateData.productSubcategory = "";
    }

    const updatedApproval = await Approval.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedApproval) {
      return res.status(404).json({ message: "Product not found 😔" });
    }

    // Create notification for the approval update
    if (updateData.status === 'approved') {
      await createAuditNotification(userEmail, 'APPROVAL_ACCEPT', {
        productName: updatedApproval.productName,
        productId: updatedApproval._id,
        productCount: 1
      });
    } else if (updateData.status === 'rejected') {
      await createAuditNotification(userEmail, 'APPROVAL_REJECT', {
        productName: updatedApproval.productName,
        productId: updatedApproval._id,
        productCount: 1
      });
    }

    res.status(200).json(updatedApproval);
  } catch (error) {
    next(error);
  }
};

// Delete a product awaiting approval by ID
exports.deleteApproval = async (req, res, next) => {
  try {
    const deletedApproval = await Approval.findByIdAndDelete(req.params.id);
    if (!deletedApproval) {
      return res.status(404).json({ message: "Product not found 😔" });
    }
    res.status(204).json({ message: "Product deleted 🫢" });
  } catch (error) {
    next(error);
  }
};
// Bulk approve products
exports.bulkApprove = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userEmail = req.user.email;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid data format or empty list" });
    }

    const result = await Approval.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "approved" } },
      { multi: true }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No products found to approve" });
    }

    await createAuditNotification(userEmail, 'APPROVAL_ACCEPT', {
      productCount: result.modifiedCount
    });

    res.status(200).json({ message: "Products approved successfully", result });
  } catch (error) {
    next(error);
  }
};

// delete all approved products
exports.deleteAllApprovedProducts = async (req, res) => {
  try {
    const result = await Approval.deleteMany({ status: "approved" });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        message: "No approved products found to delete" 
      });
    }
    
    res.status(200).json({
      message: `${result.deletedCount} approved products deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting approved products:", error);
    res.status(500).json({ 
      message: "Failed to delete approved products",
      error: error.message 
    });
  }
};

// Delete duplicate products
exports.deleteDuplicates = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userEmail = req.headers['user-email'];

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid data format or empty list" });
    }

    // Get product names before deletion for notification
    const productsToDelete = await Approval.find({ _id: { $in: ids } });
    const result = await Approval.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount > 0) {
      await createAuditNotification(userEmail, 'APPROVAL_REJECT', {
        productCount: result.deletedCount,
        productNames: productsToDelete.map(p => p.productName).join(', ')
      });
    }

    res.status(200).json({ 
      message: result.deletedCount > 0 
        ? "Duplicate products deleted successfully 🎉" 
        : "No duplicate products found to delete 😔",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting duplicates:", error);
    next(error);
  }
};
