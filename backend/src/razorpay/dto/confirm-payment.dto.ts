export class ConfirmPaymentDto {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
}
