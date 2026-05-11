import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      ok: true,
      service: 'dsamotors-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
