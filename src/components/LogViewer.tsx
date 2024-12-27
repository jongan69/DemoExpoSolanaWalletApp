import React, { useRef } from "react";
import { ScrollView, Text, Platform, Pressable, ToastAndroid, Alert } from "react-native";
import * as Clipboard from 'expo-clipboard';

interface LogViewerProps {
  logs: string[];
}

export const LogViewer = ({ logs }: LogViewerProps) => {
  const scrollViewRef = useRef<any>(null);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied to clipboard');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        backgroundColor: "#111",
        padding: 20,
        paddingTop: 100,
        flexGrow: 1
      }}
      ref={scrollViewRef}
      onContentSizeChange={() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }}
      style={{ flex: 1 }}
    >
      {logs.map((log, i) => (
        <Pressable
          key={`t-${i}`}
          onPress={() => copyToClipboard(log)}
        >
          <Text
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              color: "#fff",
              fontSize: 14
            }}
          >
            {log}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}; 