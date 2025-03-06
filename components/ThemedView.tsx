import { View, type ViewProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { theme } from '@/styles/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'elevated' | 'secondary';
  padding?: keyof typeof theme.spacing;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  padding,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View
      style={[
        { backgroundColor },
        styles[variant],
        padding && { padding: theme.spacing[padding] },
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  default: {},
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  elevated: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md
  },
  secondary: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm
  }
});
