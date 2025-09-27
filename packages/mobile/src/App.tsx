import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Context providers
import {AuthProvider} from './contexts/AuthContext';
import {SocketProvider} from './contexts/SocketContext';
import {ThemeProvider} from './contexts/ThemeContext';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ChatListScreen from './screens/chat/ChatListScreen';
import ChatScreen from './screens/chat/ChatScreen';
import ContactsScreen from './screens/contacts/ContactsScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import CallScreen from './screens/call/CallScreen';
import GroupCreateScreen from './screens/groups/GroupCreateScreen';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: {chatId: string; chatName: string; isGroup: boolean};
  Call: {callId: string; isOutgoing: boolean; participants: string[]};
  GroupCreate: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Contacts: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Chats') {
            iconName = 'chat';
          } else if (route.name === 'Contacts') {
            iconName = 'people';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider>
          <AuthProvider>
            <SocketProvider>
              <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
              <NavigationContainer>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                  }}>
                  <Stack.Screen name="Auth" component={AuthStack} />
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Call" component={CallScreen} />
                  <Stack.Screen name="GroupCreate" component={GroupCreateScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </SocketProvider>
          </AuthProvider>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
