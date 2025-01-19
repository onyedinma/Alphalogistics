import React, { useState, useEffect } from "react";
import * as firebase from "firebase";
import StaffCard2 from "../components/StaffCard2";
import { View, FlatList, Picker, StyleSheet, Text, Alert } from "react-native";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import FormInput from "../components/FormInput";

const CustomerProfile = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [arrHolder, setArrHolder] = useState([]);
  const [pickerSelectedVal, setPickerSelectedVal] = useState("custid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dbRef = firebase.database().ref("/users/ProfileDetails/");
    
    const handleData = (snapshot) => {
      try {
        const data = snapshot.val();
        const usersList = [];
        
        if (data) {
          Object.keys(data).forEach(key => {
            const val = data[key];
            Object.keys(val).forEach(key_2 => {
              if (val[key_2]) {
                const val_2 = val[key_2];
                usersList.push({
                  id: new Date().getTime().toString() + (Math.floor(Math.random() * Math.floor(new Date().getTime()))).toString(),
                  custid: key,
                  name: val_2["Name"],
                  PhoneNum: val_2["Phone_number"],
                  custUserID: val_2["User_name"]
                });
              }
            });
          });
        }
        setUsers(usersList);
        setArrHolder(usersList);
      } catch (error) {
        Alert.alert('Error', 'Failed to load customer data');
        console.error('Error loading customer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    dbRef.on("value", handleData);
    return () => dbRef.off("value", handleData);
  }, []);

  const handleCheck = (custid, Name, PhoneNum, custUserID) => {
    navigation.navigate("CustomerProfileTable", {
      user_id: custid,
      custName: Name,
      phoneNo: PhoneNum,
      userName: custUserID,
      screen: "CustomerProfiles",
    });
  };

  const filterFunc = (text) => {
    const newData = users.filter((item) => {
      const itemData = item[pickerSelectedVal].toLowerCase();
      return itemData.includes(text.toLowerCase());
    });
    setArrHolder(newData);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        <View style={styles.buttonStyle}>
          <Text style={[styles.text, { marginTop: 20, flexDirection: "row" }]}>
            Filter By
          </Text>
          <Picker
            selectedValue={pickerSelectedVal}
            style={[styles.inputsingle, { height: 50, width: 155 }]}
            onValueChange={setPickerSelectedVal}
          >
            <Picker.Item
              label="Customer ID"
              value="custid"
              style={styles.labelPicker}
            />
            <Picker.Item
              label="Customer Name"
              value="name"
              style={styles.labelPicker}
            />
            <Picker.Item
              label="Customer Phone Number"
              value="PhoneNum"
              style={styles.labelPicker}
            />
          </Picker>
        </View>
      </View>

      <FormInput
        onChangeText={filterFunc}
        placeholderText="Search..."
        iconType="search1"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FlatList
        data={arrHolder}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCheck(
              item.custid,
              item.name,
              item.PhoneNum,
              item.custUserID
            )}
          >
            <StaffCard2 
              staffName={item.name} 
              staffNum={item.PhoneNum} 
              staffId={item.custid}
            />
          </TouchableOpacity>
        )}
        style={{ marginTop: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f4f4",
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsingle: {
    borderWidth: 1,
    borderColor: "#777",
    padding: 5,
    marginTop: 10,
    borderRadius: 125,
    marginBottom: 5,
    width: 250,
    height: 30,
    color: "#2e64e5",
    backgroundColor: "#465881",
  },
  labelPicker: {
    fontSize: 18,
  },
  text: {
    color: "#051d5f",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default CustomerProfile;

