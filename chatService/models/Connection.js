const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  // The user's ID as string
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Array of admin IDs this user has chatted with
  connectedAdminIds: [{
    type: String
  }]
}, { timestamps: true });

// Create index for efficient queries
connectionSchema.index({ userId: 1, connectedAdminIds: 1 });

// Helper methods to manage connections

// Add admin to user's connections
connectionSchema.methods.addAdmin = async function(adminId) {
  if (!this.connectedAdminIds.includes(adminId)) {
    this.connectedAdminIds.push(adminId);
    await this.save();
  }
  return this;
};

// Static method to find or create connection
connectionSchema.statics.findOrCreateConnection = async function(userId) {
  let connection = await this.findOne({ userId });
  
  if (!connection) {
    connection = new this({ userId, connectedAdminIds: [] });
    await connection.save();
  }
  
  return connection;
};

// Static method to get user's admin connections - returns admin IDs only
connectionSchema.statics.getUserConnections = async function(userId) {
  const connection = await this.findOne({ userId });
  
  if (!connection) {
    return [];
  }
  
  // Just return the array of admin IDs
  return connection.connectedAdminIds;
};

// Static method to get admin's user connections - returns user IDs only
connectionSchema.statics.getAdminConnections = async function(adminId) {
  const connections = await this.find({ 
    connectedAdminIds: adminId 
  });
  
  // Return just the user IDs
  return connections.map(conn => conn.userId);
};

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;