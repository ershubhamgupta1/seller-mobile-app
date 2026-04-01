import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        Alert.alert('Success', 'Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContainer, isTablet && styles.scrollContainerTablet]}
      >
        <View style={[styles.authLayout, isTablet && styles.authLayoutTablet]}>
          <View style={[styles.header, isTablet && styles.headerTablet]}>
            <Text style={[styles.logo, isTablet && styles.logoTablet]}>E-KOM</Text>
            <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
            <Text style={[styles.description, isTablet && styles.descriptionTablet]}>
              Manage your inventory, profile, and orders from one workspace.
            </Text>
          </View>

          <View style={[styles.form, isTablet && styles.formTablet]}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              selectionColor="#111827"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              selectionColor="#111827"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin 
                ? "Don't have an account? Register" 
                : 'Already have an account? Login'
              }
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainerTablet: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  authLayout: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  authLayoutTablet: {
    maxWidth: 980,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTablet: {
    flex: 1,
    marginBottom: 0,
    borderRadius: 24,
    backgroundColor: '#111827',
    padding: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 420,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  logoTablet: {
    color: '#f9fafb',
    fontSize: 42,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  subtitleTablet: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#fff',
    maxWidth: 320,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  descriptionTablet: {
    color: '#d1d5db',
    textAlign: 'left',
    maxWidth: 280,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTablet: {
    flex: 1,
    maxWidth: 460,
    borderRadius: 24,
    padding: 32,
    alignSelf: 'center',
    minHeight: 420,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#111827',
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#000',
    fontSize: 14,
  },
});

export default LoginScreen;
