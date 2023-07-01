import axiosInstance from '@/utils/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Axios } from 'axios';
import { CreateShipDto, GetFeeShipDto } from './ship.dto';
import { FeeShip, FeeShipResponse } from './ship.interface';
import { constants } from '@/configs/constants';
import { Result } from '@/types/common';

@Injectable()
export class ShipService {
  logger: Logger;
  axios: Axios;
  constructor() {
    this.logger = new Logger(ShipService.name);
    this.axios = axiosInstance;
  }

  /**
   * This is an asynchronous function that retrieves the shipping fee based on the provided parameters
   * and returns a promise with the result.
   * @param {GetFeeShipDto} param - `param` is an object of type `GetFeeShipDto` which contains
   * parameters for calculating the shipping fee. It is likely that it includes information such as the
   * weight and dimensions of the package, the destination address, and the shipping method.
   * @returns The `getFee` function returns a Promise that resolves to a `Result` object containing a
   * message and data. The data is the `fee` property of the `FeeShipResponse` object returned by the
   * `axios` GET request.
   */
  async getFee(param: GetFeeShipDto): Promise<Result<FeeShip>> {
    try {
      const feeShip: FeeShipResponse = await this.axios.get(
        '/services/shipment/fee',
        {
          params: {
            ...param,
            ...constants.PICK_ADDRESS,
          },
        },
      );

      this.logger.log(`Fee ship: ${feeShip}`);

      return {
        message: 'Get fee ship success',
        data: feeShip.fee,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async createOrder(body: CreateShipDto) {
    try {
      const response = await this.axios.post('/services/shipment/order', {
        ...body,
        weight_option: 'gram',
      });

      return response;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
