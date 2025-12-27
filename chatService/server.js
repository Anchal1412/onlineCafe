const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Chat = require('./models/Chat');
const logger = require('./middleware/logger');
const routes = require('./routes/chatRoutes');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Add logger middleware
app.use(logger);

// Store user/admin socket mappings
const userSockets = new Map();
const adminSockets = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // User/Admin registration
  socket.on('registerUser', (userId) => {
    userSockets.set(userId, socket.id);
    console.log('User registered:', userId);
  });

  socket.on('registerAdmin', (adminId) => {
    adminSockets.set(adminId, socket.id);
    console.log('Admin registered:', adminId);
  });

  // Chat messaging
  socket.on('sendMessage', async ({ senderId, receiverId, message, senderType }) => {
    try {
      // Save message to database
      const chat = new Chat({
        userId: senderType === 'user' ? senderId : receiverId,
        adminId: senderType === 'admin' ? senderId : receiverId,
        message,
        sender: senderType
      });
      await chat.save();

      // Send to recipient
      const recipientSocket = senderType === 'user' 
        ? adminSockets.get(receiverId)
        : userSockets.get(receiverId);

      if (recipientSocket) {
        io.to(recipientSocket).emit('receiveMessage', {
          senderId,
          message,
          timestamp: new Date(),
          senderType
        });
      }
    } catch (error) {
      console.error('Error saving/sending message:', error);
    }
  });

  // Fetch chat history
  socket.on('fetchChatHistory', async ({ userId, adminId }) => {
    try {
      const messages = await Chat.find({
        userId,
        adminId
      }).sort({ timestamp: 1 });
      
      socket.emit('chatHistory', messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    // Remove socket mappings
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    for (const [adminId, socketId] of adminSockets.entries()) {
      if (socketId === socket.id) {
        adminSockets.delete(adminId);
        break;
      }
    }
  });
});

app.use('/', routes);
// Add a simple endpoint to test the logger
app.get('/', (req, res) => {
  res.json({ status: 'Chat Service is running' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));