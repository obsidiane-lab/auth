<template>
  <button
    ref="buttonRef"
    :type="type"
    :disabled="disabled"
    :class="[buttonClasses, pressed ? 'scale-95' : '']"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @keydown.space.prevent="handleSpaceDown"
    @keyup.space.prevent="handleSpaceUp"
    @keyup.enter.prevent="handleEnterUp"
    @blur="handleBlur"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: ButtonType;
    full?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'submit',
    full: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: 'click', nativeEvent: MouseEvent | PointerEvent | KeyboardEvent): void;
}>();

const BASE_CLASSES =
  'inline-flex items-center justify-center font-semibold transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
  secondary: 'bg-muted text-muted-foreground hover:bg-muted/90 focus-visible:ring-muted',
  danger: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'rounded-md px-3 py-1.5 text-xs',
  md: 'rounded-lg px-4 py-2 text-sm',
  lg: 'rounded-lg px-6 py-2.5 text-base',
};

const buttonRef = ref<HTMLButtonElement | null>(null);
const pressed = ref(false);
const activePointerId = ref<number | null>(null);
const keyboardActive = ref(false);

const buttonClasses = computed(() => {
  const variant = (props.variant ?? 'primary') as ButtonVariant;
  const size = (props.size ?? 'md') as ButtonSize;

  return [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], props.full ? 'w-full' : '']
    .filter(Boolean)
    .join(' ');
});

const isWithinBounds = (event: PointerEvent): boolean => {
  const element = buttonRef.value;

  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
};

const resetPointerState = () => {
  pressed.value = false;
  activePointerId.value = null;
};

const handlePointerDown = (event: PointerEvent) => {
  if (props.disabled || (event.pointerType === 'mouse' && event.button !== 0)) {
    return;
  }

  buttonRef.value?.setPointerCapture(event.pointerId);
  activePointerId.value = event.pointerId;
  pressed.value = true;
};

const handlePointerMove = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  pressed.value = isWithinBounds(event);
};

const handlePointerUp = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  const shouldEmit = isWithinBounds(event);
  buttonRef.value?.releasePointerCapture(event.pointerId);
  resetPointerState();

  if (shouldEmit && !props.disabled) {
  emit('click', event);
  }
};

const handlePointerCancel = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  buttonRef.value?.releasePointerCapture(event.pointerId);
  resetPointerState();
};

const handleSpaceDown = (event: KeyboardEvent | Event) => {
  const keyboardEvent = event as KeyboardEvent;
  if (props.disabled) {
    return;
  }

  keyboardEvent.preventDefault();
  keyboardActive.value = true;
  pressed.value = true;
};

const handleSpaceUp = (event: KeyboardEvent | Event) => {
  const keyboardEvent = event as KeyboardEvent;
  if (props.disabled || !keyboardActive.value) {
    return;
  }

  keyboardEvent.preventDefault();
  keyboardActive.value = false;
  pressed.value = false;
  emit('click', keyboardEvent);
};

const handleEnterUp = (event: KeyboardEvent | Event) => {
  const keyboardEvent = event as KeyboardEvent;
  if (props.disabled) {
    return;
  }

  keyboardEvent.preventDefault();
  emit('click', keyboardEvent);
};

const handleBlur = () => {
  keyboardActive.value = false;
  pressed.value = false;
};
</script>
