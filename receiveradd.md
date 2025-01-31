# Receiver Address Implementation Documentation

## Overview
The receiver address implementation in the logistics app handles address search, selection, and manual entry functionality. It uses Google Places API for address search and maintains state consistency across searches.

## Key Components

### 1. Address Search Flow
- User clicks on address field
- Navigates to address search screen
- Uses Google Places API for address suggestions
- Selected address returns with structured components

### 2. State Management
```typescript
// Main form state
const [formData, setFormData] = useState<ContactDetails>({
  name: '',
  streetNumber: '',
  landmark: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  address: '',
  phone: '',
  deliveryMethod: 'pickup',
  pickupCenter: '',
  specialInstructions: ''
});
```

### 3. Address Components
When an address is selected, the following components are populated:
- Main address field (complete address)
- Street/Door Number
- Landmark
- Locality
- City
- State
- Postcode

### 4. Data Persistence
- Uses AsyncStorage for temporary data storage
- Clears storage when:
  - Component unmounts
  - User leaves the screen
- Preserves data during address search navigation

### 5. Manual Entry
- Automatically shows when address is selected
- Can be toggled manually
- Pre-populated with selected address components
- Allows manual editing of all fields

## Phone Number Implementation

### Components Used
- Uses `react-native-international-phone-number` package
- Supports international phone number formats
- Includes country code selection

### State Management
```typescript
const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);

// Phone number handling
const handlePhoneNumber = (phoneNumber: string) => {
  // Remove non-digit characters except plus sign at start
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
  setFormData(prev => ({ ...prev, phone: cleanNumber }));
  
  if (cleanNumber && !validatePhoneNumber(cleanNumber)) {
    setFormErrors(prev => ({
      ...prev,
      phone: 'Please enter a valid phone number (10-15 digits)'
    }));
  } else {
    setFormErrors(prev => {
      const { phone, ...rest } = prev;
      return rest;
    });
  }
};
```

### Validation Rules
- Phone numbers must be between 10-15 digits
- Removes all non-digit characters for validation
- Shows error message for invalid numbers
- Required field validation

### UI Components
- Phone input container with:
  - Country code selector with flag (left)
  - Phone number input field (center)
  - Select contact button (right-aligned)
- Error message display below input
- Styled consistent with other form inputs

### Layout
```typescript
// Phone number input layout
<View style={styles.inputGroup}>
  <Text style={styles.label}>Phone Number</Text>
  <View style={styles.phoneInputWrapper}>
    <PhoneInput
      value={formData.phone}
      onChangePhoneNumber={handlePhoneNumber}
      selectedCountry={selectedCountry}
      onChangeSelectedCountry={setSelectedCountry}
      defaultCountry="NG"
      theme="light"
      phoneInputStyles={{
        container: styles.phoneInputContainer,
        flagContainer: styles.flagContainer,
        input: styles.phoneInput
      }}
    />
    <TouchableOpacity 
      style={styles.contactButton}
      onPress={handleSelectContact}
    >
      <Ionicons name="people-outline" size={24} color="#007AFF" />
    </TouchableOpacity>
  </View>
  {formErrors.phone && (
    <Text style={styles.errorText}>{formErrors.phone}</Text>
  )}
</View>
```

### Styling
```typescript
const styles = StyleSheet.create({
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  }
});
```

### Features
1. **International Format Support**
   - Default country code (NG for Nigeria)
   - Country selection with flags
   - Automatic formatting

2. **Validation**
   - Real-time validation
   - Length check (10-15 digits)
   - Format verification
   - Required field check

3. **Error Handling**
   - Clear error messages
   - Visual error indicators
   - Immediate feedback

4. **Data Cleaning**
   - Removes spaces and special characters
   - Preserves plus sign for country code
   - Consistent format for storage

## Contact Selection Implementation

### Components Used
- Uses `expo-contacts` package for accessing device contacts
- Modal-based contact picker with search functionality
- Integrated with phone number input field

### State Management
```typescript
const [showContactsModal, setShowContactsModal] = useState(false);
const [contacts, setContacts] = useState<EnhancedContact[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [isLoadingContacts, setIsLoadingContacts] = useState(false);
const [displayedContacts, setDisplayedContacts] = useState<EnhancedContact[]>([]);
const [page, setPage] = useState(0);
const [cachedContacts, setCachedContacts] = useState<EnhancedContact[]>([]);
```

### Performance Optimizations
1. **Contact Caching**
   - Contacts are cached after first load
   - Subsequent opens use cached data
   - Significantly reduces loading time

