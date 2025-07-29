import { useState} from 'react';
import { Send, MessageCircle, LogOut, UserPlus, LogIn } from 'lucide-react';

const API_BASE_URL = 'https://80e80162-bd11-4f2a-8dcb-cdac4143ea72-00-2h6gxhwu18rrl.pike.replit.dev'; // No trailing slash!

const SimpleChatApp = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'chat'
  const [user, setUser] = useState(null); // { username, user_id }
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '' });

  // Handle login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (data.success) {
        setUser({ username: data.username, user_id: data.user_id });
        setCurrentView('chat');
        loadChatHistory(data.username);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (data.success) {
        setUser({ username: data.username, user_id: data.user_id });
        setCurrentView('chat');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Send message to AI
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');

    // Add user message to conversations immediately
    const newConversation = {
      id: Date.now(),
      user_message: userMessage,
      ai_response: '...',
      timestamp: new Date().toISOString(),
      loading: true
    };
    setConversations(prev => [newConversation, ...prev]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          message: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the conversation with AI response
        setConversations(prev =>
          prev.map(conv =>
            conv.id === newConversation.id
              ? {
                  id: data.conversation_id,
                  user_message: data.user_message,
                  ai_response: data.ai_response,
                  timestamp: data.timestamp,
                  loading: false
                }
              : conv
          )
        );
      } else {
        setError(data.error || 'Failed to send message');
        // Remove the failed message
        setConversations(prev => prev.filter(conv => conv.id !== newConversation.id));
      }
    } catch (err) {
      setError('Failed to connect to server');
      setConversations(prev => prev.filter(conv => conv.id !== newConversation.id));
    } finally {
      setLoading(false);
    }
  };

  // Load chat history
  const loadChatHistory = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${username}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setConversations([]);
    setCurrentView('login');
    setLoginForm({ username: '', password: '' });
    setRegisterForm({ username: '', password: '' });
  };

  // Handle key press for Enter key
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action(e);
    }
  };

  // Render login form
  const renderLogin = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <LogIn className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Login</h1>
        <p className="text-gray-600 mt-2">Sign in to start chatting with AI</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={loginForm.username}
            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => handleKeyPress(e, handleLogin)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => handleKeyPress(e, handleLogin)}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setCurrentView('register');
            setError('');
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Don't have an account? Register here
        </button>
      </div>
    </div>
  );

  // Render register form
  const renderRegister = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <UserPlus className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Register</h1>
        <p className="text-gray-600 mt-2">Create an account to start chatting</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={registerForm.username}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => handleKeyPress(e, handleRegister)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password (min 4 characters)
          </label>
          <input
            type="password"
            value={registerForm.password}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => handleKeyPress(e, handleRegister)}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading || registerForm.password.length < 4}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setCurrentView('login');
            setError('');
          }}
          className="text-green-600 hover:text-green-800"
        >
          Already have an account? Login here
        </button>
      </div>
    </div>
  );

  // Render chat interface
  const renderChat = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user.username}!</span>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No conversations yet. Start chatting with AI!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="space-y-2">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-md">
                  <p>{conv.user_message}</p>
                  <p className="text-xs text-blue-100 mt-1">
                    {new Date(conv.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-md">
                  {conv.loading ? (
                    <div className="animate-pulse">Thinking...</div>
                  ) : (
                    <p className="whitespace-pre-wrap">{conv.ai_response}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            onKeyPress={(e) => handleKeyPress(e, sendMessage)}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      {error && currentView === 'chat' && (
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {currentView === 'login' && renderLogin()}
      {currentView === 'register' && renderRegister()}
      {currentView === 'chat' && renderChat()}
    </div>
  );
};

export default SimpleChatApp;