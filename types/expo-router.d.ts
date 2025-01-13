declare module 'expo-router' {
  import { ComponentProps } from 'react';
  import { StackNavigationOptions } from '@react-navigation/stack';

  export const Stack: {
    Screen: (props: { options?: StackNavigationOptions }) => JSX.Element;
    new (): JSX.Element;
    (props: { screenOptions?: StackNavigationOptions; children?: React.ReactNode }): JSX.Element;
  };
  
  export const router: {
    push: (route: string | { pathname: string; params: Record<string, any> }) => void;
    replace: (route: string | { pathname: string; params: Record<string, any> }) => void;
    back: () => void;
  };

  export function useLocalSearchParams<T>(): T;
} 