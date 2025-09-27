import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {Text, Card, Avatar, FAB, useTheme, Searchbar} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, MainTabParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';
import {useSocket} from '../../contexts/SocketContext';
import axios from 'axios';

type ChatListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

interface Chat {
  _id: string;
  name: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
  participants: string[];
  isGroup: boolean;
  unreadCount: number;
  avatar?: string;
}

const ChatListScreen: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {user} = useAuth();
  const {socket} = useSocket();
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const theme = useTheme();

  useEffect(() => {
    fetchChats();
    setupSocketListeners();

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('chatUpdated');
      }
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/messages/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('newMessage', (message) => {
      updateChatWithMessage(message);
    });

    socket.on('chatUpdated', (updatedChat) => {
      setChats(prevChats =>
        prevChats.map(chat =>
          chat._id === updatedChat._id ? {...chat, ...updatedChat} : chat
        )
      );
    });
  };

  const updateChatWithMessage = (message: any) => {
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat._id === message.chatId);
      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];
      const chat = updatedChats[chatIndex];
      updatedChats[chatIndex] = {
        ...chat,
        lastMessage: {
          content: message.content,
          sender: message.sender,
          timestamp: new Date(message.timestamp),
        },
        unreadCount: chat.unreadCount + 1,
      };

      // Move chat to top
      const [updatedChat] = updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(updatedChat);

      return updatedChats;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const navigateToChat = (chat: Chat) => {
    navigation.navigate('Chat', {
      chatId: chat._id,
      chatName: chat.name,
      isGroup: chat.isGroup,
    });
  };

  const navigateToContacts = () => {
    // Navigate to contacts tab to start new chat
    navigation.navigate('Contacts');
  };

  const renderChatItem = ({item}: {item: Chat}) => {
    const lastMessageTime = item.lastMessage?.timestamp
      ? new Date(item.lastMessage.timestamp)
      : null;

    const timeString = lastMessageTime
      ? lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      : '';

    return (
      <TouchableOpacity onPress={() => navigateToChat(item)}>
        <Card style={styles.chatCard}>
          <Card.Content style={styles.chatContent}>
            <Avatar.Image
              size={50}
              source={
                item.avatar
                  ? {uri: item.avatar}
                  : require('../../assets/default-avatar.png')
              }
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text variant="titleMedium" style={styles.chatName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.lastMessage && (
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {timeString}
                  </Text>
                )}
              </View>
              <View style={styles.chatFooter}>
                {item.lastMessage ? (
                  <Text variant="bodyMedium" style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage.sender === user?._id ? 'You: ' : ''}
                    {item.lastMessage.content}
                  </Text>
                ) : (
                  <Text variant="bodyMedium" style={styles.noMessages}>
                    No messages yet
                  </Text>
                )}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No chats yet
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        Start a conversation by tapping the + button
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search chats..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyList : undefined}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={navigateToContacts}
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
  chatCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    flex: 1,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
  },
  noMessages: {
    flex: 1,
    color: '#999',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

export default ChatListScreen;
