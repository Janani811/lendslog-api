import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class AddLend {
  @IsNotEmpty({ message: 'Minimum 3 characters' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  ld_borrower_name: string;

  @IsString()
  @IsPhoneNumber('IN', { message: 'Invalid phone number' })
  ld_borrower_phoneno: string;

  @IsNotEmpty({ message: 'Minimum 3 characters' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  ld_borrower_address: string;

  @IsString()
  ld_borrower_notes: string;

  @IsBoolean()
  ld_is_nominee: boolean;

  @ValidateIf((o) => o.ld_is_nominee)
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Nominee name cannot be empty' })
  ld_nominee_name: string;

  @ValidateIf((o) => o.ld_is_nominee)
  @IsPhoneNumber('IN', { message: 'Invalid phone number' })
  ld_nominee_phoneno: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  ld_nominee_address: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  ld_nominee_notes: string;

  @IsBoolean()
  ld_is_surety: boolean;

  @ValidateIf((o) => o.ld_is_surety)
  @IsNotEmpty({ message: 'Surety type cannot be empty' })
  ld_surety_type: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  ld_surety_notes: string;

  @IsNumberString({}, { message: 'Please enter valid amount' })
  ld_lend_amount: string;

  @IsNumberString({}, { message: 'Choose interest rate' })
  ld_interest_rate: string;

  @IsString()
  @IsNotEmpty({ message: 'Choose payment mode' })
  ld_payment_mode: string;

  @IsNumberString({}, { message: 'Weeks or month must be a number' })
  ld_total_weeks_or_month: string;

  @IsOptional()
  ld_start_date: string;
}
