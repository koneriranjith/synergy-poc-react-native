import React, { useEffect, useState, useRef, useMemo } from "react";
import SocketIOClient from "socket.io-client";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import { useNetInfo } from "@react-native-community/netinfo";

import IncomingCallScreen from "./src/pages/IncomingCallScreen";
import OutgoingCallScreen from "./src/pages/OutgoingCallScreen";
import WebrtcRoomScreen from "./src/pages/WebrtcRoomScreen";
import JoinScreen from "./src/pages/JoinScreen";

import { getStream } from "./Utils";

const bitratesByNetworkType = {
  "wifi": 64000,
  "cellular-5g": 256000,
  "cellular-4g": 128000,
  "cellular-3g": 64000,
  "cellular-2g": 32000,
};

const getBitrateForNetwork = (networkType, networkDetails) => {
  if (networkType === "wifi") {
    return bitratesByNetworkType[networkType];
  } else if (networkType === "cellular") {
    const generation = networkDetails.cellularGeneration;
    return bitratesByNetworkType[`${networkType}-${generation}`] || 32000;
  }
  return 32000;
};

const setBitrateParameters = (peerConnection, bitrate) => {
  const sender = peerConnection
    .getSenders()
    .find((sender) => sender.track.kind === "video");
  if (sender && sender.setParameters) {
    const ratio = sender.track.getSettings().height / 2; //height can sent based on network speed
    const parameters = sender.getParameters();
    parameters.encodings[0].maxBitrate = bitrate;
    parameters.encodings[0].scaleResolutionDownBy = 1;
    console.log(
      "Sender, Params, Encodings : ",
      sender,
      " ",
      parameters.encodings[0],
      " ",
      parameters
    );
    sender
      .setParameters(parameters)
      .then(() => {
        console.log("Bitrate set successfully");
      })
      .catch((error) => {
        console.error("Error setting bitrate:", error);
      });
  } else {
    console.warn("Sender or setParameters method not available");
  }
};

