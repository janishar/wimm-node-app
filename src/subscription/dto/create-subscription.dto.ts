import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  readonly property1: string;

  @IsNotEmpty()
  @MaxLength(1000)
  readonly property2: string;
}
