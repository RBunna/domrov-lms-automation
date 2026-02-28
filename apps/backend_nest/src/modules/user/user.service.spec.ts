// import { Test, TestingModule } from '@nestjs/testing';
// import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// import { Repository, ILike, UpdateResult } from 'typeorm';
// import { User } from '../../libs/entities/user/user.entity';
// import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
// import { Encryption } from '../../libs/utils/Encryption';

// import {
//     UpdateProfileDto,
//     ChangePasswordDto,
//     UserProfileResponseDto,
//     UserListItemDto,
// } from '../../libs/dtos/user/user.dto';
// import { UpdateUserDTO } from '../../libs/dtos/update.user.dto';
// import { UserService } from './user.service';
// import { UserStatus } from '../../libs/enums/Status';
// import { getRepositoryToken } from '@nestjs/typeorm';



// describe('UserService', () => {
//     let userService: UserService;
//     let userRepositoryMock: jest.Mocked<Repository<User>>;
//     // Encryption methods will be mocked

//     const mockFullUser: User = {
//         id: 1,
//         firstName: 'John',
//         lastName: 'Doe',
//         email: 'john@example.com',
//         gender: 'male',
//         dob: new Date('1990-01-01'),
//         phoneNumber: '1234567890',
//         profilePictureUrl: 'https://example.com/pic.jpg',
//         isVerified: true,
//         isTwoFactorEnable: false,
//         status: UserStatus.ACTIVE,
//         created_at: new Date('2024-01-01'),
//         updated_at: new Date('2024-01-01'),
//         password: '$2b$10$hashedpassword',
//         aiKeys: [],
//         classes: [],
//         enrollments: [],
//         leadTeams: [],
//         teamMemberships: [],
//         oauthAccounts: [],
//         telegramChats: [],
//         usageLogs: [],
//         creditBalance: undefined,
//         payments: [],
//         submissions: [],
//         refreshTokens: [],
//         emailOtps: undefined,
//     };

//     const mockProfile: UserProfileResponseDto = {
//         id: 1,
//         firstName: 'John',
//         lastName: 'Doe',
//         email: 'john@example.com',
//         gender: 'male',
//         dob: new Date('1990-01-01'),
//         phoneNumber: '1234567890',
//         profilePictureUrl: 'https://example.com/pic.jpg',
//         isVerified: true,
//         isTwoFactorEnable: false,
//         status: UserStatus.ACTIVE,
//         created_at: new Date('2024-01-01'),
//         updated_at: new Date('2024-01-01'),
//     };

//     beforeAll(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 UserService,
//                 {
//                     provide: getRepositoryToken(User),
//                     useValue: {
//                         findOne: jest.fn(),
//                         find: jest.fn(),
//                         save: jest.fn(),
//                         update: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         userService = module.get<UserService>(UserService);
//         userRepositoryMock = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
//     });

//     beforeEach(() => {
//         jest.clearAllMocks();
//     });


//     const mockUserList: User[] = [
//         mockFullUser,
//     ];

//     beforeAll(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 UserService,
//                 {
//                     provide: getRepositoryToken(User),
//                     useValue: {
//                         findOne: jest.fn(),
//                         find: jest.fn(),
//                         save: jest.fn(),
//                         update: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         userService = module.get<UserService>(UserService);
//         userRepositoryMock = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
//     });

//     describe('getMyProfile', () => {
//         it('USER_GETMYPROFILE_VALID_001 - returns DTO only', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(mockFullUser);

//             const result = await userService.getMyProfile(1);

//             expect(result).toEqual(mockProfile);
//             expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
//                 where: { id: 1 },
//                 select: [
//                     'id', 'firstName', 'lastName', 'email', 'gender', 'dob',
//                     'phoneNumber', 'profilePictureUrl', 'isVerified', 'isTwoFactorEnable',
//                     'status', 'created_at', 'updated_at'
//                 ],
//             });
//         });

//         it('USER_GETMYPROFILE_MISSING_ID_002 - throws BadRequestException', async () => {
//             await expect(userService.getMyProfile(0)).rejects.toThrow(
//                 new BadRequestException('User ID is required')
//             );
//         });

//         it('USER_GETMYPROFILE_NOTFOUND_003 - throws NotFoundException', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(null);
//             await expect(userService.getMyProfile(1)).rejects.toThrow(
//                 new NotFoundException('User not found')
//             );
//         });

