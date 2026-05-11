import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Product } from '../products/product.types';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

interface CreatePaymentLinkInput {
  amount: number;
  paymentLinkId: string;
  product: Product;
  customer: CreateOrderDto;
  receipt: Record<string, unknown>;
}

@Injectable()
export class TochkaService {
  private readonly logger = new Logger(TochkaService.name);

  constructor(private readonly configService: ConfigService) {}

  buildReceiptPayload(product: Product, customer: CreateOrderDto) {
    return {
      customer: {
        email: customer.email,
        phone: customer.phone,
      },
      taxationSystem: this.configService.get<string>('RECEIPT_TAX_SYSTEM', 'OSN'),
      items: [
        {
          name: product.title,
          quantity: 1,
          amount: product.price,
          paymentMethod: this.configService.get<string>('RECEIPT_PAYMENT_METHOD', 'full_payment'),
          paymentObject: this.configService.get<string>('RECEIPT_PAYMENT_OBJECT', 'commodity'),
          vat: {
            type: this.configService.get<string>('RECEIPT_VAT_TYPE', 'none'),
          },
        },
      ],
    };
  }

  async createPaymentLink(input: CreatePaymentLinkInput) {
    const callbackUrl = this.configService.get<string>('TOCHKA_CALLBACK_URL');
    const successUrl = this.configService.get<string>('TOCHKA_SUCCESS_URL');
    const failUrl = this.configService.get<string>('TOCHKA_FAIL_URL');
    const apiBase = this.configService.get<string>('TOCHKA_API_BASE');
    const createPaymentPath = this.configService.get<string>('TOCHKA_CREATE_PAYMENT_PATH', '/payments-with-receipt');
    const jwt = this.configService.get<string>('TOCHKA_JWT');

    const payload = {
      Data: {
        amount: input.amount,
        purpose: input.product.title,
        paymentLinkId: input.paymentLinkId,
        redirectUrl: successUrl,
        failRedirectUrl: failUrl,
        callbackUrl,
        customerCode: this.configService.get<string>('TOCHKA_CUSTOMER_CODE'),
        merchantId: this.configService.get<string>('TOCHKA_MERCHANT_ID'),
        paymentMode: ['card', 'sbp'],
        receipt: input.receipt,
      },
    };

    if (!jwt || !apiBase) {
      this.logger.warn('Tochka credentials are not configured, returning stub payment link.');
      return {
        operationId: `stub_${input.paymentLinkId}`,
        paymentUrl: `${successUrl}?stub=1&paymentLinkId=${input.paymentLinkId}`,
        requestPayload: payload,
      };
    }

    const response = await fetch(`${apiBase}${createPaymentPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      this.logger.error(`Tochka API error ${response.status}: ${details}`);
      throw new Error(`Tochka API error ${response.status}`);
    }

    const data = await response.json() as Record<string, any>;

    const responseData = data?.Data ?? data?.data ?? data;
    const operationId = String(
      responseData?.operationId
      ?? responseData?.OperationId
      ?? responseData?.paymentOperationId
      ?? input.paymentLinkId,
    );
    const paymentUrl = String(
      responseData?.paymentLinkUrl
      ?? responseData?.paymentUrl
      ?? responseData?.link
      ?? successUrl,
    );

    return {
      operationId,
      paymentUrl,
      requestPayload: payload,
      responseData,
    };
  }
}
