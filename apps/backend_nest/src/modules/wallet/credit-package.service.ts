// credit-package.service.ts (updated to use float numbers instead of string)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPackage } from '../../libs/entities/ai/credit-package.entity';
import {
  CreateCreditPackageDto,
  UpdateCreditPackageDto,
} from '../../libs/dtos/wallet/wallet.dto';
import { CreditPackageResponseDto } from '../../libs/dtos/wallet/credit-package-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';

@Injectable()
export class CreditPackageService {
  constructor(
    @InjectRepository(CreditPackage)
    private readonly packageRepository: Repository<CreditPackage>,
  ) { }

  async create(dto: CreateCreditPackageDto): Promise<CreditPackageResponseDto> {
    const creditPackage = this.packageRepository.create({
      ...dto,
      currency: dto.currency,
      bonusCredits: dto.bonusCredits || 0,
      credits: dto.credits,
      price: dto.price,
    });
    return this.packageRepository.save(creditPackage);
  }

  async findAll(): Promise<CreditPackageResponseDto[]> {
    return this.packageRepository.find({
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async findAllActive(): Promise<CreditPackageResponseDto[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  private async findOneEntity(id: number): Promise<CreditPackage> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException(`Credit package with ID ${id} not found`);
    }
    return pkg;
  }

  async findOne(id: number): Promise<CreditPackageResponseDto> {
    return this.findOneEntity(id);
  }

  async update(id: number, dto: UpdateCreditPackageDto): Promise<CreditPackageResponseDto> {
    const pkg = await this.findOneEntity(id);
    Object.assign(pkg, dto);
    return this.packageRepository.save(pkg);
  }

  async remove(id: number): Promise<MessageResponseDto> {
    const pkg = await this.findOneEntity(id);
    await this.packageRepository.remove(pkg);
    return { message: `Credit package with ID ${id} deleted successfully` };
  }

  async toggleActive(id: number): Promise<CreditPackageResponseDto> {
    const pkg = await this.findOneEntity(id);
    pkg.isActive = !pkg.isActive;
    return this.packageRepository.save(pkg);
  }
}