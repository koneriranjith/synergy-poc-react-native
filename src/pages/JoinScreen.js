import React from "react";
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import TextInputContainer from "../pages/TextInputContainer";

const JoinScreen = ({
  callerId,
  otherUserId,
  processCall,
  setType,
  callerIds,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        backgroundColor: "#050A0E",
        justifyContent: "center",
        paddingHorizontal: 42,
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <>
          <View
            style={{
              padding: 35,
              backgroundColor: "#1A1C22",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
              }}
            >
              Your Caller ID
            </Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  color: "#ffff",
                  letterSpacing: 6,
                }}
              >
                {callerId}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#1A1C22",
              padding: 40,
              marginTop: 25,
              justifyContent: "center",
              borderRadius: 14,
            }}
          >
            {/* {callerIds.length
              ? callerIds.map((item) => (
                  <Text
                    style={{
                      fontSize: 18,
                      color: "#D0D4DD",
                    }}
                  >
                    {item.callerId}
                  </Text>
                ))
              : null} */}
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
              }}
            >
              Enter call id of another user
            </Text>
            <TextInputContainer
              placeholder={"Enter Caller ID"}
              value={otherUserId.current}
              setValue={(text) => {
                otherUserId.current = text;
              }}
              keyboardType={"number-pad"}
            />
            <TouchableOpacity
              onPress={() => {
                if (otherUserId.current) {
                  processCall();
                  setType("OUTGOING_CALL");
                } else {
                  Alert.alert("Error", "Please Enter UserId");
                }
              }}
              style={{
                height: 50,
                backgroundColor: "#5568FE",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                Call Now
              </Text>
            </TouchableOpacity>
          </View>
        </>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default JoinScreen;
