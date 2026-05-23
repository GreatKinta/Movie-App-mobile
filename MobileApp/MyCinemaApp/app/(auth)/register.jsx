import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { X } from 'lucide-react-native';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phoneNumber: formData.phone || null,
        }),
      });

      const text = await response.text();

      if (response.ok) {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        throw new Error(text || 'Đăng ký thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi đăng ký', error.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ĐĂNG KÝ</Text>
        <Button
          variant="ghost"
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.textPrimary} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Tài khoản *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên đăng nhập"
          placeholderTextColor={Colors.textPlaceholder}
          value={formData.username}
          onChangeText={(text) => handleChange('username', text)}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Họ và tên *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên đầy đủ"
          placeholderTextColor={Colors.textPlaceholder}
          value={formData.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa chỉ email"
          placeholderTextColor={Colors.textPlaceholder}
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mật khẩu *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          placeholderTextColor={Colors.textPlaceholder}
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
        />

        <Text style={styles.label}>Xác nhận mật khẩu *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor={Colors.textPlaceholder}
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại (Không bắt buộc)"
          placeholderTextColor={Colors.textPlaceholder}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
        />

        <Button
          style={styles.submitBtn}
          onPress={handleRegister}
          loading={loading}
        >
          ĐĂNG KÝ
        </Button>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Text
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            Đăng nhập ngay
          </Text>
        </View>
      </ScrollView>
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
    marginBottom: 20,
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
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 20,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  loginLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
});
