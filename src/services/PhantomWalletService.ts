import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import * as Linking from "expo-linking";
import { encryptPayload } from "../utils/crypto";
import { REDIRECT_LINKS, buildUrl } from "../utils/constants";
import { createTransferTransaction } from "../utils/transactions";

export class PhantomWalletService {
  private dappKeyPair: nacl.BoxKeyPair;
  private sharedSecret?: Uint8Array;
  private session?: string;
  private phantomWalletPublicKey?: PublicKey;

  constructor() {
    this.dappKeyPair = nacl.box.keyPair();
  }

  public setConnectionData(sharedSecret: Uint8Array, session: string, publicKey: PublicKey) {
    this.sharedSecret = sharedSecret;
    this.session = session;
    this.phantomWalletPublicKey = publicKey;
  }

  public clearConnectionData() {
    this.sharedSecret = undefined;
    this.session = undefined;
    this.phantomWalletPublicKey = undefined;
  }

  public getDappPublicKey(): Uint8Array {
    return this.dappKeyPair.publicKey;
  }

  public getSecretKey(): Uint8Array {
    return this.dappKeyPair.secretKey;
  }

  public getSharedSecret(): Uint8Array | undefined {
    return this.sharedSecret;
  }

  public getPublicKey(): PublicKey | undefined {
    return this.phantomWalletPublicKey;
  }

  public async connect() {
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      cluster: "mainnet-beta",
      app_url: "https://phantom.app",
      redirect_link: REDIRECT_LINKS.onConnect
    });

    const url = buildUrl("connect", params);
    await Linking.openURL(url);
  }

  public async disconnect() {
    if (!this.session) return;

    const payload = { session: this.session };
    const [nonce, encryptedPayload] = encryptPayload(payload, this.sharedSecret);

    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      nonce: bs58.encode(nonce),
      redirect_link: REDIRECT_LINKS.onDisconnect,
      payload: bs58.encode(encryptedPayload)
    });

    const url = buildUrl("disconnect", params);
    await Linking.openURL(url);
  }

  public async signAndSendTransaction() {
    if (!this.phantomWalletPublicKey || !this.session) return;

    const transaction = await createTransferTransaction(this.phantomWalletPublicKey, this.phantomWalletPublicKey);
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });

    const payload = {
      session: this.session,
      transaction: bs58.encode(serializedTransaction)
    };
    const [nonce, encryptedPayload] = encryptPayload(payload, this.sharedSecret);

    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      nonce: bs58.encode(nonce),
      redirect_link: REDIRECT_LINKS.onSignAndSendTransaction,
      payload: bs58.encode(encryptedPayload)
    });

    const url = buildUrl("signAndSendTransaction", params);
    await Linking.openURL(url);
  }

  public async signAllTransactions() {
    if (!this.phantomWalletPublicKey || !this.session) return;

    const transactions = await Promise.all([
      createTransferTransaction(this.phantomWalletPublicKey, this.phantomWalletPublicKey),
      createTransferTransaction(this.phantomWalletPublicKey, this.phantomWalletPublicKey)
    ]);

    const serializedTransactions = transactions.map((t) =>
      bs58.encode(t.serialize({ requireAllSignatures: false }))
    );

    const payload = {
      session: this.session,
      transactions: serializedTransactions
    };

    const [nonce, encryptedPayload] = encryptPayload(payload, this.sharedSecret);

    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      nonce: bs58.encode(nonce),
      redirect_link: REDIRECT_LINKS.onSignAllTransactions,
      payload: bs58.encode(encryptedPayload)
    });

    const url = buildUrl("signAllTransactions", params);
    await Linking.openURL(url);
  }

  public async signTransaction() {
    if (!this.phantomWalletPublicKey || !this.session) return;

    const transaction = await createTransferTransaction(this.phantomWalletPublicKey, this.phantomWalletPublicKey);
    const serializedTransaction = bs58.encode(
      transaction.serialize({ requireAllSignatures: false })
    );

    const payload = {
      session: this.session,
      transaction: serializedTransaction
    };

    const [nonce, encryptedPayload] = encryptPayload(payload, this.sharedSecret);

    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      nonce: bs58.encode(nonce),
      redirect_link: REDIRECT_LINKS.onSignTransaction,
      payload: bs58.encode(encryptedPayload)
    });

    const url = buildUrl("signTransaction", params);
    await Linking.openURL(url);
  }

  public async signMessage() {
    if (!this.session) return;

    const message = "To avoid digital dognappers, sign below to authenticate with CryptoCorgis.";

    const payload = {
      session: this.session,
      message: bs58.encode(Buffer.from(message))
    };

    const [nonce, encryptedPayload] = encryptPayload(payload, this.sharedSecret);

    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(this.dappKeyPair.publicKey),
      nonce: bs58.encode(nonce),
      redirect_link: REDIRECT_LINKS.onSignMessage,
      payload: bs58.encode(encryptedPayload)
    });

    const url = buildUrl("signMessage", params);
    await Linking.openURL(url);
  }

  // Add other methods (signAndSendTransaction, signMessage, etc.)
} 