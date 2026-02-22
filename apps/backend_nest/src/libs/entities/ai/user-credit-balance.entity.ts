// user-credit-balance.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../user/user.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity({ name: 'user_credit_balances' })
export class UserCreditBalance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', default: 0 })
  creditBalance: number;

  @OneToOne(() => User, (user) => user.creditBalance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions: WalletTransaction[];
}