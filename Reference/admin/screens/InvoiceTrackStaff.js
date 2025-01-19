import React, { useContext, useState, Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AuthContext } from "../navigation/AuthProvider";
import FormButton from "../components/FormButton";
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
  Cols,
} from "react-native-table-component";
import * as firebase from "firebase";
import { db } from "../firebaseConfig";
import { windowHeight, windowWidth } from "../utils/Dimensions";

const InvoiceTrackStaff = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  var path = "";
  var pdf_obj;
  var phone,
    pickup,
    pickup2, //City,state and pincode for pickup address
    delivery,
    delivery2, //City,state and pincode for delivery address
    category,
    length,
    breadth,
    height,
    dimension,
    weight,
    type,
    order_val,
    insurance,
    priority,
    time,
    shorttime,
    vehicle_type;
  const { user_id, order_id , staff_id} = route.params;
  var bookingRef = firebase
    .database()
    .ref(`/users/booking/${user_id}/${order_id}`);
  bookingRef.on("value", function (data) {
    var newBooking = data.val();
    phone = newBooking.phone;
    pickup = newBooking.street_pickup+", "+newBooking.residence_locality_pickup;
    pickup2 =
      newBooking.city_pickup +
      ", " +
      newBooking.state_pickup +
      ", " +
      newBooking.pincode_pickup;
    delivery = newBooking.street_delivery+", "+newBooking.residence_locality_delivery;
    delivery2 =
      newBooking.city_delivery +
      "," +
      newBooking.state_delivery +
      "," +
      newBooking.pincode_delivery;
    category = newBooking.PickerSelectedVal;
    length = newBooking.length;
    breadth = newBooking.breadth;
    height = newBooking.height;
    dimension=length+" * "+breadth+" * "+height;
    weight = newBooking.weight;
    type = newBooking.type;
    order_val = newBooking.order;
    vehicle_type = newBooking.vehicle;
    time = new Date(newBooking.Time);
    shorttime =
      time.getDate() +
      "/" +
      (time.getMonth() + 1) +
      "/" +
      time.getFullYear() +
      " , " +
      time.getHours() +
      ":" +
      time.getMinutes();

    if (newBooking.insurance == true) insurance = "Yes";
    else insurance = "No";

    if (newBooking.Priority_Booking == true) priority = "Yes";
    else priority = "No";
    if (category == "Bulk") {
      dimension = "Not Applicable";
      weight = "Not Applicable";
      type = "Not Applicable";
      order_val = "Not Applicable";
    }

  });
  const [curr, next] = useState({
    tableHead: ["", "Details"],
    tableTitle: [
      "Pickup-Add1",
      "Pickup-Add2",
      "Delivery-Add1",
      "Delivery-Add2",
      "Phone no.",
      "Category",
      "Dimension",
      "Weight",
      "Type",
      "Order Value",
      "Vehicle",
      "Insurance",
      "Prior-Booking",
      "Booking-Time",
    ],
    tableData: [
      [`${pickup}`],
      [`${pickup2}`],
      [`${delivery}`],
      [`${delivery2}`],
      [`${phone}`],
      [`${category}`],
      [`${dimension}`],
      [`${weight}`],
      [`${type}`],
      [`${order_val}`],
      [`${vehicle_type}`],
      [`${insurance}`],
      [`${priority}`],
      [`${shorttime}`],
    ],
  });

  var bref = firebase.database().ref(`/admin/Verified`);
  bref.on("value", function (snapshot) {
    const data = snapshot.val();
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var val = data[key];
        if (val["userId"] == user_id && val["orderId"] == order_id)
          path = val["base64"];
      }
    }
  });
  const pdf_gen = () => {
    pdf_obj = {
      pickup: pickup,
      pickup2: pickup2,
      delivery: delivery,
      delivery2: delivery2,
      phone: phone,
      category: category,
      volume: dimension,
      weight: weight,
      type: type,
      order_val: order_val,
      vehicle_type: vehicle_type,
      insurance: insurance,
      priority: priority,
      time: shorttime,
    };
    console.log(pdf_obj);
  };
  const state = curr;
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.top}>Order Details</Text>
        <Table borderStyle={{ borderWidth: 2 }}>
          <Row
            data={state.tableHead}
            flexArr={[0, 2.02, 0, 0]}
            style={styles.head}
            textStyle={styles.text}
          />
          <TableWrapper style={styles.wrapper}>
            <Col
              data={state.tableTitle}
              style={styles.title}
              heightArr={[60, 60, 60]}
              textStyle={styles.text}
            />
            <Rows
              data={state.tableData}
              flexArr={[0, 0, 2]}
              style={styles.row}
              textStyle={styles.text}
            />
          </TableWrapper>
        </Table>
        
        <FormButton
          buttonTitle="Print Invoice as PDF"
          onPress={() => {
            pdf_gen();
            navigation.navigate("Invoice-PDF", { pdf_det: pdf_obj });
          }}
        />
        <FormButton
          buttonTitle={"Track order"}
          onPress={() => navigation.navigate("TrackStaff", { user: staff_id })}
        />
        <FormButton
          buttonTitle={"Back"}
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScrollView>
  );
};

export default InvoiceTrackStaff;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 50,
    backgroundColor: "#fff",
  },
  head: { height: 40, backgroundColor: "#f1f8ff" },
  wrapper: { flexDirection: "row" },
  title: { flex: 1, backgroundColor: "#f6f8fa" },
  row: { height: 60 },
  text: { textAlign: "left" ,marginLeft:10},
  top: {
    textAlign: "center",
    fontSize: 20,
    paddingBottom: 20,
    color: "#051d5f",
  },
  imageHead: {
    marginVertical: "5%",
    textAlign: "center",
    color: "#c43d10",
    fontSize: 20,
    fontFamily: "serif",
  },
  image: {
    flex: 1,
    width: windowWidth / 1.11,
    height: windowHeight / 1.9,
  },
});
