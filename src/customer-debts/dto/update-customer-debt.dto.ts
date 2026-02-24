import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDebtDto } from './create-customer-debt.dto';

export class UpdateCustomerDebtDto extends PartialType(CreateCustomerDebtDto) {}
