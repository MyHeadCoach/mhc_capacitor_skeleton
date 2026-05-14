<template>
  <IonPage>
    <IonContent class="bg-slate-900">
      <div class="min-h-full flex flex-col items-center justify-center p-6 bg-slate-900">
        <!-- Logo -->
        <div class="mb-8 text-center">
          <div class="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">Sign In</h1>
          <p class="text-slate-400 mt-1">Sign in to continue</p>
        </div>

        <!-- Biometric Enrollment Prompt -->
        <div v-if="showBiometricEnroll" class="w-full max-w-sm bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <div class="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Fingerprint class="w-7 h-7 text-emerald-400" />
          </div>
          <h2 class="text-lg font-semibold text-white mb-2">Enable {{ biometric.getBiometryLabel() }}?</h2>
          <p class="text-sm text-slate-400 mb-6">
            Sign in faster next time using {{ biometric.getBiometryLabel() }}.
          </p>
          <div class="space-y-3">
            <AppButton full-width size="lg" @click="enableBiometric">
              <template #icon>
                <Fingerprint class="w-5 h-5" />
              </template>
              Enable {{ biometric.getBiometryLabel() }}
            </AppButton>
            <AppButton variant="ghost" full-width @click="skipBiometric">
              Not now
            </AppButton>
          </div>
        </div>

        <!-- Login Form -->
        <div v-else class="w-full max-w-sm bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="w-full bg-slate-800 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 text-base"
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  class="w-full bg-slate-800 border border-slate-600 rounded-xl py-2.5 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 text-base"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div v-if="authStore.error" class="bg-red-500/10 border border-red-500/50 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-red-300">{{ authStore.error }}</p>
            </div>

            <AppButton
              type="submit"
              :disabled="!email || !password"
              :loading="authStore.isLoading"
              full-width
              size="lg"
            >
              <template #icon>
                <LogIn class="w-5 h-5" />
              </template>
              {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
            </AppButton>

            <!-- Biometric Login Button -->
            <div v-if="biometric.hasStoredCredentials.value" class="pt-2">
              <div class="relative flex items-center justify-center my-1">
                <div class="border-t border-slate-700 w-full"></div>
                <span class="bg-slate-800/50 px-3 text-xs text-slate-500 absolute">or</span>
              </div>
              <AppButton
                type="button"
                variant="outline"
                full-width
                size="lg"
                @click="handleBiometricLogin"
              >
                <template #icon>
                  <Fingerprint class="w-5 h-5" />
                </template>
                Sign in with {{ biometric.getBiometryLabel() }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { TrendingUp, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Fingerprint } from 'lucide-vue-next';
import AppButton from '@/components/AppButton.vue';
import { useAuthStore } from '@/stores/auth';
import { useBiometric } from '@/composables/useBiometric';

const router = useRouter();
const authStore = useAuthStore();
const biometric = useBiometric();

const showBiometricEnroll = ref(false);

const email = ref('');
const password = ref('');
const showPassword = ref(false);

onMounted(() => {
  biometric.init();
});

async function handleSubmit() {
  authStore.clearError();

  const success = await authStore.login({
    email: email.value,
    password: password.value,
  });

  if (success && !authStore.requiresTwoFactor) {
    // Offer biometric enrollment if available and not already stored
    if (biometric.isAvailable.value && !biometric.hasStoredCredentials.value) {
      showBiometricEnroll.value = true;
      return;
    }
    router.replace('/tabs/trades');
  }
}

async function handleBiometricLogin() {
  authStore.clearError();
  const credentials = await biometric.getCredentials();
  if (!credentials) return;

  const success = await authStore.login({
    email: credentials.email,
    password: credentials.password,
  });

  if (success && !authStore.requiresTwoFactor) {
    router.replace('/tabs/trades');
  }
}

async function enableBiometric() {
  await biometric.storeCredentials(email.value, password.value);
  showBiometricEnroll.value = false;
  router.replace('/tabs/trades');
}

function skipBiometric() {
  showBiometricEnroll.value = false;
  router.replace('/tabs/trades');
}
</script>

<style scoped>
ion-content {
  --background: rgb(15 23 42);
}
</style>
