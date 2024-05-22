import { mediaDevices } from "react-native-webrtc";

export async function getStream() {
  const sourceInfos = await mediaDevices.enumerateDevices();
  let videoSourceId;
  let isFront = true;
  for (let i = 0; i < sourceInfos.length; i++) {
    const sourceInfo = sourceInfos[i];
    if (
      sourceInfo.kind === "videoinput" &&
      sourceInfo.facing === (isFront ? "user" : "environment")
    ) {
      videoSourceId = sourceInfo.deviceId;
    }
  }

  const stream = await mediaDevices.getUserMedia({
    audio: true,
    video: {
      width: { min: 320, ideal: 640, max: 1280 },
      height: { min: 240, ideal: 480, max: 720 },
      frameRate: { min: 15, ideal: 24, max: 30 },
      bitrate: { min: 32000, ideal: 256000, max: 1024000 },
      facingMode: isFront ? "user" : "environment",
      deviceId: videoSourceId,
      // optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
    },
  });

  if (typeof stream != "boolean") return stream;

  return null;
}
