import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('IN')
  phone: string;
}
export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  us_name: string;
  @IsString()
  us_phone_no: string;
  @IsString()
  us_address: string;
}
export class UpdateOrgDto {
  @IsString()
  @IsNotEmpty()
  org_name: string;
  @IsString()
  org_address: string;
  @IsString()
  org_details: string;
  @IsString()
  org_phone_no: string;
}

export class SendVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
  @IsString()
  @Length(6)
  @IsNotEmpty()
  code: string;
}
