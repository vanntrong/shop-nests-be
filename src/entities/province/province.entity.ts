import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { District } from '../district/district.entity';

@Entity()
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  @Index({ unique: true })
  code: number;

  @Column()
  codename: string;

  @Column()
  division_type: string;

  @Column()
  phone_code: number;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];
}
