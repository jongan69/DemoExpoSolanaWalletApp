import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

interface LoginScreenProps {
  onConnectPhantom: () => Promise<void>;
  onCreateWallet: () => void;
  isLoading?: boolean;
}

export const LoginScreen = ({ onConnectPhantom, onCreateWallet, isLoading }: LoginScreenProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Solana Wallet</Text>
        <Text style={styles.subtitle}>Choose how you'd like to get started</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Connect Phantom Wallet" 
            onPress={onConnectPhantom}
            disabled={isLoading}
          />
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>
          <Button 
            title="Create New Wallet" 
            onPress={onCreateWallet}
            disabled={isLoading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#666',
  },
  orText: {
    color: '#666',
    marginHorizontal: 10,
  },
}); 