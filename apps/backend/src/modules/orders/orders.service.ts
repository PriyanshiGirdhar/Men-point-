import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { generateOrderNumber } from '../../common/utils/order-number';
import { PaymentMethod, PaymentStatus, Prisma, Role } from '@prisma/client';

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

const ORDER_DETAIL_INCLUDE = {
  address: true,
  items: true,
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Address does not belong to the current user');
    }

    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { variant: { include: { product: true } } },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cartItems) {
      if (item.quantity > item.variant.stock) {
        throw new BadRequestException(
          `Insufficient stock for ${item.variant.product.title} (${item.variant.size}/${item.variant.color})`,
        );
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant.product.discountPrice ?? item.variant.product.basePrice);
      return sum + price * item.quantity;
    }, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    const paymentStatus =
      dto.paymentMethod === PaymentMethod.CARD ? PaymentStatus.PAID : PaymentStatus.PENDING;

    for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              orderNumber: generateOrderNumber(),
              userId,
              addressId: dto.addressId,
              paymentMethod: dto.paymentMethod,
              paymentStatus,
              subtotal,
              shippingFee,
              total,
              items: {
                create: cartItems.map((item) => ({
                  variantId: item.variantId,
                  productTitle: item.variant.product.title,
                  size: item.variant.size,
                  color: item.variant.color,
                  price: Number(item.variant.product.discountPrice ?? item.variant.product.basePrice),
                  quantity: item.quantity,
                })),
              },
            },
            include: ORDER_DETAIL_INCLUDE,
          });

          for (const item of cartItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }

          await tx.cartItem.deleteMany({ where: { userId } });

          return created;
        });
      } catch (error) {
        const isDuplicateOrderNumber =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          (error.meta?.target as string[] | undefined)?.includes('orderNumber');
        if (!isDuplicateOrderNumber || attempt === MAX_ORDER_NUMBER_ATTEMPTS) {
          throw error;
        }
      }
    }

    // Unreachable: the loop above always returns or throws.
    throw new Error('Failed to create order');
  }

  async findAllForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productTitle: item.productTitle,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    }));
  }

  async findOne(userId: string, role: Role, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    return order;
  }
}
