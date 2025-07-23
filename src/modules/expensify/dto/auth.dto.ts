import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class ExpensifySignUpDto {
  email?: string;
  id?: string;
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsNotEmpty()
  phone?: string;
  delete?: boolean;
}

export class TransactionDto {
  @IsString()
  @IsNotEmpty()
  exp_ts_title!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number string' })
  exp_ts_amount!: string;

  @IsNumber()
  exp_tc_id!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  exp_ts_date!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
    message: 'Time must be in HH:MM AM/PM format',
  })
  exp_ts_time!: string;

  @IsNumber()
  exp_tt_id!: number;

  @IsOptional()
  @IsString()
  exp_ts_note?: string | null;

  exp_ts_user_id: number;
}