//         it('USER_GETMYPROFILE_UNEXPECTED_004 - throws BadRequestException on DB error', async () => {
//             userRepositoryMock.findOne.mockRejectedValue(new Error('DB error'));
//             await expect(userService.getMyProfile(1)).rejects.toThrow(BadRequestException);
//         });
//     });


//     describe('updateMyProfile', () => {
//         const userId = 1;
//         const updateDto: UpdateProfileDto = {
//             firstName: 'UpdatedJohn',
//             phoneNumber: '0987654321',
//         };

//         const updateDtoNoPhoneChange: UpdateProfileDto = {
//             firstName: 'UpdatedJohn',
//         };

//         it('USER_UPDATEMYPROFILE_VALID_001 - updates profile successfully', async () => {
//             userRepositoryMock.findOne
//                 .mockResolvedValueOnce(mockFullUser) // main user lookup
//                 .mockResolvedValueOnce(null); // phone check no conflict
//             userRepositoryMock.save.mockResolvedValue(undefined);
//             userRepositoryMock.findOne.mockResolvedValueOnce({
//                 ...mockFullUser,
//                 firstName: 'UpdatedJohn',
//                 phoneNumber: '0987654321',
//             });

//             const result = await userService.updateMyProfile(userId, updateDto);

//             expect(userRepositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({
//                 firstName: 'UpdatedJohn',
//                 phoneNumber: '0987654321',
//             }));
//             expect(result).toEqual({
//                 message: 'Profile updated successfully',
//                 user: expect.objectContaining({
//                     firstName: 'UpdatedJohn',
//                     phoneNumber: '0987654321',
//                 }),
//             });
//         });

//         it('USER_UPDATEMYPROFILE_VALID_NOPHONE_002 - updates without phone change', async () => {
//             userRepositoryMock.findOne.mockResolvedValueOnce(mockFullUser);
//             userRepositoryMock.save.mockResolvedValue(undefined);
//             userRepositoryMock.findOne.mockResolvedValueOnce({
//                 ...mockFullUser,
//                 firstName: 'UpdatedJohn',
//             });

//             const result = await userService.updateMyProfile(userId, updateDtoNoPhoneChange);

//             expect(result.user.firstName).toBe('UpdatedJohn');
//         });

//         it('USER_UPDATEMYPROFILE_MISSING_ID_003 - throws for missing userId', async () => {
//             await expect(userService.updateMyProfile(0, updateDto))
//                 .rejects.toThrow(new BadRequestException('User ID is required'));
//         });

//         it('USER_UPDATEMYPROFILE_INVALID_DTO_004 - throws for invalid DTO', async () => {
//             await expect(userService.updateMyProfile(userId, null as any))
//                 .rejects.toThrow(new BadRequestException('Invalid update data'));
//             await expect(userService.updateMyProfile(userId, 'string' as any))
//                 .rejects.toThrow(new BadRequestException('Invalid update data'));
//         });

//         it('USER_UPDATEMYPROFILE_NOTFOUND_005 - throws if user not found', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(null);

//             await expect(userService.updateMyProfile(userId, updateDto))
//                 .rejects.toThrow(new NotFoundException('User not found'));
//         });

//         // it('USER_UPDATEMYPROFILE_PHONECONFLICT_006 - throws if phone in use', async () => {
//         //     const updateDtoConflict = { phoneNumber: '0987654321', firstName: 'UpdatedJohn' };

//         //     userRepositoryMock.findOne.mockImplementation(({ where }) => {
//         //         const w = where as any;
//         //         if (w?.id === userId) return Promise.resolve(mockFullUser);
//         //         if (w?.phoneNumber === updateDtoConflict.phoneNumber) {
//         //             return Promise.resolve({ ...mockFullUser, id: 2 });
//         //         }
//         //         return Promise.resolve(null);
//         //     });

//         //     await expect(userService.updateMyProfile(userId, updateDtoConflict))
//         //         .rejects
//         //         .toThrow('Phone number already in use');

//         //     expect(userRepositoryMock.save).not.toHaveBeenCalled();
//         // });
//         //         curl -X 'PATCH' \
//         //   'http://localhost:3000/users/me' \
//         //   -H 'accept: application/json' \
//         //   -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoic29waGVhLmhlbmcwQGV4YW1wbGUuY29tIiwiaWF0IjoxNzcyMDg0NDY1LCJleHAiOjE3NzIxNTY0NjV9.Zkgq09Dele-UsIHJiDwl1AMYHnKs35y0qti20Zm6nSI' \
//         //   -H 'Content-Type: application/json' \
//         //   -d '{
//         //   "phoneNumber": "0123456101"
//         // }'
//         //         Response body
//         // Download
//         // {
//         //   "message": "Phone number already in use",
//         //   "error": "Bad Request",
//         //   "statusCode": 400
//         // }