export default function App() {
  const [type, setType] = useState("JOIN");
  const [localMicOn, setLocalMicOn] = useState(true);
  const [localWebcamOn, setLocalWebcamOn] = useState(true);
  const [callerId] = useState(
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const netInfo = useNetInfo();
  const otherUserId = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // const [isFront, setIsFront] = useState(true);
  const peerConnection = useRef(null);
  const remoteRTCMessage = useRef(null);
  const socket = useMemo(
    () =>
      SocketIOClient("https://call-end.onrender.com", {
        transports: ["websocket"],
        query: {
          callerId,
        },
      }),
    [callerId]
  );

  const peerConstraints = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };
  const constraints = {
    // optional: [
    //   { DtlsSrtpKeyAgreement: true }, // Enable DTLS-SRTP key agreement
    //   { googCpuOveruseDetection: true }, // Enable CPU overuse detection
    //   { googSuspendBelowMinBitrate: false }, //Do not suspend video
    //   // Other optional constraints can go here based on your requirements
    // ],
    mandatory: {
      // width: { min: 320, ideal: 640, max: 1280 },
      // height: { min: 240, ideal: 480, max: 720 },
      // frameRate: { min: 15, ideal: 24, max: 30 },
      // bitrate: { min: 32000, ideal: 256000, max: 1024000 },
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
      VoiceActivityDetection: true,
      // OfferToReceiveAudio: {
      //   OfferToReceiveAudio: [{ codec: "opus", maxptime: 60 }],
      // },
      // OfferToReceiveVideo: {
      //   OfferToReceiveVideo: [{ codec: "vp8", maxFramerate: 30 }],
      // },
    },
  };

  async function pearConnectionInit() {
    if (!peerConnection.current) {
      peerConnection.current = await new RTCPeerConnection(
        peerConstraints,
        constraints
      );
    }

    return peerConnection;
  }

  const sendICEcandidate = (data) => {
    socket.emit("ICEcandidate", data);
  };

  const mediaDevicesInit = async () => {
    const stream = await getStream();
    if (stream) {
      stream.scaleResolutionDownBy = 1;
      setLocalStream(stream);
      stream.getTracks().forEach(async (track) => {
        await peerConnection.current.addTrack(track, stream);
      });
    } else {
      console.log("stream not available");
    }
  };

  // useEffect(() => {
  //   const initializeConnection = async () => {
  //     if (type === "WEBRTC_ROOM" && !remoteStream) {
  //       await reinitialize();
  //     }
  //   };

  //   initializeConnection();
  // }, [type, remoteStream]);

  useEffect(() => {
    const adaptBitrate = async () => {
      if (netInfo.isConnected) {
        const bitrate = await getBitrateForNetwork(
          netInfo.type,
          netInfo.details
        );
        setBitrateParameters(peerConnection.current, bitrate);
      } else {
        console.log("netInfo is not Connected");
        return;
        // setBitrateParameters(peerConnection.current, 256000);
      }
    };
    let bitrateAdaptationInterval;
    if (type == "WEBRTC_ROOM") {
      bitrateAdaptationInterval = setInterval(adaptBitrate, 10000);
    } else {
      if (bitrateAdaptationInterval) {
        clearInterval(bitrateAdaptationInterval);
      }
    }

    return () => clearInterval(bitrateAdaptationInterval);
  }, [netInfo, type]);

  const reinitialize = async () => {
    console.log("reinitialize triggered!");
    try {
      await pearConnectionInit();
      await mediaDevicesInit();
      socket.on("ICEcandidate", async function (data) {
        console.log("handleICECandidate", data);
        let message = data.rtcMessage;
        if (peerConnection.current && data) {
          const rtcIceCandidate = await new RTCIceCandidate(message.candidate);
          peerConnection.current
            .addIceCandidate(rtcIceCandidate)
            .then((data) => {
              console.log("reinitialize in handleICECandidate", data);
            })
            .catch((err) => {
              console.log("reinitialize Error in handleICECandidate", err);
            });
        }
      });
      peerConnection.current.ontrack = handleRemoteStream;
      peerConnection.current.onicecandidate = handleOnICECandidate;
    } catch (error) {
      console.log("error in  reinitialize!", error);
    }
  };

  const streamCleanup = async () => {
    console.log("streamCleanup");
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream.release();
      }

      if (peerConnection.current) {
        await peerConnection.current.close();
        peerConnection.current = null;
      }

      setLocalStream(null);
      setRemoteStream(null);
      otherUserId.current = null;

      // reinitialize
      reinitialize();
      return null;
    } catch (error) {
      console.log("error in streamCleanup", error);
    }
  };

  async function init() {
    function handleNewCall(data) {
      console.log("handleNewCall", data);
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      setType("INCOMING_CALL");
    }

    async function handleCallEnded() {
      setType("JOIN");
      await streamCleanup();
    }

    async function handleCallAnswered(data) {
      console.log("handleCallAnswered", data);
      remoteRTCMessage.current = data.rtcMessage;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current)
      );
      setType("WEBRTC_ROOM");
    }

    async function handleICECandidate(data) {
      console.log("handleICECandidate data check", data);
      let message = data.rtcMessage;
      if (peerConnection.current && data) {
        const rtcIceCandidate = await new RTCIceCandidate({
          candidate: message.candidate,
          sdpMid: message.id,
          sdpMLineIndex: message.label,
        });
        peerConnection.current
          .addIceCandidate(rtcIceCandidate)
          .then((data) => {
            console.log("SUCCESS in handleICECandidate", data);
          })
          .catch((err) => {
            console.log("Error in handleICECandidate", err);
          });
      }
    }

    InCallManager.start({ media: "audio" });
    await pearConnectionInit();
    await mediaDevicesInit();
    socket.on("newCall", handleNewCall);
    socket.on("callAnswered", handleCallAnswered);
    socket.on("callEnded", handleCallEnded);
    socket.on("ICEcandidate", handleICECandidate);
    peerConnection.current.ontrack = handleRemoteStream;
    peerConnection.current.onicecandidate = handleOnICECandidate;
  }

  function unsubscribe() {
    socket.off("newCall");
    socket.off("callAnswered");
    socket.off("ICEcandidate");
    socket.off("callEnded");
    InCallManager.stop();
  }

  useEffect(() => {
    init();
    return () => {
      unsubscribe();
    };
  }, []);

  async function processCall() {
    console.log("processCall");
    try {
      const offerDescription = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offerDescription);
      sendCall({
        calleeId: otherUserId.current,
        rtcMessage: offerDescription,
      });
    } catch (error) {
      console.error("Error in processCall:", error);
    }
  }

  async function processAccept() {
    console.log("processAccept");
    try {
      await InCallManager.stopRingtone();

      // Use the received offerDescription
      const offerDescription = new RTCSessionDescription(
        remoteRTCMessage.current
      );
      await peerConnection.current.setRemoteDescription(offerDescription);

      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);
      answerCall({
        callerId: otherUserId.current,
        rtcMessage: answerDescription,
      });
      // Send the answerDescription back as a response to the offerDescription.
    } catch (err) {
      // Handle Errors
      console.error("Error in processAccept:", err);
    }
  }

  function answerCall(data) {
    socket.emit("answerCall", data);
  }

  function sendCall(data) {
    socket.emit("call", data);
  }
  function switchCamera() {
    localStream.getVideoTracks().forEach((track) => {
      track._switchCamera();
    });
  }

  const toggleMedia = (type) => {
    const trackType = type === "mic" ? "getAudioTracks" : "getVideoTracks";
    const currentTrackState = type === "mic" ? localMicOn : localWebcamOn;

    localStream[trackType]().forEach((track) => {
      track.enabled = !currentTrackState;
    });

    type === "mic"
      ? setLocalMicOn(!currentTrackState)
      : setLocalWebcamOn(!currentTrackState);
  };

  function handleRemoteStream(event) {
    console.log("handleRemoteStream", event.streams[0]);
    console.log("test event.streams[0]", event.streams[0]);
    console.log("test remoteStream.toURL()", event.streams[0].toURL());
    if (event.streams && event.streams.length) {
      setRemoteStream(event.streams[0]);
    } else {
      console.log("No stream available");
    }
  }

  function handleOnICECandidate(event) {
    console.log("handleOnICECandidate", event.candidate);
    if (event.candidate) {
      sendICEcandidate({
        calleeId: otherUserId.current,
        rtcMessage: {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        },
      });
    } else {
      console.log("End of candidates.");
    }
  }

  const leave = async () => {
    try {
      setType("JOIN");
      socket.emit("callEnded", { calleeId: otherUserId.current });
      await streamCleanup();
    } catch (error) {
      console.error("Error in leave:", error);
    }
  };
  switch (type) {
    case "JOIN":
      return (
        <JoinScreen
          callerId={callerId}
          otherUserId={otherUserId}
          processCall={processCall}
          setType={setType}
        />
      );
    case "INCOMING_CALL":
      return (
        <IncomingCallScreen
          otherUserId={otherUserId}
          processAccept={processAccept}
          setType={setType}
        />
      );
    case "OUTGOING_CALL":
      return <OutgoingCallScreen otherUserId={otherUserId} setType={setType} />;
    case "WEBRTC_ROOM":
      return (
        <WebrtcRoomScreen
          key={remoteStream}
          localStream={localStream}
          remoteStream={remoteStream}
          localMicOn={localMicOn}
          localWebcamOn={localWebcamOn}
          toggleMic={() => {
            toggleMedia("mic");
          }}
          leave={leave}
          toggleCamera={() => {
            toggleMedia("camera");
          }}
          switchCamera={switchCamera}
        />
      );
    default:
      return null;
  }
}
