import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { parseCsv, normalizeHeader } from '../../common/csv';

@Injectable()
export class FeedImportService {
  private readonly logger = new Logger(FeedImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFeed(filePath = process.env.FEED_PATH || '/app/data/feed.csv') {
    const csvText = await readFile(filePath, 'utf-8');
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      this.logger.warn('feed.csv is empty, import skipped');
      return { imported: 0 };
    }

    const headers = rows[0].map(normalizeHeader);
    const indexOf = (nameRe: RegExp, fallbackIndex: number) => {
      const found = headers.findIndex((value) => nameRe.test(value));
      return found >= 0 ? found : fallbackIndex;
    };

    const categoryIndex = indexOf(/category|категор/, 0);
    const conditionIndex = indexOf(/condition|состояни/, 1);
    const addressIndex = indexOf(/address|адрес/, 2);
    const titleIndex = indexOf(/title|наименование|name/, 3);
    const descriptionIndex = indexOf(/description|описан/, 4);
    const brandIndex = indexOf(/brand|бренд/, 6);
    const makeIndex = indexOf(/^make$|марка авто|марка автомобиля/, 7);
    const priceIndex = indexOf(/price|цена/, 10);
    const oemIndex = indexOf(/^oem$|артикул|partnumber/, 13);
    const imageIndexes = headers
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => /^images\d+$/.test(header))
      .map(({ index }) => index);

    const products = rows.slice(1).map((cols, rowIndex) => ({
      id: String(rowIndex),
      category: String(cols[categoryIndex] || '').trim(),
      condition: String(cols[conditionIndex] || '').trim(),
      address: String(cols[addressIndex] || '').trim(),
      title: String(cols[titleIndex] || '').trim(),
      description: String(cols[descriptionIndex] || '').trim(),
      brand: String(cols[brandIndex] || '').trim(),
      make: String(cols[makeIndex] || '').trim(),
      price: Number(String(cols[priceIndex] || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      oem: String(cols[oemIndex] || '').trim(),
      images: imageIndexes.map((index) => String(cols[index] || '').trim()).filter(Boolean),
    })).filter((product) => product.title);

    if (!products.length) {
      this.logger.warn('no products parsed from feed.csv');
      return { imported: 0 };
    }

    await this.prisma.$transaction([
      this.prisma.webhookEvent.deleteMany(),
      this.prisma.order.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.product.createMany({
        data: products,
      }),
    ]);

    this.logger.log(`Imported ${products.length} products from ${filePath}`);
    return { imported: products.length };
  }
}