//         it('USER_UPDATEMYPROFILE_UNEXPECTED_007 - throws BadRequest on DB error', async () => {
//             userRepositoryMock.findOne.mockRejectedValue(new Error('DB error'));

//             await expect(userService.updateMyProfile(userId, updateDto))
//                 .rejects.toThrow(BadRequestException);
//         });
//     });
//     describe('changePassword', () => {
//         const changeDto: ChangePasswordDto = {
//             currentPassword: 'OldPass123!',
//             newPassword: 'NewPass123!',
//             confirmPassword: 'NewPass123!',
//         };

//         it('USER_CHANGEPASSWORD_VALID_001 - changes password successfully', async () => {
//             const oldHash = await Encryption.hashPassword('OldPass123!');
//             userRepositoryMock.findOne.mockResolvedValue({ ...mockFullUser, password: oldHash });
//             userRepositoryMock.save.mockResolvedValue(undefined);

//             const result = await userService.changePassword(1, changeDto);

//             expect(result).toEqual({ message: 'Password changed successfully' });

//             const savedUser = userRepositoryMock.save.mock.calls[0][0];
//             const isNewValid = await Encryption.verifyPassword(savedUser.password, 'NewPass123!');
//             expect(isNewValid).toBe(true);
//         });

//         it('USER_CHANGEPASSWORD_MISMATCH_CONFIRM_002 - new != confirm', async () => {
//             await expect(userService.changePassword(1, { ...changeDto, confirmPassword: 'wrong' }))
//                 .rejects.toThrow('New password and confirmation do not match');
//         });

//         it('USER_CHANGEPASSWORD_MISSING_ID_003 - missing userId', async () => {
//             await expect(userService.changePassword(0, changeDto))
//                 .rejects.toThrow('User ID is required');
//         });

//         it('USER_CHANGEPASSWORD_NOTFOUND_005 - user not found', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(null);
//             await expect(userService.changePassword(1, changeDto)).rejects.toThrow(NotFoundException);
//         });

//         it('USER_CHANGEPASSWORD_WRONG_CURRENT_006 - wrong current password', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(mockFullUser);
//             jest.spyOn(Encryption, 'verifyPassword').mockResolvedValueOnce(false);
//             await expect(userService.changePassword(1, changeDto)).rejects.toThrow(
//                 new ForbiddenException('Current password is incorrect')
//             );
//         });

//         it('USER_CHANGEPASSWORD_SAME_AS_CURRENT_007 - new same as current', async () => {
//             userRepositoryMock.findOne.mockResolvedValue(mockFullUser);
//             jest.spyOn(Encryption, 'verifyPassword')
//                 .mockResolvedValueOnce(true) // current ok
//                 .mockResolvedValueOnce(true); // same as current

//             await expect(userService.changePassword(1, changeDto)).rejects.toThrow(
//                 'New password must be different from current password'
//             );
//         });
//     });


//     describe('getAllUsers', () => {
//         it('USER_GETALLUSERS_VALID_001 - returns all users', async () => {
//             userRepositoryMock.find.mockResolvedValue([mockFullUser]);
//             const result = await userService.getAllUsers();
//             expect(result).toEqual([mockFullUser]);
//         });

//         it('USER_GETALLUSERS_ERROR_002 - throws on failure', async () => {
//             userRepositoryMock.find.mockRejectedValue(new Error('DB error'));
//             await expect(userService.getAllUsers()).rejects.toThrow(BadRequestException);
//         });

//         it('USER_GETALLUSERS_ERROR_002 - should throw BadRequestException on failure', async () => {
//             userRepositoryMock.find.mockRejectedValue(new Error('DB error'));

//             await expect(userService.getAllUsers()).rejects.toThrow(BadRequestException);
//         });
//     });

//     describe('update (legacy)', () => {
//         const userIdStr = '1';
//         const updateUserDto: UpdateUserDTO = {
//             firstName: 'Updated',
//             lastName: 'Doe',
//             gender: 'male',
//             dob: new Date('1990-01-01'),
//             phoneNumber: '1234567890',
//             password: 'password',
//             profilePictureUrl: 'https://example.com/pic.jpg',
//         };

