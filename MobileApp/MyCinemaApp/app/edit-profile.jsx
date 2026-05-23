import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { Colors, Shadows } from '../constants/colors';
import { API_BASE_URL } from '../constants/config';
import { User, Phone, ArrowLeft, Camera } from 'lucide-react-native';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser, uploadAvatar } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập',
          'Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện của bạn.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setIsUploading(true);
        const uploadRes = await uploadAvatar(selectedAsset);
        setIsUploading(false);

        if (uploadRes.success) {
          Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
        } else {
          Alert.alert('Thất bại', uploadRes.error || 'Không thể tải ảnh lên');
        }
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh.');
    }
  };

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Họ tên không được để trống');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Thông báo', 'Số điện thoại không được để trống');
      return;
    }

    // Basic phone validation (at least 9 digits)
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (phải từ 9-11 số)');
      return;
    }

    setIsSubmitting(true);
    const result = await updateUser(fullName, phoneNumber);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert('Thất bại', result.error || 'Đã có lỗi xảy ra');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Custom */}
      <View style={styles.header}>
        <Button
          variant="ghost"
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </Button>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            activeOpacity={0.85}
            disabled={isUploading}
          >
            <View style={styles.avatar}>
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : user?.avatarUrl ? (
                <Image
                  source={{ uri: `${API_BASE_URL}${user.avatarUrl}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </Text>
              )}
            </View>
            <View style={styles.cameraIconContainer}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          {isUploading && <Text style={styles.uploadingText}>Đang tải ảnh lên...</Text>}
          <Text style={styles.username}>{user?.username || 'Username'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Inputs form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Thông tin cá nhân</Text>

          {/* FullName Input */}
          <Text style={styles.label}>Họ và tên *</Text>
          <View style={styles.inputContainer}>
            <User size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên của bạn"
              placeholderTextColor={Colors.textPlaceholder}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Input */}
          <Text style={styles.label}>Số điện thoại *</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={Colors.textPlaceholder}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            style={styles.submitBtn}
            loading={isSubmitting}
            onPress={handleUpdate}
          >
            LƯU THAY ĐỔI
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgNoShowtime,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.header,
  },
  backBtn: {
    paddingHorizontal: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.card,
  },
  uploadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
  username: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  formCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 20,
    ...Shadows.card,
  },
  formTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
    height: '100%',
  },
  submitBtn: {
    marginTop: 10,
    width: '100%',
  },
});
