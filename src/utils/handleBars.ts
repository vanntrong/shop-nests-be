import { numberToVND } from './currency';

export const checkOrderHasSale = (value: number, actualValue: number, opts) => {
  if (value > actualValue) {
    debugger;
    return opts.fn(value, actualValue);
  }
  return opts.inverse(this);
};

export const getValueSale = (value: number, actualValue: number) => {
  return numberToVND(value - actualValue);
};
