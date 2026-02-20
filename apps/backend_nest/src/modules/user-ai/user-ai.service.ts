import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserAIKeyDto } from '../../../libs/dtos/user/create-user-ai-key.dto';
import { UpdateUserAIKeyDto } from '../../../libs/dtos/user/update-user-ai-key.dto';
import { UserAIKey } from '../../../libs/entities/ai/user-ai-key.entity';
import { Encryption } from '../../../libs/utils/Encryption';
@Injectable()
export class UserAiService {
    constructor(
        @InjectRepository(UserAIKey)
        private readonly userAIRepo: Repository<UserAIKey>,
    ) { }

    // Create / store a new key
    async create(userId: number, dto: CreateUserAIKeyDto): Promise<UserAIKey> {
        const { apiKey, ...rest } = dto;

        const encryptedKey = Encryption.encryptKey(apiKey);

        const key = this.userAIRepo.create({
            userId,
            encryptedKey,
            ...rest,
            isActive: true,
            isValid: false,
        });

        return this.userAIRepo.save(key);
    }

    // Get all keys for a user
    async findAll(userId: number): Promise<UserAIKey[]> {
        return this.userAIRepo.find({ where: { userId } });
    }

    // Get a single key
    async findOne(userId: number, id: number): Promise<UserAIKey> {
        const key = await this.userAIRepo.findOne({ where: { id, userId } });
        if (!key) throw new NotFoundException('User AI Key not found');
        return key;
    }

    // Update a key
    async update(userId: number, id: number, dto: UpdateUserAIKeyDto): Promise<UserAIKey> {
        const key = await this.findOne(userId, id);

        if (dto.apiKey) {
            key.encryptedKey = Encryption.encryptKey(dto.apiKey);
        }
        if (dto.model) key.model = dto.model;
        if (dto.apiEndpoint) key.apiEndpoint = dto.apiEndpoint;
        if (dto.label) key.label = dto.label;
        if (dto.isActive !== undefined) key.isActive = dto.isActive;
        if (dto.isValid !== undefined) key.isValid = dto.isValid;

        return this.userAIRepo.save(key);
    }

    // Delete a key
    async remove(userId: number, id: number): Promise<void> {
        const key = await this.findOne(userId, id);
        await this.userAIRepo.remove(key);
    }

    // Decrypt key for usage
    async getDecryptedKey(userId: number, id: number): Promise<string> {
        const key = await this.findOne(userId, id);
        return Encryption.decryptKey(key.encryptedKey);
    }
}