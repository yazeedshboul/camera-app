import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import REFS from 'react-native-fs';
import { Camera, CameraCaptureError, VideoFile, useCameraDevices } from 'react-native-vision-camera';

function App(): JSX.Element {
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(true); // Track whether capturing a photo or video
  const [imageSource, setImageSource] = useState('');
  const [videoSource, setVideoSource] = useState('');
  const destinationPhotoPath = REFS.ExternalDirectoryPath + '/capturedPhoto.jpg';
  const destinationVideoPath = REFS.ExternalDirectoryPath + '/capturedVideo.mp4';
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      // Check camera permissions:
      const newCameraPermission = await Camera.requestCameraPermission();
      const newMicrophonePermission = await Camera.requestMicrophonePermission();

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Cool Photo App Camera Permission',
            message: 'Your app needs permission.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          console.log('Camera permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    })();
  }, []);

  const captureMedia = async () => {
    if (camera.current !== null) {
      try {
        // Stop video recording if in progress
        if (isRecording) {
          await camera.current.stopRecording();
          setIsRecording(false);
        }

        if (isCapturingPhoto) {
          // Capture Photo
          const photo = await camera.current.takePhoto({});
          setImageSource(photo.path);

          try {
            // Copy the captured photo to the destination path.
            await REFS.copyFile(photo.path, destinationPhotoPath);
            console.log('Photo saved:', destinationPhotoPath);
          } catch (error) {
            console.error('Error saving the photo:', error);
          }
        } else {
          // Start Video Recording
          await camera.current.startRecording({
            onRecordingError: (error: CameraCaptureError) => {
              console.error('Error recording video:', error);
            },
            onRecordingFinished: async (videoFile: VideoFile) => {
              setVideoSource(videoFile.path);

              try {
                // Copy the recorded video to the destination path.
                await REFS.copyFile(videoFile.path, destinationVideoPath);
                console.log('Video saved:', destinationVideoPath);
              } catch (error) {
                console.error('Error saving the video:', error);
              }
            },
          });
          setIsRecording(true);
        }
      } catch (error) {
        console.error('Error capturing media:', error);
      }
    }
  };

  const toggleCaptureMode = () => {
    // Toggle between capturing a photo and capturing a video
    setIsCapturingPhoto((prev) => !prev);
  };

  if (device == null) return <ActivityIndicator />;

  return (
    <View style={styles.all}>
      <View style={styles.camera}>
        <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} video={true} zoom={1} />
      </View>
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity onPress={captureMedia} style={styles.captureButton}>
          <Text style={{ fontSize: 14, color: 'white' }}>{isCapturingPhoto ? 'Capture Photo' : 'Record Video'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCaptureMode} style={styles.toggleButton}>
          <Text style={{ fontSize: 14, color: 'white' }}>{isCapturingPhoto ? 'Switch to Video' : 'Switch to Photo'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    flex: 1,
  },
  camera: {
    flex: 1,
    alignItems: 'center',
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'rgba(0, 128, 0, 0.5)', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50, 
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: 'rgba(0, 0, 128, 0.5)', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50, 
  },
});

export default App;
