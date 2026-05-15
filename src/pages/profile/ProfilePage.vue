<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Profile</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="bg-slate-900">
      <div class="px-4 py-6 space-y-6">
        <!-- Profile hero -->
        <section class="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6">
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute -top-12 -right-8 w-48 h-48 bg-emerald-500/25 blur-3xl"></div>
            <div class="absolute -bottom-16 left-0 w-36 h-36 bg-blue-500/20 blur-2xl"></div>
          </div>
          <div class="relative flex flex-col items-center text-center">
            <AvatarCircle :src="user?.avatar_url" :name="user?.name" size="lg" />
            <p class="mt-4 text-xs font-medium tracking-wide text-emerald-400 uppercase">Account</p>
            <h2 class="mt-2 text-2xl font-bold text-white">{{ user?.name ?? 'Member' }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ user?.email ?? 'user@example.com' }}</p>
            <AppBadge :variant="roleBadgeVariant" size="sm" class="mt-3">{{ roleBadgeLabel }}</AppBadge>

            <div class="mt-6 grid grid-cols-2 gap-3 w-full">
              <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left">
                <p class="text-xs text-slate-400">Member since</p>
                <p class="mt-1 text-lg font-semibold text-white">{{ memberSince || '—' }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left">
                <p class="text-xs text-slate-400">Role</p>
                <p class="mt-1 text-lg font-semibold text-white">{{ roleBadgeLabel }}</p>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3 w-full">
              <AppButton full-width size="lg" @click="editProfile">
                <template #icon>
                  <UserIcon class="w-5 h-5" />
                </template>
                Edit Profile
              </AppButton>
              <AppButton full-width size="lg" variant="outline" @click="openNotifications">
                <template #icon>
                  <BellIcon class="w-5 h-5" />
                </template>
                Notifications
              </AppButton>
            </div>
          </div>
        </section>

        <!-- Menu -->
        <div class="space-y-4">
          <MenuSection title="Account">
            <MenuItem :icon="UserIcon" label="Edit Profile" :show-chevron="true" @click="editProfile" />
            <div class="flex justify-center px-1">
              <span class="block h-px w-[70%] bg-slate-800/80"></span>
            </div>
            <MenuItem :icon="BellIcon" label="Notification Settings" :show-chevron="true" @click="openNotifications" />
          </MenuSection>

          <MenuSection title="Danger Zone">
            <MenuItem :icon="LogOut" label="Log Out" :destructive="true" :show-chevron="false" @click="handleLogout" />
          </MenuSection>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { User as UserIcon, Bell as BellIcon, LogOut } from 'lucide-vue-next';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import AvatarCircle from '@/components/AvatarCircle.vue';
import AppBadge from '@/components/AppBadge.vue';
import AppButton from '@/components/AppButton.vue';
import MenuSection from '@/components/MenuSection.vue';
import MenuItem from '@/components/MenuItem.vue';

const router = useRouter();
const authStore = useAuthStore();
const user = authStore.user;

const memberSince = computed(() =>
  user ? dayjs(user.created_at).format('MMM YYYY') : '',
);

const roleBadgeVariant = computed(() => {
  const map = { super_admin: 'purple', head_coach: 'purple', coach: 'blue', member: 'slate' } as const;
  return map[user?.role ?? 'member'];
});

const roleBadgeLabel = computed(() => {
  const map = { super_admin: 'Admin', head_coach: 'Head Coach', coach: 'Coach', member: 'Member' } as const;
  return map[user?.role ?? 'member'];
});

function editProfile() {
  // Placeholder
}

function openNotifications() {
  router.push('/tabs/profile/notifications');
}

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}
</script>
