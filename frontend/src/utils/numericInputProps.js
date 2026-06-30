/** Shared inputProps for HTML number fields (default step=1 blocks decimals). */

export const decimalInputProps = (min = 0) => ({ min, step: 'any' });

export const moneyInputProps = (min = 0) => ({ min, step: '0.01' });

export const distanceInputProps = (min = 0) => ({ min, step: '0.01' });

export const integerInputProps = (min, max) => {
  const props = { step: 1 };
  if (min != null) props.min = min;
  if (max != null) props.max = max;
  return props;
};
