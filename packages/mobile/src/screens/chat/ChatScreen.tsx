import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {TextInput, IconButton, Card, Avatar, useTheme} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';
import {useSocket} from '../../contexts/SocketContext';
import axios from 'axios';
import {Message} from '@skype-clone/shared';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);

  const {user} = useAuth();
  const {socket, isConnected} = useSocket();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const {chatId, chatName, isGroup} = route.params;

  useEffect(() => {
    fetchMessages();
    fetchParticipants();
    setupSocketListeners();

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('messageSent');
      }
    };
  }, [chatId]);

  useEffect(() => {
    navigation.setOptions({
      title: chatName,
      headerRight: () => (
        <IconButton
          icon="phone"
          size={24}
          onPress={handleCallPress}
        />
      ),
    });
  }, [chatName, navigation]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/messages/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll use placeholder data
      setParticipants([]);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('newMessage', (message: Message) => {
      if (message.chatId === chatId) {
        setMessages(prevMessages => [...prevMessages, message]);
        // Mark message as read
        socket.emit('markAsRead', {messageId: message._id});
      }
    });

    socket.on('messageSent', (message: Message) => {
      // Message was successfully sent and received
      console.log('Message sent:', message._id);
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const messageData = {
        chatId,
        content: messageContent,
        type: 'text',
        timestamp: new Date(),
      };

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        ...messageData,
        sender: user!._id,
        readBy: [user!._id],
      };

      setMessages(prevMessages => [...prevMessages, optimisticMessage]);

      // Send via socket
      socket?.emit('sendMessage', messageData);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Remove optimistic message on failure
      setMessages(prevMessages =>
        prevMessages.filter(msg => !msg._id.startsWith('temp-'))
      );
    } finally {
      setSending(false);
    }
  };

  const handleCallPress = () => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your internet connection');
      return;
    }

    navigation.navigate('Call', {
      callId: `call-${Date.now()}`,
      isOutgoing: true,
      participants: participants.map(p => p._id),
    });
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isOwnMessage = item.sender === user?._id;
    const sender = participants.find(p => p._id === item.sender);

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Avatar.Image
            size={32}
            source={
              sender?.avatar
                ? {uri: sender.avatar}
                : require('../../assets/default-avatar.png')
            }
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {!isOwnMessage && sender && (
            <Text style={styles.senderName}>
              {sender.firstName} {sender.lastName}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownTime : styles.otherTime
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        inverted={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.messageInput}
          multiline
          maxLength={1000}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: 'white',
  },
  otherText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTime: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    backgroundColor: 'white',
  },
});

export default ChatScreen;
