import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { Colors, Shadows } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import { User, Mail, Phone, MapPin, LogOut, Ticket } from 'lucide-react-native';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading, checkAuthStatus } = useAuth();

  // Refresh auth status when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
    }, [checkAuthStatus])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <User size={80} color={Colors.border} />
        <Text style={styles.guestTitle}>Bạn chưa đăng nhập</Text>
        <Text style={styles.guestSubtitle}>
          Đăng nhập ngay để quản lý vé đã đặt và nhận thêm nhiều ưu đãi.
        </Text>
        <Button
          style={{ width: '80%', marginTop: 20 }}
          onPress={() => router.push('/(auth)/login')}
        >
          ĐĂNG NHẬP
        </Button>
        <Button
          variant="outline"
          style={{ width: '80%', marginTop: 12 }}
          onPress={() => router.push('/(auth)/register')}
        >
          ĐĂNG KÝ
        </Button>
      </View>
    );
  }

  // Logged in user profile
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar & Header Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user.avatarUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}${user.avatarUrl}` }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>
            {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
          </Text>
        </View>
      </View>

      {/* Basic Info Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.infoRow}>
          <User size={20} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{user.fullName || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Mail size={20} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{user.email || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={20} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{user.phoneNumber || 'Chưa cập nhật'}</Text>
        </View>
      </View>

      {/* Action Menu */}
      <View style={[styles.section, { padding: 0 }]}>
        <Button
          variant="ghost"
          style={styles.menuItem}
          textStyle={styles.menuItemText}
          onPress={() => router.push('/edit-profile')}
        >
          <View style={styles.menuItemContent}>
            <User size={24} color={Colors.primary} />
            <Text style={styles.menuItemTitle}>Chỉnh sửa thông tin</Text>
          </View>
        </Button>
        <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: 20 }} />
        <Button
          variant="ghost"
          style={styles.menuItem}
          textStyle={styles.menuItemText}
          onPress={() => router.push('/my-tickets')}
        >
          <View style={styles.menuItemContent}>
            <Ticket size={24} color={Colors.primary} />
            <Text style={styles.menuItemTitle}>Vé đã đặt của tôi</Text>
          </View>
        </Button>
      </View>

      {/* Logout Action */}
      <Button
        variant="danger"
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#fff" style={{ marginRight: 8 }} />
        ĐĂNG XUẤT
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgNoShowtime,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.bgWhite,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
  },
  guestTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: Colors.bgHighlight,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  roleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  menuItem: {
    justifyContent: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  menuItemText: {
    color: Colors.textPrimary,
  },
  logoutBtn: {
    marginTop: 16,
    flexDirection: 'row',
  },
});
