const Product = require("../models/productModel");
const { createAuditNotification } = require('../services/notificationService');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = search
      ? { productName: { $regex: search, $options: "i" } }
      : {};
    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    next(error);
    res.status(500).json({ message: error.message });
  }
};

//Bulk creeation
exports.bulkCreateProducts = async (req, res, next) => {
  try {
    const products = req.body;
    const userEmail = req.headers['user-email'];

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    console.log('Received products:', products); // Debug log

    const validProducts = products.filter(
      (productData) => productData.productCategory && productData.productName
    );

    if (validProducts.length === 0) {
      return res.status(400).json({ error: "No valid products to insert" });
    }

    try {
      const createdProducts = await Product.insertMany(
        validProducts.map((productData) => ({
          manufacturerName: productData.manufacturerName,
          brand: productData.brand,
          productCategory: productData.productCategory,
          productSubcategory: productData.productSubcategory || "",
          productName: productData.productName,
          variantType: productData.variantType || "",
          variant: productData.variant || "",
          weight: productData.weight || productData.weightInKg || 0,
          weightInKg: productData.weightInKg || 0,
          imageUrl: productData.imageUrl,
          createdBy: userEmail
        }))
      );

      // Create notification for bulk creation
      await createAuditNotification(userEmail, 'BULK_CREATE', {
        productCount: createdProducts.length
      });

      res.status(201).json(createdProducts);
    } catch (insertError) {
      console.error("Insertion error:", insertError);
      return res.status(500).json({ 
        error: "Error during bulk insert",
        details: insertError.message 
      });
    }
  } catch (error) {
    console.error("Error during product creation:", error);
    next(error);
  }
};



// Cgeck for duplicates
exports.checkForDuplicates = async (req, res) => {
  try {
    const products = req.body;

    const duplicateNames = new Set();
    for (const productData of products) {
      const existingProduct = await Product.findOne({
        productName: productData.productName,
        manufacturerName: productData.manufacturerName,
        variant: productData.variant,
      });

      if (existingProduct) {
        duplicateNames.add(productData.productName);
      }
    }

    res.status(200).json(Array.from(duplicateNames));
  } catch (error) {
    res.status(500).json({ error: "Failed to check for duplicates 😔" });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found 😔" });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// Create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const userEmail = req.headers['user-email'];
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    const newProduct = await Product.create(req.body);

    // Create audit notification
    await createAuditNotification(userEmail, 'CREATE', {
      productId: newProduct._id,
      productName: newProduct.productName
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create error:', error);
    next(error);
  }
};

// Update a product by ID
exports.updateProduct = async (req, res, next) => {
  try {
    const userEmail = req.user.email; // Make sure this is passed from the auth middleware
    const productId = req.params.id;

    // Get original product
    const originalProduct = await Product.findById(productId);
    if (!originalProduct) {
      return res.status(404).json({ message: "Product not found 😔" });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );

    // Create audit notification
    await createAuditNotification(userEmail, 'UPDATE', {
      productId: updatedProduct._id,
      productName: updatedProduct.productName,
      changes: {
        from: {
          name: originalProduct.productName,
          category: originalProduct.productCategory,
          manufacturer: originalProduct.manufacturerName
        },
        to: {
          name: updatedProduct.productName,
          category: updatedProduct.productCategory,
          manufacturer: updatedProduct.manufacturerName
        }
      }
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// Archive a product by ID
exports.archiveProduct = async (req, res, next) => {
  try {
    const userEmail = req.headers['user-email'];
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found 😔" });
    }

    const archivedProduct = await Product.findByIdAndUpdate(
      productId,
      { isArchived: true },
      { new: true }
    );

    if (!archivedProduct) {
      return res.status(500).json({ message: "Failed to archive product" });
    }

    await createAuditNotification(userEmail, 'ARCHIVE', {
      productId: archivedProduct._id,
      productName: archivedProduct.productName
    });

    res.status(200).json({ 
      message: "Product archived successfully 🗄️", 
      product: archivedProduct 
    });
  } catch (error) {
    console.error('Archive error:', error);
    next(error);
  }
};

// Unarchive a product by ID
exports.unarchiveProduct = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found 😔" });
    }

    const unarchivedProduct = await Product.findByIdAndUpdate(
      productId,
      { isArchived: false },
      { new: true }
    );

    await createAuditNotification(userEmail, 'UNARCHIVE', {
      productId: unarchivedProduct._id,
      productName: unarchivedProduct.productName
    });

    res.status(200).json({ message: "Product unarchived successfully 📂", unarchivedProduct });
  } catch (error) {
    next(error);
  }
};


// Delete a product by ID
exports.deleteProduct = async (req, res, next) => {
  try {
    const userEmail = req.headers['user-email'];
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found 😔" });
    }

    await createAuditNotification(userEmail, 'DELETE', {
      productId: product._id,
      productName: product.productName
    });

    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully 🎉" });
  } catch (error) {
    console.error('Delete error:', error);
    next(error);
  }
};
