import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from './product.types';
import { FeedImportService } from './feed-import.service';
import { mapPrismaProduct } from './product.mapper';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedImportService: FeedImportService,
  ) {}

  async onModuleInit() {
    const shouldImport = String(process.env.AUTO_IMPORT_FEED || 'true') === 'true';
    const productCount = await this.prisma.product.count();

    if (shouldImport && productCount === 0) {
      this.logger.log('Database is empty, importing products from feed.csv');
      await this.feedImportService.importFeed();
    }
  }

  async importFeed() {
    return this.feedImportService.importFeed();
  }

  async findAll(query?: string): Promise<Product[]> {
    const where: Prisma.ProductWhereInput | undefined = query?.trim()
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { oem: { contains: query, mode: 'insensitive' } },
            { make: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
      take: 100,
    });

    return products.map(mapPrismaProduct);
  }

  async findOne(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return product ? mapPrismaProduct(product) : null;
  }
}
