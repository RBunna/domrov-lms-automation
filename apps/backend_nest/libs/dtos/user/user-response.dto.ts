// user-response.dto.ts

export class UserResponseDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string | null;
    status: string;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }

    // Static method to map a raw user entity to the DTO
    static toDto(user: any): UserResponseDto {
        return new UserResponseDto({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePictureUrl: user.profilePictureUrl,
            status: user.status,
        });
    }
}