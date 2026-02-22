// credit-package.service.ts (updated to use float numbers instead of string)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPackage } from '../../libs/entities/ai/credit-package.entity';
import {
  CreateCreditPackageDto,
  UpdateCreditPackageDto,
} from '../../libs/dtos/wallet/wallet.dto';

@Injectable()
export class CreditPackageService {
  constructor(
    @InjectRepository(CreditPackage)
    private readonly packageRepository: Repository<CreditPackage>,
  ) { }

  async create(dto: CreateCreditPackageDto): Promise<CreditPackage> {
    const creditPackage = this.packageRepository.create({
      ...dto,
      currency: dto.currency,
      bonusCredits: dto.bonusCredits || 0,
      credits: dto.credits,
      price: dto.price,
    });
    return this.packageRepository.save(creditPackage);
  }

  async findAll(): Promise<CreditPackage[]> {
    return this.packageRepository.find({
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async findAllActive(): Promise<CreditPackage[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CreditPackage> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException(`Credit package with ID ${id} not found`);
    }
    return pkg;
  }

  async update(id: number, dto: UpdateCreditPackageDto): Promise<CreditPackage> {
    const pkg = await this.findOne(id);
    Object.assign(pkg, dto);
    return this.packageRepository.save(pkg);
  }

  async remove(id: number): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packageRepository.remove(pkg);
  }

  async toggleActive(id: number): Promise<CreditPackage> {
    const pkg = await this.findOne(id);
    pkg.isActive = !pkg.isActive;
    return this.packageRepository.save(pkg);
  }
}