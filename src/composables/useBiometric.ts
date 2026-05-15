import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const SERVER_ID = 'com.example.capacitorskeleton';

const isAvailable = ref(false);
const biometricEnabled = ref(false);
const biometryLabel = ref('Biometric');

let initialized = false;

export function useBiometric() {
  async function init() {
    if (initialized) return;
    initialized = true;

    if (Capacitor.getPlatform() === 'web') return;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      const result = await NativeBiometric.isAvailable();
      console.log('[Biometric] isAvailable:', result.isAvailable, 'type:', result.biometryType);
      isAvailable.value = result.isAvailable;

      if (result.biometryType === 1) biometryLabel.value = 'Touch ID';
      else if (result.biometryType === 2) biometryLabel.value = 'Face ID';
      else if (result.biometryType === 3) biometryLabel.value = 'Fingerprint';
      else if (result.biometryType === 4) biometryLabel.value = 'Face Authentication';
      else if (result.biometryType === 5) biometryLabel.value = 'Iris Authentication';
    } catch (err) {
      console.warn('[Biometric] init failed:', err);
      isAvailable.value = false;
    }

    const { value } = await Preferences.get({ key: 'biometric_enabled' });
    biometricEnabled.value = value === 'true';
  }

  function getBiometryLabel(): string {
    return biometryLabel.value;
  }

  // Check if we have stored credentials (replaces hasStoredCredentials ref)
  const hasStoredCredentials = biometricEnabled;

  async function storeCredentials(email: string, password: string): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web' || !isAvailable.value) return false;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.setCredentials({
        username: email,
        password,
        server: SERVER_ID,
      });
      biometricEnabled.value = true;
      await Preferences.set({ key: 'biometric_enabled', value: 'true' });
      return true;
    } catch {
      return false;
    }
  }

  async function getCredentials(): Promise<{ email: string; password: string } | null> {
    if (Capacitor.getPlatform() === 'web' || !biometricEnabled.value) return null;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({
        reason: 'Sign in',
        title: 'Biometric Login',
      });
      const credentials = await NativeBiometric.getCredentials({
        server: SERVER_ID,
      });
      return {
        email: credentials.username,
        password: credentials.password,
      };
    } catch {
      return null;
    }
  }

  async function removeCredentials(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.deleteCredentials({
        server: SERVER_ID,
      });
    } catch {
      // ignore
    }
    biometricEnabled.value = false;
    await Preferences.remove({ key: 'biometric_enabled' });
  }

  return {
    isAvailable,
    hasStoredCredentials,
    getBiometryLabel,
    init,
    storeCredentials,
    getCredentials,
    removeCredentials,
  };
}
