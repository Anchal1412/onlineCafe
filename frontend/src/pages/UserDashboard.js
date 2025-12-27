import React, { useState, useEffect, useRef} from "react";
import io from 'socket.io-client';
import api from "../utils/axiosConfig";
import Header from "../components/Header";
import UserLogin from "../components/UserLogin";
import UserRegister from "../components/UserRegister";
import ChatModal from "../components/ChatModal";
import "./UserDashboard.css";
import Cookies from "js-cookie";
import ChatList from "../components/ChatList";
const ENV = process.env;

const UserDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const socketRef = useRef();
  const [activeSection, setActiveSection] = useState('admins'); // 'admins' or 'chats'
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    const token = Cookies.get("userToken");
    if (token) {
      setIsAuthenticated(true);
      fetchAdmins();
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get(
        ENV.REACT_APP_ADMIN_API_URL + "/admin/activeAdmins"
      );
      setAdmins(response.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const handleLogin = (userData) => {
    Cookies.set("userToken", userData.token, {
      expires: 1, // 1 day
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    setIsAuthenticated(true);
    fetchAdmins();
  };

  const handleRegister = () => {
    setShowLogin(true);
  };

  const handleLogout = () => {
    Cookies.remove("userToken", {
      path: "/",
      secure: true,
      sameSite: "strict",
    });
    setIsAuthenticated(false);
    
    // Disconnect socket if exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const handleChatClick = (admin) => {
    setSelectedAdmin(admin);
    setShowChat(true);
    setActiveSection('chats');
    setActiveChatId(admin.adminId);
  };

  const handleSelectChat = (chat) => {
    const admin = admins.find(a => a.adminId === chat.participantId);
    if (admin) {
      setSelectedAdmin(admin);
      setShowChat(true);
      setActiveChatId(chat.participantId);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedAdmin(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Connect to chat service
      const socket = io(process.env.REACT_APP_CHAT_API_URL);
      socketRef.current = socket;      
      
      // Register user when socket connects
      socket.on('connect', () => {
        const userId = JSON.parse(atob(Cookies.get('userToken').split('.')[1])).id;
        socket.emit('registerUser', userId);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
      
      return () => {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
      };
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="user-auth-page">
        <Header
          title="User Portal"
          subtitle="Connect with Service Providers"
          logoUrl="/OnlineCafe.png"
        />
        <div className="auth-container">
          {showLogin ? (
            <>
              <UserLogin onLogin={handleLogin} />
              <div className="auth-toggle">
                <p>
                  Don't have an account?
                  <button onClick={() => setShowLogin(false)}>Register</button>
                </p>
              </div>
            </>
          ) : (
            <>
              <UserRegister onRegister={handleRegister} />
              <div className="auth-toggle">
                <p>
                  Already have an account?
                  <button onClick={() => setShowLogin(true)}>Login</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header
        title="Online Cafe"
        subtitle="Hi there! Connect with our service agents."
        logoUrl="/OnlineCafe.png"
      >
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </Header>
      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button
            className={activeSection === 'admins' ? 'active' : ''}
            onClick={() => setActiveSection('admins')}
          >
            Available Admins
          </button>
          <button
            className={activeSection === 'chats' ? 'active' : ''}
            onClick={() => setActiveSection('chats')}
          >
            My Chats
          </button>
        </nav>
        
        <div className="dashboard-main">
          {activeSection === 'admins' ? (
            <div className="admin-grid">
              {admins.map((admin) => (
                <div key={admin.adminId} className="admin-card">
                  <div className="admin-header">
                    <h3>{admin.name}</h3>
                    <span
                      className={`status-indicator ${
                        admin.isOnline ? "online" : "offline"
                      }`}
                    >
                      {admin.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="admin-details">
                    <div className="detail-item">
                      <span className="label">Expertise:</span>
                      <span className="value">{admin.expertise}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Bio:</span>
                      <p className="value bio">{admin.bio}</p>
                    </div>
                    <div className="detail-item">
                      <span className="label">Rating:</span>
                      <div className="rating-display">
                        <span className="stars">
                          {"★".repeat(Math.floor(admin.rating))}
                          {"☆".repeat(5 - Math.floor(admin.rating))}
                        </span>
                        <span className="rating-text">
                          ({admin.rating.toFixed(1)} / 5)
                        </span>
                        <span className="total-ratings">
                          ({admin.totalRatings} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button
                      className={`chat-button ${!admin.isOnline ? "disabled" : ""}`}
                      onClick={() => handleChatClick(admin)}
                      disabled={!admin.isOnline}
                    >
                      Chat Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-section">
              <ChatList
                userType="user"
                userId={JSON.parse(atob(Cookies.get('userToken').split('.')[1])).id}
                onSelectChat={handleSelectChat}
                activeChatId={activeChatId}
                socketRef={socketRef}
              />
              {showChat && selectedAdmin && (
                <ChatModal
                  selectedAdmin={selectedAdmin}
                  onClose={handleCloseChat}
                  socketRef={socketRef}
                  initiateConnection={true}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
