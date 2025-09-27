import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { lightTheme, darkTheme } from './styles/themes';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider as AppThemeProvider, useTheme } from './contexts/ThemeContext';

// Components
import TitleBar from './components/TitleBar/TitleBar';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ChatListScreen from './screens/chat/ChatListScreen';
import ChatScreen from './screens/chat/ChatScreen';
import ContactsScreen from './screens/contacts/ContactsScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import CallScreen from './screens/call/CallScreen';
import GroupCreateScreen from './screens/groups/GroupCreateScreen';

// Styles
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isDarkTheme } = useTheme();

  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <GlobalStyles />
      <div className="App">
        <TitleBar />
        <main className="main-content">
          <Routes>
            <Route
              path="/auth/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />}
            />
            <Route
              path="/auth/register"
              element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterScreen />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <ChatListScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route
              path="/chat/:chatId"
              element={isAuthenticated ? <ChatScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route
              path="/contacts"
              element={isAuthenticated ? <ContactsScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route
              path="/profile"
              element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route
              path="/call/:callId"
              element={isAuthenticated ? <CallScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route
              path="/group/create"
              element={isAuthenticated ? <GroupCreateScreen /> : <Navigate to="/auth/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

function App() {
  useEffect(() => {
    // Listen for menu events
    if (window.electronAPI) {
      const cleanupMenuNewChat = window.electronAPI.onMenuNewChat(() => {
        // Navigate to contacts screen for new chat
        window.location.hash = '#/contacts';
      });

      return () => {
        cleanupMenuNewChat();
      };
    }
  }, []);

  return (
    <Router>
      <AppThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </AppThemeProvider>
    </Router>
  );
}

export default App;
