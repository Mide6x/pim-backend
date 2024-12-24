const Notification = require('../models/notificationModel');

const createAuditNotification = async (userEmail, actionType, details) => {
  try {
    let message = '';
    
    switch (actionType) {
      case 'BULK_CREATE':
        message = `${userEmail} added ${details.productCount} products to the database`;
        break;
      case 'CREATE':
        message = `${userEmail} created product: ${details.productName}`;
        break;
      case 'UPDATE':
        const changes = [];
        const { from, to } = details.changes;
        
        if (from.name !== to.name) {
          changes.push(`name from "${from.name}" to "${to.name}"`);
        }
        if (from.category !== to.category) {
          changes.push(`category from "${from.category}" to "${to.category}"`);
        }
        if (from.manufacturer !== to.manufacturer) {
          changes.push(`manufacturer from "${from.manufacturer}" to "${to.manufacturer}"`);
        }
        
        message = changes.length > 0 
          ? `${userEmail} updated product ${details.productName} (${changes.join(', ')})`
          : `${userEmail} updated product ${details.productName}`;
        break;
      case 'DELETE':
        message = `${userEmail} deleted product: ${details.productName}`;
        break;
      case 'ARCHIVE':
        message = `${userEmail} archived product: ${details.productName}`;
        break;
      case 'UNARCHIVE':
        message = `${userEmail} unarchived product: ${details.productName}`;
        break;
      case 'VARIANT_CREATE':
        message = `${userEmail} created new variant for product: ${details.productName}`;
        break;
      case 'VARIANT_UPDATE':
        message = `${userEmail} updated variant for product: ${details.productName}`;
        break;
      case 'VARIANT_DELETE':
        message = `${userEmail} deleted variant from product: ${details.productName}`;
        break;
      case 'MANUFACTURER_CREATE':
        message = `${userEmail} added new manufacturer: ${details.manufacturerName}`;
        break;
      case 'MANUFACTURER_UPDATE':
        message = `${userEmail} updated manufacturer: ${details.manufacturerName}`;
        break;
      case 'MANUFACTURER_DELETE':
        message = `${userEmail} deleted manufacturer: ${details.manufacturerName}`;
        break;
      case 'APPROVAL_SUBMIT':
        message = `${userEmail} submitted ${details.productCount} products for approval`;
        break;
      case 'APPROVAL_ACCEPT':
        message = `${userEmail} approved ${details.productCount} products`;
        break;
      case 'APPROVAL_REJECT':
        message = `${userEmail} rejected ${details.productCount} products`;
        break;
    }

    await Notification.create({
      message,
      userEmail,
      actionType,
      productId: details.productId,
      productCount: details.productCount,
      manufacturerId: details.manufacturerId,
      variantId: details.variantId
    });

  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = { createAuditNotification }; 