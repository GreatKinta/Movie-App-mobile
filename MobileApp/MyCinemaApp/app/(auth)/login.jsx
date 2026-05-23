import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { X } from 'lucide-react-native';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        // Lưu token vào SecureStore thông qua AuthContext
        await login(data.accessToken);
        
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error(data.message || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ĐĂNG NHẬP</Text>
        <Button
          variant="ghost"
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.textPrimary} />
        </Button>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa chỉ email"
          placeholderTextColor={Colors.textPlaceholder}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          placeholderTextColor={Colors.textPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          style={styles.submitBtn}
          onPress={handleLogin}
          loading={loading}
        >
          ĐĂNG NHẬP
        </Button>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <Text
            style={styles.registerLink}
            onPress={() => router.replace('/(auth)/register')}
          >
            Đăng ký ngay
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  form: {
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  registerLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
});
