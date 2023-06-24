import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { District } from '../district/district.entity';

@Entity()
export class Ward {
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

  @ManyToOne(() => District, (district) => district.wards)
  district: District;
}
