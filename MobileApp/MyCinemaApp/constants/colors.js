// Design tokens — giữ nguyên 100% mã màu từ phiên bản Web
export const Colors = {
  primary: '#034EA2',
  primaryDark: '#023d82',
  accent: '#FF6600',
  gold: '#FFC000',
  brandRed: '#D11515',
  brandRedLight: '#E61717',

  textPrimary: '#111827',
  textSecondary: '#333333',
  textTertiary: '#6B7280',
  textMuted: '#94a3b8',
  textPlaceholder: '#888888',
  textDark: '#444444',
  textSubtle: '#4B5563',

  bgWhite: '#FFFFFF',
  bgLight: '#f8f9fc',
  bgGray: '#f5f5f5',
  bgInput: '#fafafa',
  bgTag: '#F3F4F6',
  bgHighlight: '#f0f5ff',
  bgNoShowtime: '#F9FAFB',

  border: '#E5E7EB',
  borderInput: '#dddddd',
  divider: '#eeeeee',

  error: '#e74c3c',
  errorDark: '#c0392b',
  errorBg: 'rgba(231, 76, 60, 0.1)',
  success: '#10B981',
  warning: '#F59E0B',

  overlay: 'rgba(0,0,0,0.5)',
  overlayDark: 'rgba(0,0,0,0.6)',

  seatAvailable: '#FFFFFF',
  seatSelected: '#034EA2',
  seatBooked: '#6B7280',
  seatHolding: '#F59E0B',
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#D11515',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};
