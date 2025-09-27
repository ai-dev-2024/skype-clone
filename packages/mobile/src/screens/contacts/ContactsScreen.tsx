import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {Text, Card, Avatar, FAB, Searchbar, IconButton, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';
import axios from 'axios';

type ContactsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {user} = useAuth();
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const theme = useTheme();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact =>
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [contacts, searchQuery]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  const startChat = async (contact: Contact) => {
    try {
      // Check if chat already exists
      const existingChatResponse = await axios.get(`/messages/chat/${contact._id}`);
      const existingChat = existingChatResponse.data;

      if (existingChat) {
        navigation.navigate('Chat', {
          chatId: existingChat._id,
          chatName: `${contact.firstName} ${contact.lastName}`,
          isGroup: false,
        });
        return;
      }

      // Create new chat
      const newChatResponse = await axios.post('/messages/chat', {
        participants: [user?._id, contact._id],
        isGroup: false,
      });

      const newChat = newChatResponse.data;

      navigation.navigate('Chat', {
        chatId: newChat._id,
        chatName: `${contact.firstName} ${contact.lastName}`,
        isGroup: false,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const createGroupChat = () => {
    navigation.navigate('GroupCreate');
  };

  const renderContactItem = ({item}: {item: Contact}) => {
    const fullName = `${item.firstName} ${item.lastName}`;

    return (
      <TouchableOpacity onPress={() => startChat(item)}>
        <Card style={styles.contactCard}>
          <Card.Content style={styles.contactContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={50}
                source={
                  item.avatar
                    ? {uri: item.avatar}
                    : require('../../assets/default-avatar.png')
                }
              />
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.contactInfo}>
              <Text variant="titleMedium" style={styles.contactName} numberOfLines={1}>
                {fullName}
              </Text>
              <Text variant="bodyMedium" style={styles.contactUsername} numberOfLines={1}>
                @{item.username}
              </Text>
              {!item.isOnline && item.lastSeen && (
                <Text variant="bodySmall" style={styles.lastSeen}>
                  Last seen {new Date(item.lastSeen).toLocaleDateString()}
                </Text>
              )}
            </View>

            <IconButton
              icon="message"
              size={24}
              onPress={() => startChat(item)}
              style={styles.messageButton}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No contacts found
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        Add friends to start chatting
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={filteredContacts.length === 0 ? styles.emptyList : undefined}
      />

      <FAB
        icon="account-group"
        label="New Group"
        style={styles.fab}
        onPress={createGroupChat}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  contactCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontWeight: '600',
  },
  contactUsername: {
    color: '#666',
    marginTop: 2,
  },
  lastSeen: {
    color: '#999',
    marginTop: 2,
    fontSize: 12,
  },
  messageButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

export default ContactsScreen;
