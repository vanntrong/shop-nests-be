import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @Column({
    name: 'is_active',
    default: true,
    type: 'boolean',
  })
  isActive: boolean;

  @Column({
    unique: true,
    name: 'name',
  })
  name: string;

  @Column({
    name: 'description',
  })
  description: string;

  @Index({
    fulltext: true,
  })
  @Column({
    unique: true,
    name: 'slug',
  })
  slug: string;

  @ManyToOne(() => Category, (category) => category.subCategories, {
    nullable: true,
  })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  subCategories: Category[];

  @OneToMany(() => Category, (category) => category.products)
  products: Product[];

  @Column({
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    name: 'level',
    nullable: true,
    default: 1,
  })
  level: number;

  @ManyToOne(() => User, (user) => user.categoriesCreated)
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_category_created_by',
  })
  createdBy: User;

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
