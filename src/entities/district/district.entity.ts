import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Province } from '../province/province.entity';
import { Ward } from '../ward/ward.entity';

@Entity()
export class District {
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
  short_codename: string;

  @ManyToOne(() => Province, (province) => province.districts)
  province: Province;

  @OneToMany(() => Ward, (ward) => ward.district)
  wards: Ward[];
}
