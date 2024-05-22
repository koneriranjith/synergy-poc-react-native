import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { RTCView } from "react-native-webrtc";
import CallEnd from "../components/CallEnd";
import MicOn from "../components/MicOn";
import MicOff from "../components/MicOff";
import VideoOn from "../components/VideoOn";
import VideoOff from "../components/VideoOff";
import CameraSwitch from "../components/CameraSwitch";
import IconContainer from "../pages/IconContainer";

import InCallManager from "react-native-incall-manager";

const WebrtcRoomScreen = ({
  localStream,
  remoteStream,
  localMicOn,
  toggleMic,
  leave,
  toggleCamera,
  localWebcamOn,
  switchCamera,
}) => {
  useEffect(() => {
    InCallManager.setSpeakerphoneOn(true);
    return () => {
      InCallManager.setSpeakerphoneOn(false);
    };
  }, []);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050A0E",
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      {localStream ? (
        <Text style={{ color: "blue" }}>{localStream.toURL()}</Text>
      ) : null}
      {remoteStream ? (
        <Text style={{ color: "red" }}>{remoteStream.toURL()}</Text>
      ) : null}
      {localStream ? (
        <RTCView
          objectFit={"cover"}
          style={{ flex: 1, backgroundColor: "#050A0E" }}
          streamURL={localStream && localStream.toURL()}
        />
      ) : null}
      {remoteStream ? (
        <RTCView
          objectFit={"cover"}
          style={{
            flex: 1,
            backgroundColor: "#050A0E",
            marginTop: 8,
          }}
          streamURL={remoteStream && remoteStream.toURL()}
        />
      ) : null}
      <View
        style={{
          marginVertical: 12,
          flexDirection: "row",
          justifyContent: "space-evenly",
        }}
      >
        <IconContainer
          backgroundColor={"red"}
          onPress={() => {
            leave();
          }}
          Icon={() => {
            return <CallEnd height={26} width={26} fill="#FFF" />;
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={!localMicOn ? "#fff" : "transparent"}
          onPress={() => {
            toggleMic();
          }}
          Icon={() => {
            return localMicOn ? (
              <MicOn height={24} width={24} fill="#FFF" />
            ) : (
              <MicOff height={28} width={28} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={!localWebcamOn ? "#fff" : "transparent"}
          onPress={() => {
            toggleCamera();
          }}
          Icon={() => {
            return localWebcamOn ? (
              <VideoOn height={24} width={24} fill="#FFF" />
            ) : (
              <VideoOff height={36} width={36} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={"transparent"}
          onPress={() => {
            switchCamera();
          }}
          Icon={() => {
            return <CameraSwitch height={24} width={24} fill="#FFF" />;
          }}
        />
      </View>
    </View>
  );
};

export default WebrtcRoomScreen;
