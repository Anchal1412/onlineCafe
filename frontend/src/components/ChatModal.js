import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import "./ChatModal.css";
import api from "../utils/axiosConfig";

const ChatModal = ({ selectedAdmin, onClose, socketRef }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef();

  // Fetch chat history when component mounts
  useEffect(() => {
    if (selectedAdmin && (selectedAdmin.adminId || selectedAdmin._id)) {
      fetchChatHistory();
    }

    // Listen for new messages
    if (socketRef.current?.connected) {
      socketRef.current.off("receiveMessage");
      socketRef.current.on("receiveMessage", (message) => {
        setMessages((prev) => [...prev, message]);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off("receiveMessage");
      }
    };
  }, [selectedAdmin]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("adminToken") || Cookies.get("userToken");
      const userType = Cookies.get("adminToken") ? "admin" : "user";
      
      const response = await api.get(`${process.env.REACT_APP_CHAT_API_URL}/chats/${userType}/${(selectedAdmin.adminId || selectedAdmin._id)}`);
      
      console.log("Chat history received:", response.data);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socketRef.current?.connected) return;

    const token = Cookies.get("adminToken") || Cookies.get("userToken");
    const tokenData = JSON.parse(atob(token.split(".")[1]));
    const isAdmin = !!Cookies.get("adminToken");
    
    const messageId = `local-${Date.now()}`;
    const newMsg = {
      _id: messageId,
      message: newMessage,
      sender: isAdmin ? "admin" : "user",
      timestamp: new Date(),
      userId: isAdmin ? selectedAdmin._id : tokenData.id,
      adminId: isAdmin ? tokenData.id : selectedAdmin.adminId
    };

    if(messages.length === 0){
      newMsg.startConnection = true
    }
    // Optimistically add message to UI
    setMessages((prev) => [...prev, newMsg]);

    // Send message to server
    const response = await api.post(`${process.env.REACT_APP_CHAT_API_URL}/chats/sendMessage`, {
      ...newMsg
    });
    setNewMessage("");
  };

  return (
    <div className="chat-modal">
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat with {selectedAdmin.name}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="chat-messages">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUserAdmin = !!Cookies.get("adminToken");
              
              // Determine if this message was sent by the current user
              const isCurrentUserMessage = 
                (isCurrentUserAdmin && msg.sender === "admin") || 
                (!isCurrentUserAdmin && msg.sender === "user");
              
              return (
                <div
                  key={msg._id || index}
                  className={`message ${isCurrentUserMessage ? "sent" : "received"}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                      {msg.status === "sending" && " ⌛"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;