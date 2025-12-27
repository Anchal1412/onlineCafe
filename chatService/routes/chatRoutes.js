const express = require('express');
const { verifyAnyToken, verifyUserToken, verifyAdminToken} = require('../middleware/authMiddleware.js');
const chatController = require('../controllers/chatController.js');

const router = express.Router();

router.get("/chats/:userType/:id", verifyAnyToken, chatController.getAllChats);
router.post("/chats/sendMessage", verifyAnyToken, chatController.sendMessage);
router.get("/chats/userConnections", verifyUserToken, chatController.getUserConnections);
router.get("/chats/adminConnections", verifyAdminToken, chatController.getAdminConnections);
module.exports = router;