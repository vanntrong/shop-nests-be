import { District } from '@/entities/district/district.entity';
import { Province } from '@/entities/province/province.entity';
import { Ward } from '@/entities/ward/ward.entity';
import { Result } from '@/types/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs';
import { Repository } from 'typeorm';

@Injectable()
export class ProvinceService {
  logger: Logger;
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,

    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,

    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
  ) {
    this.logger = new Logger(ProvinceService.name);
  }

  async findAll(): Promise<Result<Province[]>> {
    try {
      const provinces = await this.provinceRepository.find({
        order: {
          name: 'ASC',
        },
      });

      return {
        message: 'Get all provinces successfully',
        data: provinces,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findDistrictsByProvinceCode(
    provinceCode: number,
  ): Promise<Result<District[]>> {
    try {
      const districts = await this.districtRepository.find({
        where: {
          province: {
            code: provinceCode,
          },
        },
        order: {
          name: 'ASC',
        },
      });

      return {
        message: 'Get all districts successfully',
        data: districts,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findWardsByDistrictCode(districtCode: number): Promise<Result<Ward[]>> {
    try {
      const wards = await this.wardRepository.find({
        where: {
          district: {
            code: districtCode,
          },
        },
        order: {
          name: 'ASC',
        },
      });

      return {
        message: 'Get all wards successfully',
        data: wards,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async seed() {
    try {
      new Promise(async (resolve, reject) => {
        readFile('provinceData.json', async (err, data) => {
          if (err) {
            reject(err);
          }

          const provinces = JSON.parse(data.toString());

          await Promise.all(
            provinces.map(async ({ districts, ...provinceData }) => {
              const province = await this.provinceRepository.save(provinceData);

              await Promise.all(
                districts.map(async ({ wards, ...districtData }) => {
                  const district = await this.districtRepository.save({
                    ...districtData,
                    province,
                  });

                  await Promise.all(
                    wards.map(async (wardData) => {
                      await this.wardRepository.save({
                        ...wardData,
                        district,
                      });
                    }),
                  );
                }),
              );
            }),
          );
        });
      });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