//         const updateUserDtoWithPass: UpdateUserDTO = {
//             firstName: 'Updated',
//             lastName: 'Doe',
//             gender: 'male',
//             dob: new Date('1990-01-01'),
//             phoneNumber: '1234567890',
//             password: 'plainpassword',
//             profilePictureUrl: 'https://example.com/pic.jpg',
//         };

//         it('USER_LEGACY_UPDATE_VALID_001 - should update user successfully', async () => {
//             userRepositoryMock.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] } as UpdateResult);

//             const result = await userService.update(userIdStr, updateUserDto);

//             expect(userRepositoryMock.update).toHaveBeenCalledWith(userIdStr, updateUserDto);
//             expect(result).toEqual({
//                 message: 'User updated successfully',
//                 affectedRows: 1,
//             });
//         });

//         it('USER_LEGACY_UPDATE_WITH_PASSWORD_002 - should hash password if provided', async () => {
//             jest.spyOn(Encryption, 'hashPassword').mockResolvedValue('hashedplainpassword');
//             userRepositoryMock.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] } as UpdateResult);

//             await userService.update(userIdStr, updateUserDtoWithPass);

//             expect(Encryption.hashPassword).toHaveBeenCalledWith('plainpassword');
//             expect(userRepositoryMock.update).toHaveBeenCalledWith(
//                 userIdStr,
//                 expect.objectContaining({ password: 'hashedplainpassword' })
//             );
//         });

//         it('USER_LEGACY_UPDATE_NOTFOUND_003 - should throw NotFound if no rows affected', async () => {
//             userRepositoryMock.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] } as UpdateResult);

//             await expect(userService.update(userIdStr, updateUserDto)).rejects.toThrow(NotFoundException);
//         });

//         it('USER_LEGACY_UPDATE_MISSING_ID_004 - should throw BadRequest for missing id', async () => {
//             await expect(userService.update('', updateUserDto)).rejects.toThrow(
//                 new BadRequestException('User ID is required')
//             );
//         });

//         it('USER_LEGACY_UPDATE_INVALID_DTO_005 - should throw BadRequest for invalid DTO', async () => {
//             await expect(userService.update(userIdStr, null as any)).rejects.toThrow(
//                 new BadRequestException('Invalid update data')
//             );
//         });
//     });

//     describe('findByQuery', () => {
//         it('USER_FINDBYQUERY_VALID_EMAIL_001 - should search users by email with ILike', async () => {
//             const query = { email: 'john' };
//             userRepositoryMock.find.mockResolvedValue(mockUserList);

//             const result = await userService.findByQuery(query);

//             expect(userRepositoryMock.find).toHaveBeenCalledWith({
//                 where: { email: ILike('%john%') },
//                 select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl'],
//             });
//             expect(result).toEqual(mockUserList);
//         });

//         it('USER_FINDBYQUERY_VALID_MULTIPLE_002 - should handle multiple query fields', async () => {
//             const query = { firstName: 'John', lastName: 'Doe' };
//             userRepositoryMock.find.mockResolvedValue(mockUserList);

//             const result = await userService.findByQuery(query);

//             expect(userRepositoryMock.find).toHaveBeenCalledWith({
//                 where: {
//                     firstName: ILike('%John%'),
//                     lastName: ILike('%Doe%'),
//                 },
//                 select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl'],
//             });
//             expect(result).toEqual(mockUserList);
//         });

//         it('USER_FINDBYQUERY_VALID_ID_003 - should use exact match for id', async () => {
//             const query = { id: 1 };
//             userRepositoryMock.find.mockResolvedValue(mockUserList);

//             await userService.findByQuery(query);

//             expect(userRepositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({
//                 where: { id: 1 },
//             }));
//         });

//         it('USER_FINDBYQUERY_INVALID_004 - should throw BadRequest for invalid query', async () => {
//             await expect(userService.findByQuery(null as any)).rejects.toThrow('Failed to search users');
//             await expect(userService.findByQuery('string' as any)).rejects.toThrow('Failed to search users');
//         });

//         it('USER_FINDBYQUERY_EMPTY_005 - should handle empty query object', async () => {
//             const query = {};
//             userRepositoryMock.find.mockResolvedValue([]);

//             const result = await userService.findByQuery(query);

//             expect(userRepositoryMock.find).toHaveBeenCalledWith({
//                 where: {},
//                 select: expect.any(Array),
//             });
//             expect(result).toEqual([]);
//         });
//     });
// });