<template>
  <div v-if="message" :class="containerClass" :role="role">
    <p class="font-medium">
      <slot name="message">
        {{ message }}
      </slot>
    </p>
    <p v-if="description" class="mt-1 text-xs" :class="descriptionClass">
      <slot name="description">
        {{ description }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type FormStatusKind = 'success' | 'error' | 'info';

const props = defineProps<{
  kind: FormStatusKind;
  messageKey?: string;
  message?: string;
  descriptionKey?: string;
}>();

const { t } = useI18n();

const styleMap: Record<FormStatusKind, { border: string; background: string; text: string; description: string }> = {
  success: {
    border: 'border-emerald-400',
    background: 'bg-emerald-50',
    text: 'text-emerald-900',
    description: 'text-emerald-700',
  },
  error: {
    border: 'border-destructive/40',
    background: 'bg-destructive/10',
    text: 'text-destructive',
    description: 'text-destructive',
  },
  info: {
    border: 'border-primary/40',
    background: 'bg-primary/10',
    text: 'text-primary',
    description: 'text-primary/80',
  },
};

const message = computed(() => {
  if (props.messageKey) {
    return String(t(props.messageKey));
  }
  if (props.message) {
    return String(props.message);
  }
  return '';
});
const description = computed(() => (props.descriptionKey ? String(t(props.descriptionKey)) : ''));

const kind = computed<FormStatusKind>(() => props.kind);
const kindStyles = computed(() => styleMap[kind.value]);

const containerClass = computed(() => {
  const styles = kindStyles.value;
  return ['rounded-lg border px-4 py-3 text-sm', styles.border, styles.background, styles.text].join(' ');
});

const descriptionClass = computed(() => kindStyles.value.description);

const role = computed(() => (kind.value === 'error' ? 'alert' : 'status'));
</script>
