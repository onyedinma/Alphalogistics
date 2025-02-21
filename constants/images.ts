import { Image } from 'react-native';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_ITEM = 3;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageValidation {
  isValid: boolean;
  fileSize: number;
}

export const validateImageDimensions = async (uri: string): Promise<ImageValidation> => {
  return new Promise((resolve) => {
    Image.getSize(uri, async (width: number, height: number) => {
      const maxDimension = Math.max(width, height);
      const response = await fetch(uri);
      const fileSize = parseInt(response.headers.get('content-length') || '0');
      resolve({ 
        isValid: maxDimension <= 4096,
        fileSize 
      });
    }, () => resolve({ isValid: false, fileSize: 0 }));
  });
}; 