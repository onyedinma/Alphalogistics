import React from "react";
import "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import BookingScreen from "./Booking";
import HomeScreen from "./HomeScreen";
import ProfileScreen from "./Profile";
import SignupScreen from "./SignupScreen";
import InvoiceScreen from "./InvoiceScreen";
import InvoiceBooking from "./InvoiceBooking";
import UpdateUserDetails from "./UpdateUserDetails";
import ResetPassword from "./ResetPassword";
import ResetEmail from "./ResetEmail";
import History from "./History";
import InvoiceTrack from "./InvoiceTrack";
import TrackStaff from "./TrackStaff";
import InvoicePDF from "./InvoicePDF";
import NotifyScreen from "./NotifyScreen";
import Feedback from "./Feedback";
import Track from "./Track";
import { DrawerContent } from "./DrawerContent";

const HomeStack = createStackNavigator();
const BookingStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const TrackStack = createStackNavigator();
const SignInStack = createStackNavigator();
const NotifyStack = createStackNavigator();

const HomeStackScreen = ({ navigation }) => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),

          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),

          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="NotificationScreen"
        component={NotifyScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />

      <HomeStack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="Invoice-Booking"
        component={InvoiceBooking}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />

      <HomeStack.Screen
        name="History"
        component={History}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="Invoice"
        component={InvoiceScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="Invoice-Track"
        component={InvoiceTrack}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="Track-Staff"
        component={TrackStaff}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <HomeStack.Screen
        name="Invoice-PDF"
        component={InvoicePDF}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
    </HomeStack.Navigator>
  );
};

const BookingStackScreen = ({ navigation }) => {
  return (
    <BookingStack.Navigator>
      <BookingStack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <BookingStack.Screen
        name="Invoice-Booking"
        component={InvoiceBooking}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />

      <BookingStack.Screen
        name="NotificationScreen"
        component={NotifyScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
    </BookingStack.Navigator>
  );
};

const ProfileStackScreen = ({ navigation }) => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="UpdateUserDetails"
        component={UpdateUserDetails}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Reset-Password"
        component={ResetPassword}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Reset-Email"
        component={ResetEmail}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="History"
        component={History}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Invoice"
        component={InvoiceScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Invoice-Track"
        component={InvoiceTrack}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Track-Staff"
        component={TrackStaff}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Invoice-PDF"
        component={InvoicePDF}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />

      <ProfileStack.Screen
        name="NotificationScreen"
        component={NotifyScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <ProfileStack.Screen
        name="Feedback"
        component={Feedback}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
    </ProfileStack.Navigator>
  );
};

const TrackStackScreen = ({ navigation }) => {
  return (
    <TrackStack.Navigator>
      <TrackStack.Screen
        name="Track"
        component={Track}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      {/* <TrackStack.Screen
        name="Invoice-Booking"
        component={InvoiceBooking}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      /> */}

      <TrackStack.Screen
        name="NotificationScreen"
        component={NotifyScreen}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
      <TrackStack.Screen
        name="Invoice-Track"
        component={InvoiceTrack}
        options={{
          headerLeft: () => (
            <Icon.Button
              name="ios-menu"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.openDrawer()}
            ></Icon.Button>
          ),
          headerRight: () => (
            <Icon.Button
              name="ios-notifications"
              size={25}
              backgroundColor="#88c7eb"
              onPress={() => navigation.navigate("NotificationScreen")}
            ></Icon.Button>
          ),
          headerStyle: {
            backgroundColor: "#88c7eb",
          },
          headerTintColor: "#35126e",
        }}
      />
    </TrackStack.Navigator>
  );
};
// const NotifyStackScreen = ({ navigation }) => {
//    return (
//      <NotifyStack.Navigator>
//        <NotifyStack.Screen
//          name="NotificationScreen"
//          component={NotifyScreen}
//          options={{
//            headerLeft: () => (
//              <Icon.Button
//                name="ios-menu"
//                size={25}
//                backgroundColor="#88c7eb"
//                onPress={() => navigation.openDrawer()}
//              ></Icon.Button>
//            ),
//            headerStyle: {
//              backgroundColor: "#88c7eb",
//          },
//         headerTintColor: "#35126e",
//          }}
//        />
//      </NotifyStack.Navigator>
//    );
//  };
// const SignInStackScreen = ({ navigation }) => {
//   return (
//     <SignInStack.Navigator>
//       <SignInStack.Screen
//         name="SignIn"
//         component={SignupScreen}
//         options={{
//           headerLeft: () => (
//             <Icon.Button
//               name="ios-menu"
//               size={25}
//               backgroundColor="#88c7eb"
//               onPress={() => navigation.openDrawer()}
//             ></Icon.Button>
//           ),
//           headerStyle: {
//             backgroundColor: "#88c7eb",
//           },
//           headerTintColor: "#35126e",
//         }}
//       />
//     </SignInStack.Navigator>
//   );
// };
const Tab = createMaterialBottomTabNavigator();

const bottomTabNav = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      activeColor="#1094e0"
      inactiveColor="#cf808a"
      barStyle={{ backgroundColor: "#88c7eb" }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: "Home",
          tabBarColor: "#34ebc0",
          tabBarIcon: ({ color }) => (
            <Icon name="ios-home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingStackScreen}
        options={{
          tabBarLabel: "Book",
          tabBarColor: "#34ebc0",
          tabBarIcon: ({ color }) => (
            <Icon name="ios-pricetags" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarColor: "#34ebc0",
          tabBarIcon: ({ color }) => (
            <Icon name="ios-person" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
const Drawer = createDrawerNavigator();

const DrawerNav = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      initialRouteName="Home"
      drawerStyle={{
        backgroundColor: "#88c7eb",
        width: 270,
      }}
      drawerContentOptions={{
        activeTintColor: "#362dad",
        inactiveTintColor: "#4054c7",
      }}
    >
      <Drawer.Screen name="Home" component={bottomTabNav} />
      <Drawer.Screen name="Booking" component={BookingStackScreen} />
      <Drawer.Screen name="Track" component={TrackStackScreen} />
      <Drawer.Screen name="Profile" component={ProfileStackScreen} />
      {/*<Drawer.Screen name="NotificationScreen" component={NotifyStackScreen} />*}
      {/* <Drawer.Screen name="SignIn" component={SignInStackScreen} /> */}
    </Drawer.Navigator>
  );
};

const MainTabScreen = () => {
  return <DrawerNav />;
};
export default MainTabScreen;
