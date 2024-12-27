// Web3 Imports
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

// React Native Imports
import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

// Local Component Imports
import { LoginScreen } from "./src/components/LoginScreen";
import { LogViewer } from "./src/components/LogViewer";
import { WalletService } from "./src/services/WalletService";
import { Button } from "./src/components/Button";

// Local Utility Imports
import { decryptPayload, encryptPayload } from "./src/utils/crypto";
import { REDIRECT_LINKS, buildUrl } from "./src/utils/constants";
import { createTransferTransaction } from "./src/utils/transactions";
import { PhantomWalletService } from "./src/services/PhantomWalletService";
import { useDeepLink } from "./src/hooks/useDeepLink";


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<Keypair | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((log: string) => setLogs((logs) => [...logs, "> " + log]), []);
  const clearLog = useCallback(() => setLogs(() => []), []);

  const [phantomWallet] = useState(() => new PhantomWalletService());
  const deepLink = useDeepLink();

  // Handle deep link events
  useEffect(() => {
    if (!deepLink) return;

    const url = new URL(deepLink);
    const params = url.searchParams;

    if (params.get("errorCode")) {
      addLog(JSON.stringify(Object.fromEntries([...params]), null, 2));
      return;
    }

    if (/onConnect/.test(url.pathname || url.host)) {
      const sharedSecretDapp = nacl.box.before(
        bs58.decode(params.get("phantom_encryption_public_key")!),
        phantomWallet.getSecretKey()
      );

      const connectData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        sharedSecretDapp
      );

      phantomWallet.setConnectionData(
        sharedSecretDapp,
        connectData.session,
        new PublicKey(connectData.public_key)
      );

      addLog(JSON.stringify(connectData, null, 2));
    } else if (/onDisconnect/.test(url.pathname || url.host)) {
      phantomWallet.clearConnectionData();
      addLog("Disconnected!");
    } else if (/onSignAndSendTransaction/.test(url.pathname || url.host)) {
      const signAndSendTransactionData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        phantomWallet.getSharedSecret()
      );
      addLog(JSON.stringify(signAndSendTransactionData, null, 2));
    } else if (/onSignAllTransactions/.test(url.pathname || url.host)) {
      const signAllTransactionsData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        phantomWallet.getSharedSecret()
      );
      const decodedTransactions = signAllTransactionsData.transactions.map((t: string) =>
        Transaction.from(bs58.decode(t))
      );
      addLog(JSON.stringify(decodedTransactions, null, 2));
    } else if (/onSignTransaction/.test(url.pathname || url.host)) {
      const signTransactionData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        phantomWallet.getSharedSecret()
      );
      const decodedTransaction = Transaction.from(bs58.decode(signTransactionData.transaction));
      addLog(JSON.stringify(decodedTransaction, null, 2));
    } else if (/onSignMessage/.test(url.pathname || url.host)) {
      const signMessageData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        phantomWallet.getSharedSecret()
      );
      addLog(JSON.stringify(signMessageData, null, 2));
    }
  }, [deepLink, addLog, phantomWallet]);

  // Check for existing wallet
  useEffect(() => {
    checkExistingWallet();
  }, []);

  const checkExistingWallet = async () => {
    try {
      const savedWallet = await WalletService.loadWallet();
      if (savedWallet) {
        setWallet(savedWallet);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const newWallet = await WalletService.createWallet();
      setWallet(newWallet);
    } catch (error) {
      console.error('Failed to create wallet:', error);
      addLog(`Error creating wallet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignTransaction = async () => {
    try {
      if (!wallet) throw new Error("No wallet available");
      
      const transaction = await createTransferTransaction(
        wallet.publicKey,
        wallet.publicKey
      );
      const signedTx = await WalletService.signTransaction(transaction);
      addLog("Transaction signed successfully");
      // Here you would typically send the transaction
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  const handleSignMessage = async () => {
    try {
      if (!wallet) throw new Error("No wallet available");
      
      const message = new TextEncoder().encode("Hello, Solana!");
      const signature = await WalletService.signMessage(message);
      addLog(`Message signed: ${bs58.encode(signature)}`);
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  const handleExportPrivateKey = async () => {
    try {
      const privateKey = await WalletService.exportPrivateKey();
      addLog(`Private Key: ${privateKey}`);
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  const handleLogout = () => {
    setWallet(null);
    clearLog();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!wallet && !phantomWallet.getPublicKey()) {
    return (
      <LoginScreen
        onConnectPhantom={phantomWallet.connect}
        onCreateWallet={handleCreateWallet}
        isLoading={isLoading}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#333" }}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <LogViewer logs={logs} />
      </View>
      <View style={{ flex: 0, paddingTop: 20, paddingBottom: 40 }}>
        {wallet ? (
          <>
            <Button title="Sign Transaction" onPress={handleSignTransaction} />
            <Button title="Sign Message" onPress={handleSignMessage} />
            <Button title="Export Private Key" onPress={handleExportPrivateKey} />
          </>
        ) : (
          <>
            <Button title="Connect" onPress={phantomWallet.connect} />
            <Button title="Disconnect" onPress={phantomWallet.disconnect} />
            <Button title="Sign And Send Transaction" onPress={phantomWallet.signAndSendTransaction} />
            <Button title="Sign All Transactions" onPress={phantomWallet.signAllTransactions} />
            <Button title="Sign Transaction" onPress={phantomWallet.signTransaction} />
            <Button title="Sign Message" onPress={phantomWallet.signMessage} />
          </>
        )}
        <Button title="Logout" onPress={handleLogout} />
        <Button title="Clear Logs" onPress={clearLog} />

      </View>
    </View>
  );
}
