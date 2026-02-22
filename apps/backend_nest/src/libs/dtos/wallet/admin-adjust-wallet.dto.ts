import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { TransactionReason, TransactionType } from '../../entities/ai/wallet-transaction.entity';

export class AdminAdjustWalletDTO {
    @ApiProperty()
    @IsNumber()
    userId: number;

    @ApiProperty()
    @IsNumber()
    amount: number; // Positive to add, Negative to deduct

    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({ enum: TransactionReason })
    @IsEnum(TransactionReason)
    reason: TransactionReason;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;
}