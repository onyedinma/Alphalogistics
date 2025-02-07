# Receiver Address Implementation Documentation

## Overview
The receiver address implementation in the logistics app handles address search, selection, and manual entry functionality. It uses Google Places API for address search and maintains state consistency across navigation and screen transitions.

## Key Components

### 1. State Management
```typescript
// Main form state interface
interface FormData {
  name: string;
  streetNumber: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  phone: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
}

// Form state initialization
const [formData, setFormData] = useState<FormData>({
  name: '',
  streetNumber: '',
  landmark: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  address: '',
  phone: '',
  deliveryMethod: 'delivery',
  pickupCenter: ''
});
```

### 2. Address Search Flow
```typescript
// Save current form data before navigating to address search
const handleAddressSearch = async () => {
  try {
    // Save current form data to temporary storage
    await AsyncStorage.setItem('tempReceiverData', JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      deliveryMethod: formData.deliveryMethod,
      pickupCenter: formData.pickupCenter
    }));

    router.push({
      pathname: '/(dashboard)/customer/address-search',
      params: { returnTo: 'receiver' }
    });
  } catch (error) {
    console.error('Error saving temp data:', error);
    Alert.alert('Error', 'Failed to process address search.');
  }
};
```

### 3. Address Return Handler
```typescript
// Handle address search return with data preservation
useEffect(() => {
  if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
    console.log('Return from address search with params:', params);
    const loadSavedData = async () => {
      try {
        // Load the saved form data
        const tempData = await AsyncStorage.getItem('tempReceiverData');
        const savedData = tempData ? JSON.parse(tempData) : {};
        
        console.log('Loaded saved data:', savedData);
        
        // Update form data while preserving saved fields
        setFormData(prev => ({
          ...prev,
          name: savedData.name || prev.name,  // Preserve name from temp data or current state
          phone: savedData.phone || prev.phone,  // Preserve phone from temp data or current state
          deliveryMethod: 'delivery',
          // Set new address data
          address: params.selectedAddress || prev.address,
          state: params.selectedState || prev.state,
          streetNumber: params.selectedStreetNumber || prev.streetNumber,
          landmark: params.selectedLandmark || prev.landmark,
          locality: params.selectedLocality || prev.locality,
          city: params.selectedCity || prev.city,
          pincode: params.selectedPostalCode || prev.pincode,
        }));
        
        setFormErrors(prev => ({ ...prev, address: undefined, state: undefined }));
        setShowAddressFields(true);

        // Clean up temp storage
        await AsyncStorage.removeItem('tempReceiverData');
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }
}, [params.returnFromAddressSearch, params.selectedAddress]);
```

### 4. Address Aggregation
```typescript
// Function to aggregate address components into a single string
const aggregateAddress = (data: FormData): string => {
  // If we have a complete address from search, use it
  if (data.address) return data.address;
  
  // Otherwise, construct from components
  const components = [
    data.streetNumber,
    data.landmark,
    data.locality,
    data.city,
    data.state,
    data.pincode
  ].filter(Boolean);  // Remove empty/undefined values
  
  return components.join(', ');
};
```

### 5. Data Return and Navigation
```typescript
// Handle form submission and return to new-order screen
const handleProceed = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const currentDraft = await StorageService.getOrderDraft();
    if (!currentDraft) {
      throw new Error('No order draft found');
    }

    // Get the complete address
    const completeAddress = aggregateAddress(formData);

    const updatedDraft: OrderDraft = {
      ...currentDraft,
      receiver: {
        name: formData.name.trim(),
        streetNumber: formData.streetNumber,
        landmark: formData.landmark,
        locality: formData.locality,
        city: formData.city,
        state: formData.state.trim(),
        pincode: formData.pincode,
        address: completeAddress,
        phone: formData.phone.trim(),
        deliveryMethod: formData.deliveryMethod,
        pickupCenter: formData.deliveryMethod === 'pickup' ? formData.pickupCenter : undefined,
      }
    };

    await StorageService.saveOrderDraft(updatedDraft);

    // Return to new-order screen with updated data
    router.push({
      pathname: '/(dashboard)/customer/new-order',
      params: {
        receiverName: formData.name.trim(),
        receiverAddress: completeAddress,
        receiverState: formData.state.trim(),
        receiverPhone: formData.phone.trim(),
      },
    });
  } catch (error) {
    console.error('Error saving receiver details:', error);
    Alert.alert('Error', 'Failed to save receiver details. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## Key Features

### 1. State Preservation
- Maintains form data during navigation
- Preserves user input across address search
- Handles cleanup appropriately
- Uses temporary storage for navigation state
- Preserves receiver's name and phone when returning from address search

### 2. Data Validation
- Validates required fields
- Shows appropriate error messages
- Prevents submission of invalid data
- Validates phone numbers
- Ensures address components are properly set

### 3. Address Components
- Main address field (complete address)
- Street/Door Number
- Landmark
- Locality
- City
- State
- Pincode

### 4. UI/UX Considerations
- Toggle for manual address entry
- Clear error indicators
- Loading states
- Intuitive navigation
- Proper data preservation during navigation

## Implementation Notes

### Address Search Integration
1. Save current form state before navigation
2. Handle return with proper data merging
3. Show/hide manual entry fields based on context
4. Preserve user input during the entire flow
5. Maintain data consistency across navigation

### Data Flow
1. Temporary storage during navigation (`tempReceiverData`)
2. Form data persistence for current session (`receiverFormData`)
3. Order draft storage for complete order (`orderDraft`)
4. Cleanup on component unmount
5. Proper data preservation during address search

### Error Handling
1. Validation of required fields
2. Storage error handling
3. Navigation error handling
4. Data persistence error recovery
5. Phone number validation

### Best Practices
1. Use TypeScript interfaces for type safety
2. Implement proper error handling
3. Maintain state consistency
4. Clean up resources appropriately
5. Preserve user input whenever possible
6. Log important state changes for debugging
7. Handle both manual and Google Places address entry

### Address Data Flow
1. **Google Places Search Flow**
   - Address selected from search is stored in `formData.address`
   - Individual components are stored in respective fields
   - Complete address is used for display and return

2. **Manual Entry Flow**
   - Individual components are collected
   - Aggregated into complete address on form submission
   - Both complete address and components are stored in draft

3. **Data Return Strategy**
   ```typescript
   // Return data structure
   interface ReturnData {
     receiverName: string;
     receiverAddress: string;    // Aggregated address
     receiverState: string;
     receiverPhone: string;
   }

   // Storage structure (for editing)
   interface StoredData {
     name: string;
     address: string;           // Complete or aggregated address
     state: string;
     phone: string;
     streetNumber?: string;     // Individual components
     landmark?: string;
     locality?: string;
     city?: string;
     pincode?: string;
   }
   ```

### Best Practices
1. **Address Handling**
   - Store both complete address and components
   - Validate address based on entry method
   - Preserve data during navigation
   - Clean up temporary storage appropriately

2. **Data Return**
   - Return aggregated address to new-order screen
   - Include all necessary components in storage
   - Handle both manual and search-based addresses consistently

3. **State Management**
   - Clear address field when switching to manual entry
   - Preserve manual components when using search
   - Validate address format before proceeding
   - Maintain data consistency across navigation

### Usage Notes
1. Handle both Google Places and manual address entry
2. Aggregate address components consistently
3. Validate address based on entry method
4. Return complete data to new-order screen
5. Preserve individual components for editing
6. Ensure proper data preservation during navigation
7. Handle cleanup and error cases appropriately 