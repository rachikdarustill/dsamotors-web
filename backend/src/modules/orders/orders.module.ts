import { Module, forwardRef } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { TochkaModule } from '../tochka/tochka.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ProductsModule, forwardRef(() => TochkaModule)],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
