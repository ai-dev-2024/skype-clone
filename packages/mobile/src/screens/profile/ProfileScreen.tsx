import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {Text, Card, Avatar, Button, Switch, List, useTheme} from 'react-native-paper';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme as useAppTheme} from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const {isDarkTheme, toggleTheme} = useAppTheme();
  const theme = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Avatar change feature coming soon!');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Avatar.Image
              size={80}
              source={
                user.avatar
                  ? {uri: user.avatar}
                  : require('../../assets/default-avatar.png')
              }
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text variant="headlineSmall" style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodyLarge" style={styles.username}>
              @{user.username}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user.email}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <List.Section>
            <List.Subheader>Preferences</List.Subheader>

            <List.Item
              title="Dark Theme"
              left={() => <List.Icon icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkTheme}
                  onValueChange={toggleTheme}
                />
              )}
            />

            <List.Item
              title="Push Notifications"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />

            <List.Subheader>Account</List.Subheader>

            <List.Item
              title="Change Password"
              left={() => <List.Icon icon="lock" />}
              onPress={() => Alert.alert('Change Password', 'Feature coming soon!')}
            />

            <List.Item
              title="Privacy Settings"
              left={() => <List.Icon icon="shield-account" />}
              onPress={() => Alert.alert('Privacy Settings', 'Feature coming soon!')}
            />

            <List.Item
              title="Blocked Users"
              left={() => <List.Icon icon="account-cancel" />}
              onPress={() => Alert.alert('Blocked Users', 'Feature coming soon!')}
            />

            <List.Subheader>Storage</List.Subheader>

            <List.Item
              title="Clear Cache"
              left={() => <List.Icon icon="delete" />}
              onPress={handleClearCache}
            />

            <List.Subheader>Support</List.Subheader>

            <List.Item
              title="Help & Support"
              left={() => <List.Icon icon="help-circle" />}
              onPress={() => Alert.alert('Help & Support', 'Feature coming soon!')}
            />

            <List.Item
              title="About"
              left={() => <List.Icon icon="information" />}
              onPress={() => Alert.alert('About', 'Skype Clone v1.0.0')}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#FF3B30"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#666',
    marginBottom: 4,
  },
  email: {
    color: '#666',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  logoutContainer: {
    padding: 16,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
});

export default ProfileScreen;
