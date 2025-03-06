import { Text, type TextProps, StyleSheet, TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { theme } from '@/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof typeof styles;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[{ color }, styles[type], style as TextStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create<Record<string, TextStyle>>({
  default: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
    fontWeight: '400',
  },
  defaultSemiBold: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
    fontWeight: '600',
  },
  title: {
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: '700',
    lineHeight: theme.typography.sizes['3xl'] * theme.typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.normal,
  },
  heading: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: '700',
    lineHeight: theme.typography.sizes['2xl'] * theme.typography.lineHeights.tight,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.normal,
    color: theme.colors.text.tertiary,
  },
  link: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
