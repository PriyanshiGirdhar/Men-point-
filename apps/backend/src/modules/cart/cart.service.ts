import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_ITEM_INCLUDE = {
  variant: {
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildCartResponse(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: CART_ITEM_INCLUDE,
    });

    let subtotal = 0;
    const formattedItems = items.map((item) => {
      const { product } = item.variant;
      const price = Number(product.discountPrice ?? product.basePrice);
      subtotal += price * item.quantity;
      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        variant: {
          id: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          stock: item.variant.stock,
          product: {
            id: product.id,
            title: product.title,
            slug: product.slug,
            basePrice: product.basePrice,
            discountPrice: product.discountPrice,
            image: product.images[0]?.url ?? null,
          },
        },
      };
    });

    return { items: formattedItems, subtotal };
  }

  getCart(userId: string) {
    return this.buildCartResponse(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_variantId: { userId, variantId: dto.variantId } },
    });

    const desiredQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (desiredQuantity > variant.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    await this.prisma.cartItem.upsert({
      where: { userId_variantId: { userId, variantId: dto.variantId } },
      create: { userId, variantId: dto.variantId, quantity: dto.quantity },
      update: { quantity: desiredQuantity },
    });

    return this.buildCartResponse(userId);
  }

  async updateQuantity(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException();
    }
    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.buildCartResponse(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.buildCartResponse(userId);
  }
}
