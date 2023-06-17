import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @Column({
    name: 'name',
    nullable: true,
  })
  name: string;

  @Column({
    unique: true,
  })
  @Index({
    fulltext: true,
    unique: true,
  })
  email: string;

  @Column({
    enum: ['google', 'facebook', 'local'],
    default: 'local',
  })
  provider: string;

  // field password nullable if provider is google or facebook
  @Column({
    name: 'password',
    nullable: true,
  })
  password: string;

  @Column({
    nullable: true,
  })
  phone: string;

  @Column({
    nullable: true,
  })
  avatar: string;

  @Column({
    default: 0,
  })
  point: number;

  @Column({
    default: false,
    name: 'is_verified',
  })
  isVerified: boolean;

  @Column({
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

  @Column('text', {
    array: true,
    default: '{user}',
  })
  roles: string[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    nullable: true,
  })
  updatedAt: Date;

  @Column({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;
}
