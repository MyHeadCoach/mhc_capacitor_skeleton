<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :style="buttonStyle"
    class="app-button"
    :class="{ 'w-full': fullWidth }"
  >
    <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
    <slot v-else name="icon" />
    <span v-if="!iconOnly"><slot /></span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
});

const variantStyles: Record<ButtonVariant, Record<string, string>> = {
  primary: {
    backgroundColor: 'rgb(6 78 59)',
    borderColor: 'rgb(5 150 105)',
    color: 'rgb(110 231 183)',
  },
  secondary: {
    backgroundColor: 'rgb(30 41 59)',
    borderColor: 'rgb(71 85 105)',
    color: 'rgb(203 213 225)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: 'rgb(148 163 184)',
  },
  danger: {
    backgroundColor: 'rgb(127 29 29)',
    borderColor: 'rgb(220 38 38)',
    color: 'rgb(252 165 165)',
  },
  success: {
    backgroundColor: 'rgb(6 78 59)',
    borderColor: 'rgb(5 150 105)',
    color: 'rgb(110 231 183)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'rgb(100 116 139)',
    color: 'rgb(203 213 225)',
  },
};

const sizeStyles: Record<ButtonSize, Record<string, string>> = {
  sm: { padding: '8px 16px', fontSize: '14px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '16px' },
};

const iconOnlySizes: Record<ButtonSize, Record<string, string>> = {
  sm: { width: '32px', height: '32px', padding: '0' },
  md: { width: '40px', height: '40px', padding: '0' },
  lg: { width: '48px', height: '48px', padding: '0' },
};

const buttonStyle = computed(() => ({
  ...variantStyles[props.variant],
  ...(props.iconOnly ? iconOnlySizes[props.size] : sizeStyles[props.size]),
  borderWidth: props.variant === 'ghost' ? '0' : '2px',
  borderStyle: 'solid',
  borderRadius: '12px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.15s ease',
  cursor: props.disabled || props.loading ? 'not-allowed' : 'pointer',
  opacity: props.disabled || props.loading ? '0.5' : '1',
}));
</script>

<style scoped>
.app-button:hover:not(:disabled) {
  filter: brightness(1.1);
}
.app-button:active:not(:disabled) {
  transform: scale(0.98);
}
</style>
