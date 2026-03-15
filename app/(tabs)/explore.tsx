import { useCallback, useEffect } from "react";
import { PermissionsAndroid, Platform, View } from "react-native";
import { BleManager, Characteristic, Device, ScanMode } from "react-native-ble-plx";

async function requestBluetoothPermissions() {
  if (Platform.OS === "android") {
    if (Platform.Version >= 31) {
      // Android 12+ (API 31+)
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      return (
        result["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
        result["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      // Android 11 and below (API 30-)
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Bluetooth Low Energy requires Location permission to scan for devices.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true; // iOS handles permissions differently
}

const UUID = "7a8e9c3b-5e2f-4d9b-b6f1-3c4a8d2e7f10";
const CHARACTERISTIC_UUID = "c1f4a2b8-6d7e-4a53-9f12-0e3b7c9d5a44";

const ExploreScreen = () => {
  const getCharAndDevice = (
    manager: BleManager,
  ): Promise<{ characteristic: Characteristic; device: Device }> => {
    return new Promise((resolve, reject) => {
      manager.startDeviceScan(
        [UUID],
        {
          scanMode: ScanMode.LowLatency,
        },
        async (err, device) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          console.log("d: ", device, device?.serviceUUIDs);
          if (device?.name && device.serviceUUIDs) {
            for (let uuid of device.serviceUUIDs) {
              if (uuid === UUID) {
                manager.stopDeviceScan();
                const connectedDevice = await manager.connectToDevice(device.id);
                await connectedDevice.discoverAllServicesAndCharacteristics();
                const characteristic = await connectedDevice.readCharacteristicForService(
                  UUID,
                  CHARACTERISTIC_UUID,
                );

                resolve({ characteristic, device });
              }
            }
          }
        },
      );
    });
  };

  const init = useCallback(async (manager: BleManager) => {
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        console.warn("User denied Bluetooth permissions");
        return;
      }
      console.log("Got user permission for BT");
      const { characteristic, device } = await getCharAndDevice(manager);
      console.log({ mtu: device.mtu });
      setTimeout(() => {
        console.log("send msg")
        characteristic.writeWithoutResponse("eyJtc2ciOiAiSGVsbG9CTEUifQo=")
      }, 500)
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    const manager = new BleManager();

    init(manager);

    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, [init]);

  return <View></View>;
};

export default ExploreScreen;

// // import { setServices, startAdvertising, stopAdvertising } from "munim-bluetooth-peripheral";
// // import React, { useEffect, useState } from "react";
// // import {
// //   Alert,
// //   PermissionsAndroid,
// //   Platform,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";

// // const DEVICE_NAME = "realme C67 5G";

// // export default function App() {
// //   const [isAdvertising, setIsAdvertising] = useState(false);
// //   const [isConnected, setIsConnected] = useState(false);

// //   useEffect(() => {
// //     // Listen for connection events
// //     // const subscription = addListener('connectionStateChanged', (event) => {
// //     //   console.log('Connection State Change:', event);
// //     //   // event.connected will be true when the Go app calls adapter.Connect()
// //     //   setIsConnected(event.connected);
// //     //   if (event.connected) {
// //     //     Alert.alert("Success", "Privileged Go Process Connected!");
// //     //   }
// //     // });
// //     // return () => subscription.remove();
// //   }, []);

// //   const requestBluetoothPermissions = async () => {
// //     if (Platform.OS === "android" && Platform.Version >= 31) {
// //       const granted = await PermissionsAndroid.requestMultiple([
// //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
// //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
// //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
// //       ]);

// //       return (
// //         granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
// //         granted["android.permission.BLUETOOTH_ADVERTISE"] === PermissionsAndroid.RESULTS.GRANTED
// //       );
// //     }
// //     return true; // For older Android or iOS
// //   };

// //   const handleStartPeripheral = async () => {
// //     const hasPermission = await requestBluetoothPermissions();
// //     if (!hasPermission) {
// //       Alert.alert("Permission Denied", "I need Bluetooth permissions to act as a key.");
// //       return;
// //     }
// //     try {
// //       await setServices([
// //         {
// //           uuid: "0000180D-0000-1000-8000-00805F9B34FB",
// //           characteristics: [
// //             {
// //               uuid: "00002A37-0000-1000-8000-00805F9B34FB",
// //               properties: ["read", "notify"],
// //               value: "Hello",
// //             },
// //           ],
// //         },
// //       ]);

// //       await startAdvertising({
// //         serviceUUIDs: ["0000180D-0000-1000-8000-00805F9B34FB"],
// //         manufacturerData: "474F424B",
// //       });

// //       // await startAdvertising({
// //       //   serviceUUIDs: ["0000180D-0000-1000-8000-00805F9B34FB"],
// //       //   localName: DEVICE_NAME,
// //       //   advertisingData: {
// //       //     completeLocalName: DEVICE_NAME,
// //       //     shortenedLocalName: DEVICE_NAME,
// //       //   },
// //       // });
// //       // 1. Define Service & Characteristics
// //       // await setServices([
// //       //   {
// //       //     uuid: SERVICE_UUID,
// //       //     characteristics: [
// //       //       {
// //       //         uuid: "12345678-1234-1234-1234-1234567890ab",
// //       //         properties: ["read", "write", "notify"],
// //       //         // permissions: ['readable', 'writable'],
// //       //       },
// //       //     ],
// //       //   },
// //       // ]);

// //       // // 2. Start Advertising
// //       // await startAdvertising({
// //       //   serviceUUIDs: [SERVICE_UUID],
// //       //   localName: DEVICE_NAME,
// //       //   advertisingData: {
// //       //     flags
// //       //     // Leave this empty to keep the main packet small (just the UUID)
// //       //   },
// //       //   // scanResponseData: {
// //       //   //   completeLocalName: DEVICE_NAME, // Move the name here!
// //       //   // },
// //       // });

// //       setIsAdvertising(true);
// //       console.log("Broadcasting as:", DEVICE_NAME);
// //     } catch (error) {
// //       console.error("Start Error:", error);
// //       Alert.alert("Error", "Failed to start advertising");
// //     }
// //   };

// //   const handleStopPeripheral = async () => {
// //     await stopAdvertising();
// //     setIsAdvertising(false);
// //     setIsConnected(false);
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.header}>BLE Security Key</Text>

// //       <View style={[styles.statusBox, { backgroundColor: isConnected ? "#4CAF50" : "#FF9800" }]}>
// //         <Text style={styles.statusText}>
// //           {isConnected ? "CONNECTED TO GO BRIDGE" : isAdvertising ? "ADVERTISING..." : "IDLE"}
// //         </Text>
// //       </View>

// //       <TouchableOpacity
// //         style={styles.button}
// //         onPress={isAdvertising ? handleStopPeripheral : handleStartPeripheral}
// //       >
// //         <Text style={styles.buttonText}>
// //           {isAdvertising ? "Stop Advertising" : "Start Advertising"}
// //         </Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }

// // import { setServices, startAdvertising, stopAdvertising, addEventListener } from "munim-bluetooth";

// import React, { useEffect, useState, useRef } from "react";
// import {
//   Alert,
//   PermissionsAndroid,
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const DEVICE_NAME = "realme C67 5G";

// export default function App() {
//   const [isAdvertising, setIsAdvertising] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);

//   // 1. Create a buffer to hold the incoming chunks
//   const messageBuffer = useRef("");

//   useEffect(() => {
//     // Listen for connection events (Optional, but good for UI)
//     // const connSubRemove = addEventListener("connectionStateChanged", (event) => {
//     //   setIsConnected(event.connected);
//     // });

//     // // 2. Listen for incoming write requests from the Go app
//     // const writeSubRemove = addEventListener("onWriteRequest", (event) => {
//     //   // NOTE: Depending on how "munim-bluetooth-peripheral" is built,
//     //   // event.value might be a base64 string. If your JSON looks like gibberish,
//     //   // you will need to decode it from base64 first!
//     //   const incomingChunk = event.value;

//     //   // Append the new chunk to our ongoing buffer
//     //   messageBuffer.current += incomingChunk;

//     //   // 3. Check if we received the end-of-message delimiter (\n)
//     //   if (messageBuffer.current.includes("\n")) {
//     //     try {
//     //       // Clean up the string and parse the full JSON
//     //       const completeMessage = messageBuffer.current.trim();
//     //       const parsedData = JSON.parse(completeMessage);

//     //       console.log("Successfully assembled full JSON:", parsedData);
//     //       Alert.alert("Data Received!", JSON.stringify(parsedData));
//     //     } catch (error) {
//     //       console.error("Failed to parse JSON string:", messageBuffer.current);
//     //     } finally {
//     //       // 4. ALWAYS clear the buffer after processing, ready for the next message
//     //       messageBuffer.current = "";
//     //     }
//     //   }
//     // });

//     // return () => {
//     //   connSubRemove();
//     //   writeSubRemove();
//     // };
//   }, []);

//   async function requestBluetoothPermissions() {
//   if (Platform.OS === 'android') {
//     if (Platform.Version >= 31) {
//       // Android 12+ (API 31+)
//       const result = await PermissionsAndroid.requestMultiple([
//         PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//       ]);

//       return (
//         result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
//         result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
//       );
//     } else {
//       // Android 11 and below (API 30-)
//       const result = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         {
//           title: 'Location Permission',
//           message: 'Bluetooth Low Energy requires Location permission to scan for devices.',
//           buttonNeutral: 'Ask Me Later',
//           buttonNegative: 'Cancel',
//           buttonPositive: 'OK',
//         }
//       );
//       return result === PermissionsAndroid.RESULTS.GRANTED;
//     }
//   }
//   return true; // iOS handles permissions differently
// }

//   // const requestBluetoothPermissions = async () => {
//   //   // ... (Your existing permission logic remains exactly the same) ...
//   //   if (Platform.OS === "android" && Platform.Version >= 31) {
//   //     const granted = await PermissionsAndroid.requestMultiple([
//   //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//   //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
//   //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//   //     ]);

//   //     return (
//   //       granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
//   //       granted["android.permission.BLUETOOTH_ADVERTISE"] === PermissionsAndroid.RESULTS.GRANTED
//   //     );
//   //   }
//   //   return true;
//   // };

//   const handleStartPeripheral = async () => {
//     // const hasPermission = await requestBluetoothPermissions();
//     // if (!hasPermission) {
//     //   Alert.alert("Permission Denied", "I need Bluetooth permissions to act as a key.");
//     //   return;
//     // }
//     // try {
//     //   await setServices([
//     //     {
//     //       uuid: "0000180D-0000-1000-8000-00805F9B34FB",
//     //       characteristics: [
//     //         {
//     //           uuid: "00002A37-0000-1000-8000-00805F9B34FB",
//     //           // 5. CRITICAL: Add "writeWithoutResponse" (or "write") so Go can send data
//     //           properties: ["read", "notify", "writeWithoutResponse", "write"],
//     //           // permissions: ["readable", "writeable"], // Ensure OS permissions allow it
//     //           value: "",

//     //         },
//     //       ],
//     //     },
//     //   ]);

//     //   await startAdvertising({
//     //     serviceUUIDs: ["0000180D-0000-1000-8000-00805F9B34FB"],
//     //     manufacturerData: "474F424B",
//     //   });

//     //   setIsAdvertising(true);
//     //   console.log("Broadcasting as:", DEVICE_NAME);
//     // } catch (error) {
//     //   console.error("Start Error:", error);
//     //   Alert.alert("Error", "Failed to start advertising");
//     // }
//   };

//   const handleStopPeripheral = async () => {
//     // await stopAdvertising();
//     // setIsAdvertising(false);
//     // setIsConnected(false);
//   };

//   return (
//     // ... (Your existing UI remains exactly the same) ...
//     <View style={styles.container}>
//       <Text style={styles.header}>BLE Security Key</Text>

//       <View style={[styles.statusBox, { backgroundColor: isConnected ? "#4CAF50" : "#FF9800" }]}>
//         <Text style={styles.statusText}>
//           {isConnected ? "CONNECTED TO GO BRIDGE" : isAdvertising ? "ADVERTISING..." : "IDLE"}
//         </Text>
//       </View>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={isAdvertising ? handleStopPeripheral : handleStartPeripheral}
//       >
//         <Text style={styles.buttonText}>
//           {isAdvertising ? "Stop Advertising" : "Start Advertising"}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//   },
//   header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
//   statusBox: { padding: 20, borderRadius: 10, marginBottom: 30 },
//   statusText: { color: "white", fontWeight: "bold" },
//   button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 5 },
//   buttonText: { color: "white", fontSize: 16 },
// });

// // import { Image } from 'expo-image';
// // import { Platform, StyleSheet } from 'react-native';

// // import { Collapsible } from '@/components/ui/collapsible';
// // import { ExternalLink } from '@/components/external-link';
// // import ParallaxScrollView from '@/components/parallax-scroll-view';
// // import { ThemedText } from '@/components/themed-text';
// // import { ThemedView } from '@/components/themed-view';
// // import { IconSymbol } from '@/components/ui/icon-symbol';
// // import { Fonts } from '@/constants/theme';

// // export default function TabTwoScreen() {
// //   return (
// //     <ParallaxScrollView
// //       headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
// //       headerImage={
// //         <IconSymbol
// //           size={310}
// //           color="#808080"
// //           name="chevron.left.forwardslash.chevron.right"
// //           style={styles.headerImage}
// //         />
// //       }>
// //       <ThemedView style={styles.titleContainer}>
// //         <ThemedText
// //           type="title"
// //           style={{
// //             fontFamily: Fonts.rounded,
// //           }}>
// //           Explore
// //         </ThemedText>
// //       </ThemedView>
// //       <ThemedText>This app includes example code to help you get started.</ThemedText>
// //       <Collapsible title="File-based routing">
// //         <ThemedText>
// //           This app has two screens:{' '}
// //           <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
// //           <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
// //         </ThemedText>
// //         <ThemedText>
// //           The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
// //           sets up the tab navigator.
// //         </ThemedText>
// //         <ExternalLink href="https://docs.expo.dev/router/introduction">
// //           <ThemedText type="link">Learn more</ThemedText>
// //         </ExternalLink>
// //       </Collapsible>
// //       <Collapsible title="Android, iOS, and web support">
// //         <ThemedText>
// //           You can open this project on Android, iOS, and the web. To open the web version, press{' '}
// //           <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
// //         </ThemedText>
// //       </Collapsible>
// //       <Collapsible title="Images">
// //         <ThemedText>
// //           For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
// //           <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
// //           different screen densities
// //         </ThemedText>
// //         <Image
// //           source={require('@/assets/images/react-logo.png')}
// //           style={{ width: 100, height: 100, alignSelf: 'center' }}
// //         />
// //         <ExternalLink href="https://reactnative.dev/docs/images">
// //           <ThemedText type="link">Learn more</ThemedText>
// //         </ExternalLink>
// //       </Collapsible>
// //       <Collapsible title="Light and dark mode components">
// //         <ThemedText>
// //           This template has light and dark mode support. The{' '}
// //           <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
// //           what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
// //         </ThemedText>
// //         <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
// //           <ThemedText type="link">Learn more</ThemedText>
// //         </ExternalLink>
// //       </Collapsible>
// //       <Collapsible title="Animations">
// //         <ThemedText>
// //           This template includes an example of an animated component. The{' '}
// //           <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
// //           the powerful{' '}
// //           <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
// //             react-native-reanimated
// //           </ThemedText>{' '}
// //           library to create a waving hand animation.
// //         </ThemedText>
// //         {Platform.select({
// //           ios: (
// //             <ThemedText>
// //               The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
// //               component provides a parallax effect for the header image.
// //             </ThemedText>
// //           ),
// //         })}
// //       </Collapsible>
// //     </ParallaxScrollView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   headerImage: {
// //     color: '#808080',
// //     bottom: -90,
// //     left: -35,
// //     position: 'absolute',
// //   },
// //   titleContainer: {
// //     flexDirection: 'row',
// //     gap: 8,
// //   },
// // });
