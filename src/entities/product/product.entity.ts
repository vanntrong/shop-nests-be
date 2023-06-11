import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../category/category.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @Column({
    unique: true,
    name: 'name',
  })
  name: string;

  @Index({
    fulltext: true,
  })
  @Column({
    unique: true,
    name: 'slug',
  })
  slug: string;

  @Column({
    name: 'thumbnail_url',
  })
  thumbnailUrl: string;

  @Column({
    name: 'price',
    type: 'float',
  })
  price: number;

  @Column({
    name: 'description',
  })
  description: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column({
    name: 'sale_price',
    nullable: true,
  })
  salePrice: number;

  @Column({
    array: true,
    type: 'text',
  })
  images: string[];

  @Column({
    type: 'timestamp',
    name: 'sale_end_at',
    nullable: true,
  })
  saleEndAt: Date;

  @Column({
    name: 'detail_description',
  })
  detailDescription: string;

  @Column({
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

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
