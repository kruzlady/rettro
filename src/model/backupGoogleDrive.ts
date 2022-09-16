import { captureException } from '@sentry/react-native';
import { endsWith } from 'lodash';
import {
  getSupportedBiometryType,
  Options,
  requestSharedWebCredentials,
} from 'react-native-keychain';
import {
  CLOUD_BACKUP_ERRORS,
  encryptAndSaveDataToCloud,
  getDataFromCloud,
} from '../handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import {
  allWalletsKey,
  pinKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '../utils/keychainConstants';
import * as keychain from './keychain';
import {
  AllRainbowWallets,
  allWalletsVersion,
  createWallet,
  RainbowWallet,
} from './wallet';
import AesEncryptor from '@/handlers/aesEncryption';
import {
  decryptPIN,
  authenticateWithPIN,
  saveNewAuthenticationPIN,
} from '@/handlers/authentication';
import logger from '@/utils/logger';

type BackupPassword = string;

interface BackedUpData {
  [key: string]: string;
}

interface BackupUserData {
  wallets: AllRainbowWallets;
}

const NOOP = () => {};
const encryptor = new AesEncryptor();

async function extractSecretsForWallet(wallet: RainbowWallet) {
  const allKeys = await keychain.loadAllKeys();
  if (!allKeys) throw new Error(CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR);
  const secrets = {} as { [key: string]: string };

  const allowedPkeysKeys = wallet?.addresses?.map(
    account => `${account.address}_${privateKeyKey}`
  );

  allKeys.forEach(item => {
    // Ignore allWalletsKey
    if (item.username === allWalletsKey) {
      return;
    }

    // Ignore selected wallet
    if (item.username === selectedWalletKey) {
      return;
    }

    // Ignore another wallets seeds
    if (
      item.username.indexOf(`_${seedPhraseKey}`) !== -1 &&
      item.username !== `${wallet.id}_${seedPhraseKey}`
    ) {
      return;
    }

    // Ignore other wallets PKeys
    if (
      item.username.indexOf(`_${privateKeyKey}`) !== -1 &&
      !(allowedPkeysKeys?.indexOf(item.username) > -1)
    ) {
      return;
    }

    secrets[item.username] = item.password;
  });
  return secrets;
}

export async function backupWalletToCloud({
  password,
  wallet,
  onBeforePINCreated = NOOP,
  onAfterPINCreated = NOOP,
}: {
  password: BackupPassword;
  wallet: RainbowWallet;
  onBeforePINCreated: () => void;
  onAfterPINCreated: () => void;
}) {
  const now = Date.now();

  const secrets = await extractSecretsForWallet(wallet);
  const hasBiometricsEnabled = await getSupportedBiometryType();
  if (!hasBiometricsEnabled) {
    let userPIN;
    let privateKey: string;

    await Promise.all(
      Object.keys(secrets).map(async key => {
        const value = secrets[key];

        if (key.endsWith(seedPhraseKey)) {
          const parsedValue = JSON.parse(value);
          const { seedphrase } = parsedValue;

          try {
            onBeforePINCreated();
            userPIN = await authenticateWithPIN();
            onAfterPINCreated();
          } catch (error) {
            return;
          }

          if (userPIN && seedphrase) {
            privateKey = await encryptor.decrypt(userPIN, seedphrase);
          }

          secrets[key] = JSON.stringify({
            ...parsedValue,
            seedphrase: privateKey,
          });
        }
      })
    );
  }

  const data = {
    createdAt: now,
    secrets,
  };
  return encryptAndSaveDataToCloud(data, password, `backup_${now}.json`);
}

export async function addWalletToCloudBackup(
  password: BackupPassword,
  wallet: RainbowWallet,
  filename: string | boolean
): Promise<null | boolean> {
  // @ts-ignore
  const backup = await getDataFromCloud(password, filename);

  const now = Date.now();

  const secrets = await extractSecretsForWallet(wallet);

  backup.updatedAt = now;
  // Merge existing secrets with the ones from this wallet
  backup.secrets = {
    ...backup.secrets,
    ...secrets,
  };
  return encryptAndSaveDataToCloud(backup, password, filename);
}

export function findLatestBackUp(
  wallets: AllRainbowWallets | null
): string | null {
  let latestBackup: string | null = null;
  let filename: string | null = null;

  if (wallets) {
    Object.values(wallets).forEach(wallet => {
      // Check if there's a wallet backed up
      if (
        wallet.backedUp &&
        wallet.backupDate &&
        wallet.backupFile &&
        wallet.backupType === WalletBackupTypes.cloud
      ) {
        // If there is one, let's grab the latest backup
        if (!latestBackup || wallet.backupDate > latestBackup) {
          filename = wallet.backupFile;
          latestBackup = wallet.backupDate;
        }
      }
    });
  }
  return filename;
}

