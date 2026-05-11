import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/product.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { TochkaService } from '../tochka/tochka.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly tochkaService: TochkaService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Для чека 54-ФЗ нужен email или телефон покупателя.');
    }

    const product = await this.productsService.findOne(dto.productId);
    if (!product) {
      throw new NotFoundException('Товар не найден.');
    }

    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const paymentLinkId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const receiptPayload = this.tochkaService.buildReceiptPayload(product, dto);

    await this.prisma.order.create({
      data: {
        id: orderId,
        productId: product.id,
        status: 'created',
        email: dto.email,
        phone: dto.phone,
        amount: product.price,
        paymentLinkId,
        receiptPayload: receiptPayload as Prisma.InputJsonValue,
        productSnapshot: product as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      const payment = await this.tochkaService.createPaymentLink({
        amount: product.price,
        paymentLinkId,
        product,
        customer: dto,
        receipt: receiptPayload,
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'payment_link_created',
          paymentUrl: payment.paymentUrl,
          tochkaOperationId: payment.operationId,
          updatedAt: now,
        },
      });
    } catch (error) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
          updatedAt: new Date().toISOString(),
        },
      });
      throw error;
    }

    return this.getOrder(orderId);
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден.');
    }

    return {
      ...order,
      productSnapshot: order.productSnapshot as unknown as Product,
      receiptPayload: order.receiptPayload as Record<string, unknown>,
    };
  }

  async markPaid(paymentLinkId: string, payload?: string) {
    const order = await this.prisma.order.findUnique({
      where: { paymentLinkId },
    });
    if (!order) return null;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
      },
    });

    if (payload) {
      await this.prisma.webhookEvent.create({
        data: {
          id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          orderId: order.id,
          paymentLinkId,
          source: 'tochka',
          payload,
        },
      });
    }

    return this.getOrder(order.id);
  }
}
