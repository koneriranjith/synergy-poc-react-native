import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import InCallManager from "react-native-incall-manager";

import CallAnswer from "../components/CallAnswer";

const IncomingCallScreen = ({ otherUserId, processAccept, setType }) => {
  useEffect(() => {
    InCallManager.startRingtone("ringback", "default");
    return () => {
      InCallManager.stopRingtone();
    };
  }, []);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-around",
        backgroundColor: "#050A0E",
      }}
    >
      <View
        style={{
          padding: 35,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 14,
        }}
      >
        <Text
          style={{
            fontSize: 36,
            marginTop: 12,
            color: "#ffff",
          }}
        >
          {otherUserId.current} is calling..
          {/* 48788 is calling... */}
        </Text>
      </View>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            processAccept();
            setType("WEBRTC_ROOM");
          }}
          style={{
            backgroundColor: "green",
            borderRadius: 30,
            height: 60,
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CallAnswer height={28} fill={"#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IncomingCallScreen;