export async function restoreCloudBackup({
  password,
  userData,
  backupSelected,
  onBeforePINCreated = NOOP,
  onAfterPINCreated = NOOP,
}: {
  password: BackupPassword;
  userData: BackupUserData | null;
  backupSelected: string | null;
  onBeforePINCreated?: () => void;
  onAfterPINCreated?: () => void;
}): Promise<boolean> {
  // We support two flows
  // Restoring from the welcome screen, which uses the userData to rebuild the wallet
  // Restoring a specific backup from settings => Backup, which uses only the keys stored.

  try {
    const filename =
      backupSelected || (userData && findLatestBackUp(userData?.wallets));
    if (!filename) {
      return false;
    }
    // 2- download that backup
    // @ts-ignore
    const data = await getDataFromCloud(password, filename);
    if (!data) {
      throw new Error('Invalid password');
    }
    const dataToRestore = {
      ...data.secrets,
    };

    if (userData) {
      // Restore only wallets that were backed up in cloud
      // or wallets that are read-only
      const walletsToRestore: AllRainbowWallets = {};
      Object.values(userData?.wallets ?? {}).forEach(wallet => {
        if (
          (wallet.backedUp &&
            wallet.backupDate &&
            wallet.backupFile &&
            wallet.backupType === WalletBackupTypes.cloud) ||
          wallet.type === WalletTypes.readOnly
        ) {
          walletsToRestore[wallet.id] = wallet;
        }
      });

      // All wallets
      dataToRestore[allWalletsKey] = {
        version: allWalletsVersion,
        wallets: walletsToRestore,
      };
      return restoreCurrentBackupIntoKeychain(
        dataToRestore,
        onBeforePINCreated,
        onAfterPINCreated
      );
    } else {
      return restoreSpecificBackupIntoKeychain(dataToRestore);
    }
  } catch (e) {
    logger.sentry('Error while restoring back up');
    captureException(e);
    return false;
  }
}

async function restoreSpecificBackupIntoKeychain(
  backedUpData: BackedUpData
): Promise<boolean> {
  try {
    // Re-import all the seeds (and / or pkeys) one by one
    for (const key of Object.keys(backedUpData)) {
      if (endsWith(key, seedPhraseKey)) {
        const valueStr = backedUpData[key];
        const { seedphrase } = JSON.parse(valueStr);
        let privateKey = seedphrase;
        const wasBackupSavedWithPIN =
          seedphrase?.includes('salt') && seedphrase?.includes('cipher');

        if (wasBackupSavedWithPIN) {
          const backupPIN = await decryptPIN(backedUpData[pinKey]);

          privateKey = await encryptor.decrypt(backupPIN, seedphrase);
        }

        await createWallet(privateKey, null, null, true);
      }
    }
    return true;
  } catch (e) {
    logger.sentry('error in restoreSpecificBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

async function restoreCurrentBackupIntoKeychain(
  backedUpData: BackedUpData,
  onBeforePINCreated = NOOP,
  onAfterPINCreated = NOOP
): Promise<boolean> {
  try {
    // Access control config per each type of key
    const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

    await Promise.all(
      Object.keys(backedUpData).map(async key => {
        const value = backedUpData[key];
        let accessControl: Options = keychain.publicAccessControlOptions;
        if (endsWith(key, seedPhraseKey) || endsWith(key, privateKeyKey)) {
          accessControl = privateAccessControlOptions;
        }

        const hasBiometricsEnabled = await getSupportedBiometryType();

        if (key.endsWith(seedPhraseKey)) {
          const parsedValue = JSON.parse(value);
          const { seedphrase } = parsedValue;

          const wasBackupSavedWithPIN =
            seedphrase?.includes('salt') && seedphrase?.includes('cipher');

          if (!wasBackupSavedWithPIN && !hasBiometricsEnabled) {
            // interrupt loader
            onBeforePINCreated();
            const userPIN = await saveNewAuthenticationPIN();
            onAfterPINCreated();

            const encryptedSeed = await encryptor.encrypt(userPIN, seedphrase);

            if (encryptedSeed) {
              // in the PIN flow, we must manually encrypt the seedphrase with PIN
              const valueWithPINInfo = JSON.stringify({
                ...parsedValue,
                seedphrase: encryptedSeed,
              });

              logger.sentry(
                'This wallet was backuped with faceId and now we replace it by seed with PIN '
              );
              return keychain.saveString(key, valueWithPINInfo, accessControl);
            }
          } else if (wasBackupSavedWithPIN) {
            // the seed phrase shouldn't be encrypted at this stage, if it's encrypted,
            // it means that it was created before the backup flow was fixed.
            // We need to decrypt it and allow the user to create a new PIN
            const encryptedPinKey = backedUpData[pinKey];
            const backupPIN = await decryptPIN(encryptedPinKey);

            const decryptedSeed = await encryptor.decrypt(
              backupPIN,
              seedphrase
            );

            let encryptedSeed;
            if (!hasBiometricsEnabled) {
              onBeforePINCreated();
              const userPIN = await saveNewAuthenticationPIN();
              onAfterPINCreated();

              encryptedSeed = await encryptor.encrypt(userPIN, decryptedSeed);
            }

            const valueWithPINInfo = JSON.stringify({
              ...parsedValue,
              seedphrase: hasBiometricsEnabled ? decryptedSeed : encryptedSeed,
            });

            logger.sentry(
              'This wallet was backuped with an encrypted PIN, and now we decrypt it and encrypt it with own PIN'
            );
            return keychain.saveString(key, valueWithPINInfo, accessControl);
          }
        } else if (typeof value === 'string') {
          return keychain.saveString(key, value, accessControl);
        } else {
          return keychain.saveObject(key, value, accessControl);
        }
      })
    );

    return true;
  } catch (e) {
    logger.sentry('error in restoreBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

// Attempts to save the password to decrypt the backup from the iCloud keychain
export async function saveBackupPassword(
  password: BackupPassword
): Promise<void> {}

// Attempts to fetch the password to decrypt the backup from the iCloud keychain
export async function fetchBackupPassword(): Promise<null | BackupPassword> {
  return null;
}