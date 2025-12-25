import { computed, type ComputedRef } from 'vue';

interface UseFormFieldClassesOptions {
  disabled?: ComputedRef<boolean>;
}

export const useFormFieldClasses = (options: UseFormFieldClassesOptions = {}) => {
  const inputBaseClass = 'form__input peer';
  const inputErrorClass = 'is__invalid-input';
  const labelBaseClass = 'form__label';
  const labelErrorClass = 'peer-focus:text-destructive!';
  const validationErrorClass = 'is__invalid-error';

  const disabledInputClass = computed(() =>
    options.disabled?.value ? 'cursor-not-allowed opacity-70' : '',
  );

  const inputClass = (invalid: boolean) =>
    [inputBaseClass, invalid ? inputErrorClass : ''].filter(Boolean).join(' ');

  const labelClass = (invalid: boolean) =>
    [labelBaseClass, invalid ? labelErrorClass : ''].filter(Boolean).join(' ');

  return {
    inputClass,
    labelClass,
    validationErrorClass,
    disabledInputClass,
  };
};
