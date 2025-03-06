# Receiver Address Implementation

## Form Components

### Base Contact Form
```typescript
interface ContactForm {
  name: string;
  phone: string;
  address: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  landmark?: string;
  locality?: string;
  city?: string;
}

const validateContact = (data: ContactForm) => {
  const errors: string[] = [];
  // ...validation logic...
  return errors;
};
```

### Address Components
```typescript
<View style={styles.card}>
  <TextInput
    style={styles.input}
    value={receiverDetails.address}
    onChangeText={text => updateReceiver('address', text)}
    placeholder="Delivery Address"
  />
  {deliveryMethod === 'delivery' && (
    <>
      <TextInput
        style={styles.input}
        value={receiverDetails.landmark}
        onChangeText={text => updateReceiver('landmark', text)}
        placeholder="Landmark (Optional)"
      />
      <TextInput
        style={styles.input}
        value={receiverDetails.locality}
        onChangeText={text => updateReceiver('locality', text)}
        placeholder="Locality (Optional)"
      />
    </>
  )}
</View>
```

## State Management

### Draft Updates
```typescript
const updateDraft = async (updates: Partial<ContactForm>) => {
  const draft = await StorageService.getOrderDraft();
  const updatedDraft = {
    ...draft,
    receiver: { ...draft.receiver, ...updates }
  };
  await StorageService.saveOrderDraft(updatedDraft);
};
```

### Form Handling
1. Incremental updates
2. Type-safe state
3. Validation on change
4. Draft persistence
5. Clean navigation

## UI/UX Guidelines
1. Clear section headers
2. Collapsible sections
3. Conditional rendering
4. Proper keyboard handling
5. Loading states

## Error Handling
1. Form validation
2. Storage errors
3. Network issues
4. Data type checking