import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { TochkaController } from './tochka.controller';
import { TochkaService } from './tochka.service';

@Module({
  imports: [ConfigModule, forwardRef(() => OrdersModule)],
  controllers: [TochkaController],
  providers: [TochkaService],
  exports: [TochkaService],
})
export class TochkaModule {}
