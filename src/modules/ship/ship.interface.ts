export interface FeeShip {
  name: string;
  fee: number;
  insurance_fee: number;
  delivery: boolean;
  extFees?: ExtFee[];
}

export interface ExtFee {
  display: string;
  title: string;
  amount: number;
  type: string;
}

export interface FeeShipResponse {
  success: boolean;
  message: string;
  fee: FeeShip;
}
