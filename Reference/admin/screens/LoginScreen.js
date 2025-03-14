import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import FormInput from "../components/FormInput";
import FormButton from "../components/FormButton";
import SocialButton from "../components/SocialButton";
import { AuthContext } from "../navigation/AuthProvider";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const { login } = useContext(AuthContext);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/delivery_truck.png")}
          style={styles.logo}
        />
        <Text style={styles.text}>Logistics Admin App</Text>

        <FormInput
          labelValue={email}
          onChangeText={(userEmail) => setEmail(userEmail)}
          placeholderText="Email"
          iconType="user"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormInput
          labelValue={password}
          onChangeText={(userPassword) => setPassword(userPassword)}
          placeholderText="Password"
          iconType="lock"
          secureTextEntry={true}
        />

        <FormButton
          buttonTitle="Sign In"
          onPress={async () => {
            try {
              await login(email, password);
            } catch (error) {
              if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                Alert.alert(
                  'Login Failed',
                  'Invalid email or password. Please try again or create a new account.',
                  [
                    {
                      text: 'Try Again',
                      style: 'cancel'
                    },
                    {
                      text: 'Sign Up',
                      onPress: () => navigation.navigate('Signup')
                    }
                  ]
                );
              } else {
                Alert.alert('Error', error.message);
              }
            }
          }}
        />

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate("Phone-Login")}
        >
          <Text style={styles.navButtonText}>Sign in with OTP</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.forgotButton} onPress={() => {}}>
          <Text style={styles.navButtonText}>Forgot Password?</Text>
        </TouchableOpacity> */}

        <SocialButton
          buttonTitle="Sign In with Google"
          btnType="google"
          color="#de4d41"
          backgroundColor="#f5e7ea"
          onPress={() => { }}
        />

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.navButtonText}>
            Don't have an acount? Create here
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9fafd",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container2: {
    backgroundColor: "#f9fafd",
    flex: -1,
    justifyContent: "center",
    width: 300,
    height: 50,
    padding: 10,
    marginBottom: 30,
  },
  logo: {
    height: 150,
    width: 150,
    marginTop: 40,
    resizeMode: "cover",
  },
  text: {
    // fontFamily: 'Kufam-SemiBoldItalic',
    fontSize: 28,
    marginBottom: 10,
    color: "#051d5f",
  },
  navButton: {
    marginTop: 15,
  },
  forgotButton: {
    marginVertical: 35,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#2e64e5",
  },
});
