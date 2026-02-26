import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserAiService } from './user-ai.service';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';
import { CreateUserAIKeyDto } from '../../libs/dtos/user/create-user-ai-key.dto';
import { UpdateUserAIKeyDto } from '../../libs/dtos/user/update-user-ai-key.dto';
import { Encryption } from '../../libs/utils/Encryption';

describe('UserAiService', () => {
    let userAiService: UserAiService;
    let userAIRepoMock: jest.Mocked<Repository<UserAIKey>>;
    let encryptSpy: Encryption;
    let decryptSpy: Encryption;

    const mockExistingKey: UserAIKey = {
        id: 10,
        userId: 1,
        encryptedKey: 'old_encrypted_key_123',
        model: 'gpt-4',
        apiEndpoint: 'https://api.openai.com',
        label: 'Default Key',
        isActive: true,
        isValid: false,
    } as UserAIKey;

    const mockCreatedKey: UserAIKey = {
        id: 20,
        userId: 1,
        encryptedKey: 'encrypted_mock_key',
        model: 'gpt-4o',
        apiEndpoint: 'https://api.openai.com',
        label: 'New Key',
        isActive: true,
        isValid: false,
    } as UserAIKey;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAiService,
                {
                    provide: getRepositoryToken(UserAIKey),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        userAiService = module.get<UserAiService>(UserAiService);
        userAIRepoMock = module.get(getRepositoryToken(UserAIKey)) as jest.Mocked<Repository<UserAIKey>>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        encryptSpy = jest.spyOn(Encryption, 'encryptKey').mockReturnValue('encrypted_mock_key');
        decryptSpy = jest.spyOn(Encryption, 'decryptKey').mockReturnValue('plain_api_key_123');
    });

    describe('create', () => {
        it('USERAI_CREATE_VALID_FULL_001 - creates key with all DTO fields, encrypts API key, sets defaults', async () => {
            const dto: CreateUserAIKeyDto = {
                apiKey: 'sk-test-123456',
                model: 'gpt-4o',
                apiEndpoint: 'https://api.openai.com',
                label: 'Full Test Key',
                provider: 'openai',
            };
            userAIRepoMock.create.mockReturnValue(mockCreatedKey);
            userAIRepoMock.save.mockResolvedValue(mockCreatedKey);

            const result = await userAiService.create(1, dto);

            expect(result).toEqual(mockCreatedKey);
            expect(encryptSpy).toHaveBeenCalledWith('sk-test-123456');
            expect(userAIRepoMock.create).toHaveBeenCalledWith({
                userId: 1,
                encryptedKey: 'encrypted_mock_key',
                model: 'gpt-4o',
                apiEndpoint: 'https://api.openai.com',
                label: 'Full Test Key',
                provider: 'openai',
                isActive: true,
                isValid: false,
            });
            expect(userAIRepoMock.save).toHaveBeenCalledWith(mockCreatedKey);
        });

        it('USERAI_CREATE_VALID_MINIMAL_002 - creates key with only apiKey (rest fields undefined)', async () => {
            const dto: CreateUserAIKeyDto = { apiKey: 'sk-minimal', provider: 'openai' };
            const minimalCreated = { ...mockCreatedKey, model: undefined, apiEndpoint: undefined, label: undefined };
            userAIRepoMock.create.mockReturnValue(minimalCreated);
            userAIRepoMock.save.mockResolvedValue(minimalCreated);

            const result = await userAiService.create(1, dto);

            expect(result).toEqual(minimalCreated);
            expect(encryptSpy).toHaveBeenCalledWith('sk-minimal');
            expect(userAIRepoMock.create).toHaveBeenCalledWith({
                userId: 1,
                encryptedKey: 'encrypted_mock_key',
                provider: 'openai',
                isActive: true,
                isValid: false,
            });
        });

        it('USERAI_CREATE_MISSING_USERID_003 - throws NotFoundException when userId is falsy', async () => {
            await expect(userAiService.create(0, { apiKey: 'sk-xxx' } as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
            await expect(userAiService.create(undefined as any, { apiKey: 'sk-xxx' } as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
        });

        it('USERAI_CREATE_MISSING_DTO_004 - throws NotFoundException when dto is missing or not object', async () => {
            await expect(userAiService.create(1, null as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
            await expect(userAiService.create(1, 123 as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
        });

        it('USERAI_CREATE_MISSING_APIKEY_005 - throws NotFoundException when apiKey missing in dto', async () => {
            await expect(userAiService.create(1, {} as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
            await expect(userAiService.create(1, { model: 'gpt-4' } as any)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
        });

        it('USERAI_CREATE_REPO_ERROR_006 - throws NotFoundException on save failure', async () => {
            const dto: CreateUserAIKeyDto = { apiKey: 'sk-error', provider: 'openai' };
            userAIRepoMock.create.mockReturnValue({} as any);
            userAIRepoMock.save.mockRejectedValue(new Error('DB save failed'));

            await expect(userAiService.create(1, dto)).rejects.toThrow(
                new NotFoundException('Failed to create user AI key')
            );
        });
    });

    describe('findAll', () => {
        it('USERAI_FINDALL_VALID_001 - returns all keys for user', async () => {
            userAIRepoMock.find.mockResolvedValue([mockExistingKey]);

            const result = await userAiService.findAll(1);

            expect(result).toEqual([mockExistingKey]);
            expect(userAIRepoMock.find).toHaveBeenCalledWith({ where: { userId: 1 } });
        });

        it('USERAI_FINDALL_EMPTY_002 - returns empty array when no keys', async () => {
            userAIRepoMock.find.mockResolvedValue([]);

            const result = await userAiService.findAll(1);

            expect(result).toEqual([]);
        });

        it('USERAI_FINDALL_MISSING_USERID_003 - throws NotFoundException when userId is falsy', async () => {
            await expect(userAiService.findAll(0)).rejects.toThrow(
                new NotFoundException('Failed to get user AI keys')
            );
        });

        it('USERAI_FINDALL_ERROR_004 - throws NotFoundException on repository error', async () => {
            userAIRepoMock.find.mockRejectedValue(new Error('DB error'));

            await expect(userAiService.findAll(1)).rejects.toThrow(
                new NotFoundException('Failed to get user AI keys')
            );
        });
    });

    describe('findOne', () => {
        it('USERAI_FINDONE_VALID_001 - returns key when found', async () => {
            userAIRepoMock.findOne.mockResolvedValue(mockExistingKey);

            const result = await userAiService.findOne(1, 10);

            expect(result).toEqual(mockExistingKey);
            expect(userAIRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10, userId: 1 } });
        });

        it('USERAI_FINDONE_MISSING_PARAMS_002 - throws NotFoundException when userId or id is falsy', async () => {
            await expect(userAiService.findOne(0, 10)).rejects.toThrow(
                new NotFoundException('Failed to get user AI key')
            );
            await expect(userAiService.findOne(1, 0)).rejects.toThrow(
                new NotFoundException('Failed to get user AI key')
            );
        });

        it('USERAI_FINDONE_NOTFOUND_003 - throws NotFoundException when key does not exist', async () => {
            userAIRepoMock.findOne.mockResolvedValue(null);

            await expect(userAiService.findOne(1, 999)).rejects.toThrow(
                new NotFoundException('Failed to get user AI key')
            );
        });

        it('USERAI_FINDONE_ERROR_004 - throws NotFoundException on repository error', async () => {
            userAIRepoMock.findOne.mockRejectedValue(new Error('DB error'));

            await expect(userAiService.findOne(1, 10)).rejects.toThrow(
                new NotFoundException('Failed to get user AI key')
            );
        });
    });

    describe('update', () => {
        it('USERAI_UPDATE_VALID_NOAPIKEY_001 - updates fields without changing API key', async () => {
            userAIRepoMock.findOne.mockResolvedValue({ ...mockExistingKey });
            const updatedKey = { ...mockExistingKey, model: 'claude-3', isActive: false };
            userAIRepoMock.save.mockResolvedValue(updatedKey);

            const dto: UpdateUserAIKeyDto = { model: 'claude-3', isActive: false };
            const result = await userAiService.update(1, 10, dto);

            expect(result).toEqual(updatedKey);
            expect(encryptSpy).not.toHaveBeenCalled();
            expect(userAIRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10, userId: 1 } });
            expect(userAIRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({
                model: 'claude-3',
                isActive: false,
            }));
        });

        it('USERAI_UPDATE_VALID_WITHAPIKEY_002 - re-encrypts API key when provided and updates other fields', async () => {
            userAIRepoMock.findOne.mockResolvedValue({ ...mockExistingKey });
            const updatedKey = { ...mockExistingKey, encryptedKey: 'encrypted_mock_key', label: 'Updated Label' };
            userAIRepoMock.save.mockResolvedValue(updatedKey);

            const dto: UpdateUserAIKeyDto = { apiKey: 'new-sk-456789', label: 'Updated Label' };
            const result = await userAiService.update(1, 10, dto);

            expect(result).toEqual(updatedKey);
            expect(encryptSpy).toHaveBeenCalledWith('new-sk-456789');
            expect(userAIRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({
                encryptedKey: 'encrypted_mock_key',
                label: 'Updated Label',
            }));
        });

        it('USERAI_UPDATE_MISSING_PARAMS_003 - throws NotFoundException when userId or id missing', async () => {
            await expect(userAiService.update(0, 10, {} as any)).rejects.toThrow(
                new NotFoundException('Failed to update user AI key')
            );
            await expect(userAiService.update(1, 0, {} as any)).rejects.toThrow(
                new NotFoundException('Failed to update user AI key')
            );
        });

        it('USERAI_UPDATE_MISSING_DTO_004 - throws NotFoundException when dto is missing or not object', async () => {
            await expect(userAiService.update(1, 10, null as any)).rejects.toThrow(
                new NotFoundException('Failed to update user AI key')
            );
            await expect(userAiService.update(1, 10, 123 as any)).rejects.toThrow(
                new NotFoundException('Failed to update user AI key')
            );
        });

        it('USERAI_UPDATE_ERROR_005 - throws NotFoundException on findOne or save failure', async () => {
            userAIRepoMock.findOne.mockRejectedValue(new Error('find failed'));
            await expect(userAiService.update(1, 10, { label: 'x' } as any)).rejects.toThrow(
                new NotFoundException('Failed to update user AI key')
            );
        });
    });

    describe('remove', () => {
        it('USERAI_REMOVE_VALID_001 - removes existing key', async () => {
            userAIRepoMock.findOne.mockResolvedValue(mockExistingKey);
            userAIRepoMock.remove.mockResolvedValue(undefined as any);

            await userAiService.remove(1, 10);

            expect(userAIRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10, userId: 1 } });
            expect(userAIRepoMock.remove).toHaveBeenCalledWith(mockExistingKey);
        });

        it('USERAI_REMOVE_MISSING_PARAMS_002 - throws NotFoundException when userId or id missing', async () => {
            await expect(userAiService.remove(0, 10)).rejects.toThrow(
                new NotFoundException('Failed to remove user AI key')
            );
        });

        it('USERAI_REMOVE_ERROR_003 - throws NotFoundException on findOne or remove failure', async () => {
            userAIRepoMock.findOne.mockResolvedValue(null);
            await expect(userAiService.remove(1, 999)).rejects.toThrow(
                new NotFoundException('Failed to remove user AI key')
            );
        });
    });

    describe('getDecryptedKey', () => {
        it('USERAI_GETDECRYPTED_VALID_001 - returns decrypted key after finding it', async () => {
            userAIRepoMock.findOne.mockResolvedValue(mockExistingKey);

            const result = await userAiService.getDecryptedKey(1, 10);

            expect(result).toEqual('plain_api_key_123');
            expect(userAIRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10, userId: 1 } });
            expect(decryptSpy).toHaveBeenCalledWith('old_encrypted_key_123');
        });

        it('USERAI_GETDECRYPTED_MISSING_PARAMS_002 - throws NotFoundException when userId or id missing', async () => {
            await expect(userAiService.getDecryptedKey(0, 10)).rejects.toThrow(
                new NotFoundException('Failed to decrypt user AI key')
            );
        });

        it('USERAI_GETDECRYPTED_ERROR_003 - throws NotFoundException on findOne or decrypt failure', async () => {
            userAIRepoMock.findOne.mockResolvedValue(null);
            await expect(userAiService.getDecryptedKey(1, 999)).rejects.toThrow(
                new NotFoundException('Failed to decrypt user AI key')
            );
        });
    });
});