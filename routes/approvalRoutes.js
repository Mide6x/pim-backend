const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");

router.get("/", approvalController.getAllAwaitingApproval);
router.post("/", approvalController.createApproval);
router.put("/:id", approvalController.updateApproval);
router.delete("/:id", approvalController.deleteApproval);
router.delete("/approved", approvalController.deleteAllApprovedProducts);
router.post("/bulk-approve", approvalController.bulkApprove);
router.post("/delete-duplicates", approvalController.deleteDuplicates);

module.exports = router;
