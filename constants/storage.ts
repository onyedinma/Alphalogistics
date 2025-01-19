export const STORAGE_KEYS = {
  ORDER_DRAFT: 'orderDraft',
  FORM_DATA: 'formData',
  SENDER_FORM: 'senderFormData',
  RECEIVER_FORM: 'receiverFormData'
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS; 