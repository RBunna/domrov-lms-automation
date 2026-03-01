import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Currency } from '../../enums/Payment';

export class VerifyTransactionByHashDto {
  @ApiProperty({ example: '6f802c25', description: 'Transaction hash (8 characters)' })
  @IsString()
  transactionHash: string;

  @ApiProperty({ example: 121, description: 'Transaction amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: Currency.USD, default: Currency.USD, description: 'Currency of the transaction' })
  currency: Currency;

  @ApiProperty({ example: '6f802c25', description: 'Transaction hash (8 characters)' })
  @IsNumber()
  userId: number;
}

export class TransactionVerificationResponseDto {
  @ApiProperty({ example: 'Success', description: 'Verification status' })
  status: string;

  @ApiProperty({ example: 'aclbkhppxxx@aclb', description: 'Sender account ID' })
  senderAccountId: string;

  @ApiProperty({ example: 'vathanak_phy@aclb', description: 'Recipient account ID' })
  recipientAccountId: string;

  @ApiProperty({ example: 121, description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Currency' })
  currency: string;

  @ApiProperty({ example: '6f802c25 | KHQR', description: 'Transaction description' })
  description: string;

  @ApiProperty({ example: '2026-03-01T15:31:38 Asia/Phnom_Penh', description: 'Transaction date' })
  transactionDate: string;

  @ApiProperty({ example: 'Completed', description: 'Tracking status' })
  trackingStatus: string;
}

export class MarkTransactionPaidDto {
  @ApiProperty({ example: 'Verified via payment backend - Hash: 6f802c25', description: 'Verification note' })
  @IsString()
  @IsOptional()
  verificationNote?: string;
}

export class MarkTransactionRejectedDto {
  @ApiProperty({ example: 'Amount mismatch', description: 'Rejection reason' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 'User sent $100 instead of required $121', description: 'Verification note' })
  @IsString()
  @IsOptional()
  verificationNote?: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 9814 })
  id: number;

  @ApiProperty({ example: 'Charlie Davis' })
  user: string;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({ example: 9.99 })
  amount: number;

  @ApiProperty({ example: Currency.USD, default: Currency.USD })
  currency: Currency;

  @ApiProperty({ example: 'bank_transfer' })
  method: string;

  @ApiProperty({ example: 'unpaid' })
  status: string;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  date: string;

  @ApiProperty({ example: 'Amount mismatch - sent wrong amount', nullable: true })
  userNote?: string;

  @ApiProperty({ example: 'https://example.com/proof.jpg', nullable: true })
  proofImageUrl?: string;

  @ApiProperty({ example: null, nullable: true })
  verificationNote?: string;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class TransactionDetailDto {
  @ApiProperty({ example: 9814 })
  id: number;

  @ApiProperty({ example: 'Charlie Davis' })
  user: string;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({ example: 9.99 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'bank_transfer' })
  method: string;

  @ApiProperty({ example: 'unpaid' })
  status: string;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  date: string;

  @ApiProperty({
    type: 'object',
    properties: {
      hash: { type: 'string' },
      fromAccountId: { type: 'string' },
      toAccountId: { type: 'string' },
      currency: { type: 'string' },
      amount: { type: 'number' },
      description: { type: 'string' },
      trackingStatus: { type: 'string' },
      createdDate: { type: 'string' },
    },
  })
  transactionDetails: any;
}
