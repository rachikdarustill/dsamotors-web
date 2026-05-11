import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from '../orders/orders.service';

@Controller('tochka')
export class TochkaController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('webhook')
  async receiveWebhook(@Req() req: Request, @Body() body: string) {
    const payload = typeof body === 'string' ? body : '';
    const paymentLinkId = req.headers['x-payment-link-id'];

    if (typeof paymentLinkId === 'string') {
      await this.ordersService.markPaid(paymentLinkId, payload);
    }

    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      note: 'TODO: validate Tochka JWT webhook signature and decode payload',
      payloadPreview: payload.slice(0, 200),
    };
  }
}
