import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { FeedImportService } from '../modules/products/feed-import.service';

async function main() {
  process.env.AUTO_IMPORT_FEED = 'false';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const importer = app.get(FeedImportService);
    const result = await importer.importFeed();
    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

void main();
