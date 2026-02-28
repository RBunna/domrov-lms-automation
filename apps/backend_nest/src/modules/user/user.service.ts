import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { User } from '../../libs/entities/user/user.entity'
import { Encryption } from '../../libs/utils/Encryption'
import { UpdateUserDTO } from '../../libs/dtos/update.user.dto'
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UserProfileResponseDto,
  UpdateProfileResponseDto,
  ChangePasswordResponseDto,
  UserListItemDto,
} from '../../libs/dtos/user/user.dto'
import { UserStatus } from '../../libs/enums/Status'
import { OAuthProfile } from '../../libs/dtos/auth/oauth-profile.interface'
import { OAuthAccount } from '../../libs/entities/user/oauth-account.entity'
import { OAuthProvider } from '../../libs/entities/user/oauth-provider.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepository: Repository<OAuthAccount>,

    @InjectRepository(OAuthProvider)
    private readonly oauthProviderRepository: Repository<OAuthProvider>,
  ) { }

  // --- PROFILE METHODS ---
  async getMyProfile(userId: number): Promise<UserProfileResponseDto> {
    if (!userId) throw new BadRequestException('User ID is required')
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id', 'firstName', 'lastName', 'email', 'gender', 'dob',
        'phoneNumber', 'profilePictureUrl', 'isVerified', 'isTwoFactorEnable',
        'status', 'created_at', 'updated_at'
      ],
    })
    if (!user) throw new NotFoundException('User not found')
    return this.mapToUserProfileDto(user)
  }

  async create(userData: Partial<User>): Promise<User> {
    if (!userData || typeof userData !== 'object') throw new BadRequestException('Invalid user data')
    if (!userData.email) throw new BadRequestException('Email is required')
    if (!userData.password) throw new BadRequestException('Password is required')
    const existing = await this.userRepository.findOne({ where: { email: userData.email } })
    if (existing) throw new BadRequestException('Email already in use')
    userData.password = await Encryption.hashPassword(userData.password)
    return this.userRepository.save(this.userRepository.create(userData))
  }
  async updateMyProfile(userId: number, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    if (!userId) throw new BadRequestException('User ID is required')
    if (!dto || typeof dto !== 'object') throw new BadRequestException('Invalid update data')
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existing = await this.userRepository.findOne({ where: { phoneNumber: dto.phoneNumber } })
      if (existing && existing.id !== userId) throw new BadRequestException('Phone number already in use')
    }

    Object.assign(user, dto)
    await this.userRepository.save(user)
    const updated = await this.getMyProfile(userId)
    return { message: 'Profile updated successfully', user: updated }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    if (!userId) throw new BadRequestException('User ID is required')
    if (!dto || typeof dto !== 'object') throw new BadRequestException('Invalid password data')
    if (dto.newPassword !== dto.confirmPassword) throw new BadRequestException('New password and confirmation do not match')

    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const isCurrentValid = await Encryption.verifyPassword(user.password, dto.currentPassword)
    if (!isCurrentValid) throw new ForbiddenException('Current password is incorrect')

    const isSame = await Encryption.verifyPassword(user.password, dto.newPassword)
    if (isSame) throw new BadRequestException('New password must be different from current password')

    user.password = await Encryption.hashPassword(dto.newPassword)
    await this.userRepository.save(user)
    return { message: 'Password changed successfully' }
  }

  async getAllUsers(): Promise<UserListItemDto[]> {
    return this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl', 'status', 'isVerified'],
      order: { id: 'ASC' },
    })
  }

  async update(id: number, dto: UpdateUserDTO) {
    if (!id) throw new BadRequestException('User ID is required')
    if (!dto || typeof dto !== 'object') throw new BadRequestException('Invalid update data')
    if (dto.password) dto.password = await Encryption.hashPassword(dto.password)
    const result = await this.userRepository.update(id, dto)
    if (result.affected === 0) throw new NotFoundException('User not found')
    return { message: 'User updated successfully', affectedRows: result.affected }
  }

  async verifyUser(id: number) {
    if (!id) throw new BadRequestException('User ID is required')
    const result = await this.userRepository.update(id, { isVerified: true })
    if (result.affected === 0) throw new NotFoundException('User not found')
    return { message: 'User verified successfully', affectedRows: result.affected }
  }

  async findByQuery(query: Record<string, any>): Promise<User[]> {
    if (!query || typeof query !== 'object') throw new BadRequestException('Invalid query')
    const { id, email, firstName, lastName, phoneNumber } = query
    const where: any = {}
    if (id) where.id = id
    if (email) where.email = ILike(`%${email}%`)
    if (firstName) where.firstName = ILike(`%${firstName}%`)
    if (lastName) where.lastName = ILike(`%${lastName}%`)
    if (phoneNumber) where.phoneNumber = ILike(`%${phoneNumber}%`)
    return this.userRepository.find({ where, select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl'] })
  }

  // --- EMAIL & PROVIDER LOOKUPS ---
  async findByProvider(provider: string, providerId: string): Promise<User | null> {
    if (!provider || !providerId) return null
    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: { accountId: providerId, provider: { name: provider } },
      relations: ['user', 'provider'],
    })
    return oauthAccount?.user || null
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null
    return this.userRepository.findOne({ where: { email } })
  }

  // --- OAUTH METHODS ---
  async validateOAuthUser(profile: OAuthProfile): Promise<User> {
    if (!profile.provider || !profile.providerId) throw new BadRequestException('Invalid OAuth profile')

    let provider = await this.oauthProviderRepository.findOne({ where: { name: profile.provider } })
    if (!provider) {
      provider = await this.oauthProviderRepository.save(
        this.oauthProviderRepository.create({
          name: profile.provider,
          authUrl: '',
          clientId: '',
          clientSecret: '',
        })
      )
    }

    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: { accountId: profile.providerId, provider: { id: provider.id } },
      relations: ['user', 'provider'],
    })
    if (oauthAccount && oauthAccount.user) return oauthAccount.user

    let user: User = null
    if (profile.email) {
      user = await this.userRepository.findOne({ where: { email: profile.email } })
    }

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8)
      user = await this.userRepository.save(this.userRepository.create({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        profilePictureUrl: profile.avatar,
        status: UserStatus.ACTIVE,
        isVerified: true,
        password: await Encryption.hashPassword(randomPassword),
      }))
    }

    oauthAccount = this.oauthAccountRepository.create({ accountId: profile.providerId, user, provider })
    await this.oauthAccountRepository.save(oauthAccount)

    return user
  }

  async createOAuthUser(profile: OAuthProfile): Promise<User> {
    if (!profile.provider || !profile.providerId) throw new BadRequestException('Invalid OAuth profile')

    const provider = await this.oauthProviderRepository.findOne({ where: { name: profile.provider } })
    if (!provider) throw new NotFoundException(`OAuth provider ${profile.provider} not found`)

    const user = await this.userRepository.save(this.userRepository.create({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      profilePictureUrl: profile.avatar,
      status: UserStatus.ACTIVE,
      isVerified: true,
      password: Math.random().toString(36).slice(-8),
    }))

    const oauthAccount = this.oauthAccountRepository.create({ accountId: profile.providerId, user, provider })
    await this.oauthAccountRepository.save(oauthAccount)

    return user
  }

  // --- HELPER ---
  private mapToUserProfileDto(user: Partial<User>): UserProfileResponseDto {
    return Object.assign(new UserProfileResponseDto(), {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      email: user.email,
      gender: user.gender ?? undefined,
      dob: user.dob ? new Date(user.dob) : undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      profilePictureUrl: user.profilePictureUrl ?? undefined,
      isVerified: user.isVerified,
      isTwoFactorEnable: user.isTwoFactorEnable,
      status: user.status as UserStatus,
      created_at: user.created_at ? new Date(user.created_at) : undefined,
      updated_at: user.updated_at ? new Date(user.updated_at) : undefined,
    }) as UserProfileResponseDto
  }
}