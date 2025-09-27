import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {TextInput, Button, Text, Card} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const {register} = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const {firstName, lastName, username, email, password, confirmPassword} = formData;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      // Navigation will be handled by the auth context
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineMedium" style={styles.title}>
                Create Account
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Join Skype Clone today
              </Text>

              <View style={styles.nameRow}>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  mode="outlined"
                  autoCapitalize="words"
                  style={[styles.input, styles.halfInput]}
                  disabled={loading}
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  mode="outlined"
                  autoCapitalize="words"
                  style={[styles.input, styles.halfInput]}
                  disabled={loading}
                />
              </View>

              <TextInput
                label="Username"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                mode="outlined"
                autoCapitalize="none"
                autoComplete="username"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                autoComplete="password-new"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />

              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                mode="outlined"
                secureTextEntry={secureConfirmTextEntry}
                autoComplete="password-new"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={secureConfirmTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
                  />
                }
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}>
                Create Account
              </Button>

              <View style={styles.divider}>
                <Text variant="bodyMedium" style={styles.dividerText}>
                  Already have an account?
                </Text>
                <Button
                  mode="text"
                  onPress={navigateToLogin}
                  disabled={loading}
                  compact>
                  Sign In
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 0.48,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dividerText: {
    marginRight: 8,
    opacity: 0.7,
  },
});

export default RegisterScreen;
