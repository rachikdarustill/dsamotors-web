import { Module } from '@nestjs/common';
import { FeedImportService } from './feed-import.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FeedImportService],
  exports: [ProductsService, FeedImportService],
})
export class ProductsModule {}
