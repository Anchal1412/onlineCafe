const Chat = require('../models/Chat');
const Connection = require('../models/Connection');

const getUserConnections = async (req, res) => {
    try {
        const connections = await Connection.getUserConnections(req.userId);
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching user connections:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAdminConnections = async (req, res) => {
    try {
        const connections = await Connection.getAdminConnections(req.adminId);
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching admin connections:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllChats = async (req, res) => {
    try {
        let userId, adminId;
        if(req.params.userType === 'user'){
            userId = req.userId;
            adminId = req.params.id;
        } else{
            userId = req.params.id;
            adminId = req.adminId;
        }

        if (!userId || !adminId) {
            return res.status(400).json({ message: 'User ID and Admin ID are required' });
        }

        const chats = await Chat.find({
            userId: userId,
            adminId: adminId
        }).sort({ timestamp: 1 });

        res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const sendMessage = async (req, res) => {
    try{
        const { userId, adminId, message, image, sender, startConnection } = req.body;

        if (!userId || !adminId || !sender) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Save message to database
        const chat = new Chat({
            userId,
            adminId,
            message,
            image,
            sender
        });
        await chat.save();

        if(sender === 'user' && startConnection){
            const userConnection = await Connection.findOrCreateConnection(userId);
            await userConnection.addAdmin(adminId);
        }
        
        // Send to recipient
        // Note: You'll need to access socket.io instance properly - this may need adjustment
        // const recipientSocket = senderType === 'user' 
        //     ? adminSockets.get(adminId)
        //     : userSockets.get(adminId);

        // if (recipientSocket) {
        //     io.to(recipientSocket).emit('receiveMessage', {
        //         senderId,
        //         message,
        //         timestamp: new Date(),
        //         senderType
        //     });
        // }

        res.status(200).json({ message: 'Message sent' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserConnections,
    getAdminConnections,
    getAllChats,
    sendMessage
};