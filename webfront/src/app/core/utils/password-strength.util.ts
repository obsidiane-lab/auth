export const PASSWORD_STRENGTH = {
  VERY_WEAK: 0,
  WEAK: 1,
  MEDIUM: 2,
  STRONG: 3,
  VERY_STRONG: 4,
} as const;

export interface PasswordPolicyConfig {
  minScore: number;
}

const DEFAULT_MIN_SCORE = PASSWORD_STRENGTH.MEDIUM;
const BYTE_RANGE = 256;
const textEncoder = new TextEncoder();

const clampScore = (score: number, min: number, max: number) => Math.min(Math.max(Math.trunc(score), min), max);

const encodeUtf8 = (value: string): Uint8Array => textEncoder.encode(value);

export const estimatePasswordEntropy = (value: string): number => {
  const bytes = encodeUtf8(value ?? '');
  const length = bytes.length;

  if (!length) {
    return 0;
  }

  const counts = new Array<number>(BYTE_RANGE).fill(0);
  let uniqueChars = 0;

  for (let index = 0; index < length; index += 1) {
    const byte = bytes[index] ?? 0;

    if (counts[byte] === 0) {
      uniqueChars += 1;
    }

    counts[byte] += 1;
  }

  let control = 0;
  let digit = 0;
  let upper = 0;
  let lower = 0;
  let symbol = 0;
  let other = 0;

  for (let chr = 0; chr < BYTE_RANGE; chr += 1) {
    if (counts[chr] === 0) {
      continue;
    }

    if (chr < 32 || chr === 127) {
      control = 33;
    } else if (chr >= 48 && chr <= 57) {
      digit = 10;
    } else if (chr >= 65 && chr <= 90) {
      upper = 26;
    } else if (chr >= 97 && chr <= 122) {
      lower = 26;
    } else if (chr >= 128) {
      other = 128;
    } else {
      symbol = 33;
    }
  }

  const pool = lower + upper + digit + symbol + control + other;

  if (!pool || !uniqueChars) {
    return 0;
  }

  return uniqueChars * Math.log2(pool) + (length - uniqueChars) * Math.log2(uniqueChars);
};

export const sanitizePasswordPolicy = (policy?: PasswordPolicyConfig | null): PasswordPolicyConfig => ({
  minScore: clampScore(
    policy?.minScore ?? DEFAULT_MIN_SCORE,
    PASSWORD_STRENGTH.WEAK,
    PASSWORD_STRENGTH.VERY_STRONG,
  ),
});

export const estimatePasswordStrength = (value: string): number => {
  const entropy = estimatePasswordEntropy(value);

  if (entropy >= 120) {
    return PASSWORD_STRENGTH.VERY_STRONG;
  }

  if (entropy >= 100) {
    return PASSWORD_STRENGTH.STRONG;
  }

  if (entropy >= 80) {
    return PASSWORD_STRENGTH.MEDIUM;
  }

  if (entropy >= 60) {
    return PASSWORD_STRENGTH.WEAK;
  }

  return PASSWORD_STRENGTH.VERY_WEAK;
};

export const meetsPasswordPolicy = (value: string, policy?: PasswordPolicyConfig | null): boolean => {
  const { minScore } = sanitizePasswordPolicy(policy);
  return estimatePasswordStrength(value ?? '') >= minScore;
};
