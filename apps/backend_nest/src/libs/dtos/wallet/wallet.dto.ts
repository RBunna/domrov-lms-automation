import {
    IsNumber,
    IsEnum,
    IsOptional,
    IsString,
    Min,
    IsBoolean,
    IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionReason } from '../../entities/ai/wallet-transaction.entity';
import { Currency } from '../../enums/Payment';

export class AddCreditsDto {
    @ApiProperty({ description: 'Amount of credits to add', minimum: 0.01 })
    @IsNumber()
    @Min(0.01)
    amount: number; // matches entity type (float)

    @ApiProperty({
        enum: TransactionReason,
        description: 'Reason for adding credits',
    })
    @IsEnum(TransactionReason)
    reason: TransactionReason;

    @ApiPropertyOptional({ description: 'Optional description' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class DeductCreditsDto {
    @ApiProperty({ description: 'Amount of credits to deduct', minimum: 0.01 })
    @IsNumber()
    @Min(0.01)
    amount: number; // matches entity type (float)

    @ApiProperty({
        enum: TransactionReason,
        description: 'Reason for deduction',
    })
    @IsEnum(TransactionReason)
    reason: TransactionReason;

    @ApiPropertyOptional({ description: 'Optional description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class WalletBalanceResponseDto {
    @ApiProperty()
    userId: number;

    @ApiProperty({ description: 'Current credit balance' })
    creditBalance: number; // matches entity type (float)
}

export class TransactionHistoryQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    limit?: number = 10;
}

export class CreateCreditPackageDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Number of credits in package' })
    @IsNumber()
    credits: number; // float

    @ApiProperty({ description: 'Price of the package' })
    @IsNumber()
    price: number; // float

    @ApiPropertyOptional({ default: Currency.USD })
    @IsOptional()
    @IsString()
    currency?: Currency;

    @ApiPropertyOptional({ description: 'Bonus credits included' })
    @IsOptional()
    @IsNumber()
    bonusCredits?: number; // float

    @ApiPropertyOptional({ description: 'Display order' })
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'Active status', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateCreditPackageDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    credits?: number; // float

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    price?: number; // float

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    bonusCredits?: number; // float

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}