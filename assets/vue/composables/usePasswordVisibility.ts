import { computed, ref } from 'vue';

export const usePasswordVisibility = (initial = false) => {
  const visible = ref(initial);

  const inputType = computed(() => (visible.value ? 'text' : 'password'));

  const toggle = () => {
    visible.value = !visible.value;
  };

  return {
    visible,
    inputType,
    toggle,
  };
};
