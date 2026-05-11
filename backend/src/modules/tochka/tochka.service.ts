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

function extractStringByKeys(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === 'string' && direct.trim()) {
      return direct;
    }
  }

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === 'object') {
      const found = extractStringByKeys(nested, keys);
      if (found) return found;
    }
  }

  return null;
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
    const useReceipt = String(this.configService.get<string>('TOCHKA_USE_RECEIPT', 'true')) === 'true';
    const createPaymentNoReceiptPath = this.configService.get<string>('TOCHKA_CREATE_PAYMENT_NO_RECEIPT_PATH', '/payments');
    const createPaymentPath = this.configService.get<string>('TOCHKA_CREATE_PAYMENT_PATH', '/payments-with-receipt');
    const jwt = this.configService.get<string>('TOCHKA_JWT');
    const customerCode = this.configService.get<string>('TOCHKA_CUSTOMER_CODE');
    const merchantId = this.configService.get<string>('TOCHKA_MERCHANT_ID');

    const baseData = {
      amount: input.amount,
      purpose: input.product.title,
      paymentLinkId: input.paymentLinkId,
      redirectUrl: successUrl,
      failRedirectUrl: failUrl,
      callbackUrl,
      customerCode,
      merchantId,
      paymentMode: ['card', 'sbp'],
    };

    const payload = {
      Data: useReceipt
        ? {
            ...baseData,
            receipt: input.receipt,
          }
        : baseData,
    };

    if (!jwt || !apiBase) {
      this.logger.warn('Tochka credentials are not configured, returning stub payment link.');
      return {
        operationId: `stub_${input.paymentLinkId}`,
        paymentUrl: `${successUrl}?stub=1&paymentLinkId=${input.paymentLinkId}`,
        requestPayload: payload,
      };
    }

    const requestPath = useReceipt ? createPaymentPath : createPaymentNoReceiptPath;
    const response = await fetch(`${apiBase}${requestPath}`, {
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
    const operationId = extractStringByKeys(responseData, [
      'operationId',
      'OperationId',
      'paymentOperationId',
      'id',
    ]) || input.paymentLinkId;
    const paymentUrl = extractStringByKeys(responseData, [
      'paymentLinkUrl',
      'paymentUrl',
      'link',
      'redirectUrl',
      'url',
      'formUrl',
    ]) || successUrl;

    this.logger.log(
      `Tochka response mapped: operationId=${operationId}, paymentUrl=${paymentUrl}`,
    );
    this.logger.debug(`Tochka raw response: ${JSON.stringify(responseData)}`);

    return {
      operationId,
      paymentUrl,
      requestPayload: payload,
      responseData,
    };
  }
}
