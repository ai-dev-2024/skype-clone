import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Text, Card, Avatar, Button, TextInput, Checkbox, Appbar, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';
import axios from 'axios';

type GroupCreateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GroupCreate'>;

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

interface SelectedContact extends Contact {
  selected: boolean;
}

const GroupCreateScreen: React.FC = () => {
  const [contacts, setContacts] = useState<SelectedContact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const {user} = useAuth();
  const navigation = useNavigation<GroupCreateScreenNavigationProp>();
  const theme = useTheme();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/contacts');
      const contactsWithSelection = response.data.map((contact: Contact) => ({
        ...contact,
        selected: false,
      }));
      setContacts(contactsWithSelection);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact._id === contactId
          ? {...contact, selected: !contact.selected}
          : contact
      )
    );
  };

  const getSelectedContacts = () => {
    return contacts.filter(contact => contact.selected);
  };

  const canCreateGroup = () => {
    const selectedContacts = getSelectedContacts();
    return groupName.trim().length > 0 && selectedContacts.length >= 2;
  };

  const createGroup = async () => {
    if (!canCreateGroup()) {
      Alert.alert('Invalid Group', 'Please enter a group name and select at least 2 contacts');
      return;
    }

    try {
      setCreating(true);
      const selectedContacts = getSelectedContacts();

      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        participants: [
          user?._id,
          ...selectedContacts.map(contact => contact._id)
        ],
        admins: [user?._id],
        isGroup: true,
      };

      const response = await axios.post('/groups', groupData);
      const newGroup = response.data;

      // Navigate to the new group chat
      navigation.replace('Chat', {
        chatId: newGroup._id,
        chatName: newGroup.name,
        isGroup: true,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const renderContactItem = ({item}: {item: SelectedContact}) => {
    const fullName = `${item.firstName} ${item.lastName}`;

    return (
      <TouchableOpacity onPress={() => toggleContactSelection(item._id)}>
        <Card style={styles.contactCard}>
          <Card.Content style={styles.contactContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={40}
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
            </View>

            <Checkbox
              status={item.selected ? 'checked' : 'unchecked'}
              onPress={() => toggleContactSelection(item._id)}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const selectedCount = getSelectedContacts().length;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create Group" />
        <Appbar.Action
          icon="check"
          onPress={createGroup}
          disabled={!canCreateGroup() || creating}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {/* Group Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <TextInput
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              mode="outlined"
              style={styles.input}
              maxLength={50}
            />

            <TextInput
              label="Description (optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              mode="outlined"
              style={styles.input}
              multiline
              maxLength={200}
            />

            <Text variant="bodyMedium" style={styles.selectionInfo}>
              {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
            </Text>
          </Card.Content>
        </Card>

        {/* Contacts List */}
        <Text variant="titleMedium" style={styles.contactsTitle}>
          Select Contacts
        </Text>

        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
        />

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={createGroup}
            loading={creating}
            disabled={!canCreateGroup() || creating}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
          >
            Create Group ({selectedCount + 1} members)
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  selectionInfo: {
    color: '#666',
    textAlign: 'center',
  },
  contactsTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  contactCard: {
    marginVertical: 4,
    elevation: 1,
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
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontWeight: '500',
  },
  contactUsername: {
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  createButton: {
    marginHorizontal: 16,
  },
  createButtonContent: {
    paddingVertical: 8,
  },
});

export default GroupCreateScreen;
