import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';


export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  return (
    <View
      style={[StyleSheet.absoluteFill, {
        backgroundColor: Colors[colorScheme ?? 'light'].background
      }]}
    />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
