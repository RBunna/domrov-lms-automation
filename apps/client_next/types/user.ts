export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  phone_number: string;
  email: string;
  profile_picture_url: string;
  is_verified: boolean;
  is_two_factor_enable: boolean;
  dob: Date;
}
