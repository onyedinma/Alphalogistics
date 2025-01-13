declare module '@expo/vector-icons' {
  import { ComponentProps } from 'react';

  export const Ionicons: {
    (props: {
      name: keyof typeof Ionicons.glyphMap;
      size?: number;
      color?: string;
      style?: any;
    }): JSX.Element;
    glyphMap: { [key: string]: string };
  };
} 