import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {TextInput, Button, Text, Card, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const {login} = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Navigation will be handled by the auth context
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
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
                Welcome Back
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Sign in to continue
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                autoComplete="password"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}>
                Sign In
              </Button>

              <View style={styles.divider}>
                <Text variant="bodyMedium" style={styles.dividerText}>
                  Don't have an account?
                </Text>
                <Button
                  mode="text"
                  onPress={navigateToRegister}
                  disabled={loading}
                  compact>
                  Sign Up
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
  input: {
    marginBottom: 16,
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

export default LoginScreen;
