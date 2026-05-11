import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?\d[\d\s\-()]{8,20}$/)
  phone?: string;
}
