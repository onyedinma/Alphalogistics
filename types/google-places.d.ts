declare module 'react-native-google-places-autocomplete' {
  import { TextInputProps, ViewStyle, TextStyle } from 'react-native';
  import React from 'react';

  export interface GooglePlaceData {
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
  }

  export interface GooglePlaceDetail {
    address_components: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPress: (data: GooglePlaceData, detail: GooglePlaceDetail | null) => void;
    query: {
      key: string;
      language?: string;
      components?: string;
    };
    styles?: {
      container?: ViewStyle;
      textInput?: TextStyle;
      listView?: ViewStyle;
      row?: ViewStyle;
    };
    textInputProps?: TextInputProps;
    enablePoweredByContainer?: boolean;
    fetchDetails?: boolean;
  }

  export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps>;
} 