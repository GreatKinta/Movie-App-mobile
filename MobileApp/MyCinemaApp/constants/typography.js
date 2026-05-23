// Typography config — matching web fonts (Inter family)
export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 22,
  hero: 28,
};

export const FontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const Typography = {
  h1: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.extrabold,
    fontFamily: 'Inter_800ExtraBold',
  },
  h2: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.black,
    fontFamily: 'Inter_900Black',
  },
  h3: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    fontFamily: 'Inter_700Bold',
  },
  body: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.normal,
    fontFamily: 'Inter_400Regular',
  },
  bodyBold: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: 'Inter_600SemiBold',
  },
  caption: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    fontFamily: 'Inter_500Medium',
  },
  captionBold: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    fontFamily: 'Inter_700Bold',
  },
  button: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.extrabold,
    fontFamily: 'Inter_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tag: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.extrabold,
    fontFamily: 'Inter_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  navTab: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
};
