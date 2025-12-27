import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import './ChatList.css';
const ENV = process.env;

const ChatList = ({ userType, userId, onSelectChat, activeChatId, socketRef }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
    
    if (socketRef.current) {
      // Listen for new messages to update chat list
      socketRef.current.on('receiveMessage', (message) => {
        updateChatWithNewMessage(message);
      });

      return () => {
        socketRef.current.off('receiveMessage');
      };
    }
  }, []);

  const fetchChats = async () => {
    try {
      let postfixUrl = 'userConnections';
      if (userType === 'admin') {
        postfixUrl = 'adminConnections';
      }
      
      // Get the connection IDs
      const url = `${process.env.REACT_APP_CHAT_API_URL}/chats/${postfixUrl}`;
      const response = await api.get(url);
      const connectionIds = response.data;
      
      if (!connectionIds || connectionIds.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }
      
      // Fetch details for each connection ID
      const chatsWithDetails = await Promise.all(
        connectionIds.map(async (participantId) => {
          try {
            // Choose API endpoint based on user type
            const detailsUrl = userType === 'user' 
              ? `${process.env.REACT_APP_ADMIN_API_URL}/admin/profile/${participantId}` 
              : `${process.env.REACT_APP_USER_API_URL}/user/profile/${participantId}`;
            
            const detailsResponse = await api.get(detailsUrl);
            const participantDetails = detailsResponse.data;
            
            // Get the last message for this conversation
            const messagesUrl = `${process.env.REACT_APP_CHAT_API_URL}/chats/${userType}/${participantId}`;
            const messagesResponse = await api.get(messagesUrl);
            const messages = messagesResponse.data;
            
            const lastMessage = messages.length > 0 
              ? messages[messages.length - 1] 
              : null;
            
            return {
              participantId,
              participantName: participantDetails.name || 'Unknown',
              lastMessage: lastMessage ? lastMessage.message : 'No messages yet',
              lastMessageTime: lastMessage ? lastMessage.timestamp : new Date(),
              unreadCount: 0 // You might need to implement a way to track unread messages
            };
          } catch (error) {
            console.error(`Error fetching details for ${participantId}:`, error);
            // Return a placeholder for failed fetches
            return {
              participantId,
              participantName: 'Unknown User',
              lastMessage: 'Unable to load messages',
              lastMessageTime: new Date(),
              unreadCount: 0
            };
          }
        })
      );
      
      // Sort chats by most recent message
      const sortedChats = chatsWithDetails.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
      
      setChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChatWithNewMessage = (message) => {
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => 
        chat.participantId === (userType === 'user' ? message.adminId : message.userId)
      );

      if (chatIndex === -1) {
        // New chat
        return [{
          participantId: userType === 'user' ? message.adminId : message.userId,
          participantName: message.senderName,
          lastMessage: message.message,
          lastMessageTime: message.timestamp,
          unreadCount: 1
        }, ...prevChats];
      }

      // Update existing chat
      const updatedChats = [...prevChats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        lastMessage: message.message,
        lastMessageTime: message.timestamp,
        unreadCount: activeChatId === message.chatId ? 0 : 
          (updatedChats[chatIndex].unreadCount + 1)
      };

      return updatedChats;
    });
  };

  const handleChatSelect = (chat) => {
    // Reset unread count when selecting a chat
    setChats(prevChats => 
      prevChats.map(c => 
        c.participantId === chat.participantId 
          ? { ...c, unreadCount: 0 } 
          : c
      )
    );
    onSelectChat(chat);
  };

  if (loading) {
    return <div className="chat-list-loading">Loading chats...</div>;
  }

  return (
    <div className="chat-list">
      <h3>Your Conversations</h3>
      {chats.length === 0 ? (
        <div className="no-chats">No conversations yet</div>
      ) : (
        <div className="chats-container">
          {chats.map((chat) => (
            <div
              key={chat.participantId}
              className={`chat-item ${
                activeChatId === chat.participantId ? 'active' : ''
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <h4>{chat.participantName}</h4>
                  <span className="last-message-time">
                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="last-message">{chat.lastMessage}</p>
                {chat.unreadCount > 0 && (
                  <span className="unread-count">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
