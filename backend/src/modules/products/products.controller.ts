import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(@Query('q') q?: string) {
    return this.productsService.findAll(q);
  }

  @Post('admin/import')
  importFeed() {
    return this.productsService.importFeed();
  }

  @Get(':id')
  getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