2. **Pagination**
   - Initial load of 20 contacts
   - Load more on scroll
   - Smooth scrolling experience

3. **Search Optimization**
   - Debounced search input (300ms)
   - Pre-processed searchable text
   - Case-insensitive search

4. **Render Optimization**
   - `removeClippedSubviews` enabled
   - Fixed height items for better performance
   - Memoized components and callbacks

### Delivery Method Handling
```typescript
const updateFormWithContact = (contact: EnhancedContact) => {
  setFormData(prev => {
    const updatedForm = {
      ...prev,
      name: contact.name || prev.name,
      phone: contact.phoneNumbers?.[0]?.number?.replace(/\D/g, '') || prev.phone,
    };

    // Handle address fields based on current delivery method
    if (prev.deliveryMethod === 'delivery' && contact.addresses?.[0]) {
      // Update address fields for delivery mode
      const addr = contact.addresses[0];
      // ... address field updates
      setShowManualEntry(true);
    } else if (prev.deliveryMethod === 'pickup') {
      // Keep pickup center and clear address fields
      updatedForm.address = '';
      updatedForm.streetNumber = '';
      updatedForm.city = '';
      updatedForm.state = prev.state; // Preserve state
      updatedForm.pincode = '';
      updatedForm.pickupCenter = prev.pickupCenter || '';
    }

    return updatedForm;
  });
};
```

### Key Features
1. **Mode-Aware Updates**
   - Maintains delivery method when selecting contacts
   - Different field updates for pickup vs delivery
   - Preserves existing pickup center in pickup mode

2. **Smart Field Population**
   - Name and phone number always updated
   - Address fields only updated in delivery mode
   - State preserved in pickup mode

3. **UI Consistency**
   - Loading indicators during contact fetch
   - Empty state handling
   - Error messages for permissions

4. **Search Features**
   - Real-time filtering
   - Searches both name and phone number
   - Preserves selected mode after search

### Error Handling
```typescript
try {
  const { status: existingStatus } = await Contacts.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Cannot access contacts without permission...',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }
  }
  // ... contact loading logic
} catch (error) {
  console.error('Error accessing contacts:', error);
  Alert.alert('Error', 'Failed to access contacts. Please try again later.');
}
```

### UI Components
1. **Contact List Item**
   - Displays name and phone number
   - Clear visual hierarchy
   - Touch feedback
   - Forward chevron indicator

2. **Search Bar**
   - Icon-prefixed input
   - Debounced input handling
   - Clear visual styling
   - Placeholder text

3. **Modal Header**
   - Clear title
   - Close button
   - Consistent styling

4. **Loading States**
   - Activity indicator
   - Loading text
   - Centered layout

### Usage Notes
1. Contact selection preserves current delivery method
2. Address fields are only updated in delivery mode
3. Pickup center is preserved in pickup mode
4. Contact search works across both modes
5. Performance optimized for large contact lists

## Implementation Details

### Address Search Results Handler
```typescript
useEffect(() => {
  if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
    setFormData({
      name: formData.name,
      phone: formData.phone,
      deliveryMethod: 'delivery',
      address: params.selectedAddress || '',
      streetNumber: params.selectedStreetNumber || '',
      landmark: params.selectedLandmark || '',
      locality: params.selectedLocality || '',
      city: params.selectedCity || '',
      state: params.selectedState || '',
      pincode: params.selectedPostalCode || '',
      pickupCenter: '',
      specialInstructions: ''
    });
    setShowManualEntry(true);
  }
}, [/* dependencies */]);
```

### Storage Management
- Immediate storage updates after address selection
- Cleanup on component unmount
- State preservation during navigation

## Key Features
1. **Address Overwriting**
   - Each new search completely overwrites previous address data
   - Preserves only name and phone number

2. **Automatic Manual Entry**
   - Shows manual entry section automatically after address selection
   - Pre-populates all available address components

3. **Data Consistency**
   - Maintains consistency between form state and storage
   - Handles undefined values safely

4. **Memory Management**
   - Cleans up storage when leaving screen
   - Preserves necessary data during address search

## Usage Notes
1. Address search requires Google Places API key
2. Manual entry is always available as fallback
3. Form validation ensures required fields are filled
4. Delivery method affects required fields validation

## Error Handling
- Handles API errors gracefully
- Validates form data before proceeding
- Shows appropriate error messages to users
- Fallback to manual entry if needed 