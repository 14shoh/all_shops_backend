import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDebtDto } from './create-supplier-debt.dto';

export class UpdateSupplierDebtDto extends PartialType(CreateSupplierDebtDto) {}
