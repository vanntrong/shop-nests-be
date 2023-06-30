export const numberToCurrency = (
  number: number,
  currencyValue: 'thousand' | 'million' | 'billion',
) => {
  let mul = 1;

  switch (currencyValue) {
    case 'thousand':
      mul = 1000;
      break;
    case 'million':
      mul = 1000000;
      break;
    case 'billion':
      mul = 1000000000;
      break;
    default:
      break;
  }

  return number * mul;
};

export const numberToVND = (number: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(number);
};
