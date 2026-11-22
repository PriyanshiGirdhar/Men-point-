import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginationMeta } from '../../common/utils/pagination';
import { slugify } from '../../common/utils/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AdminListQueryDto, AdminOrdersQueryDto } from './dto/list-query.dto';

const PRODUCT_INCLUDE = {
  variants: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: { select: { id: true, name: true, slug: true } },
};

const ORDER_INCLUDE = { items: true, address: true };

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Stats ----------
  async getStats() {
    const [totalOrders, revenueAgg, totalUsers, totalProducts, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: revenueAgg._sum.total ?? 0,
      totalUsers,
      totalProducts,
      recentOrders: recentOrders.map((order) => ({
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
      })),
    };
  }

  // ---------- Products ----------
  async listProducts(query: AdminListQueryDto) {
    const { page, limit, skip } = paginationMeta(query.page, query.limit);
    const where: Prisma.ProductWhereInput = query.q
      ? { title: { contains: query.q, mode: 'insensitive' } }
      : {};

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = products.map((product) => ({ ...product, image: product.images[0]?.url ?? null }));

    return { items, total, page, limit };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug: slugify(dto.title),
        description: dto.description,
        brand: dto.brand,
        gender: dto.gender,
        basePrice: dto.basePrice,
        discountPrice: dto.discountPrice,
        categoryId: dto.categoryId,
        variants: { create: dto.variants.map((v) => ({ ...v })) },
        images: { create: (dto.images ?? []).map((img, index) => ({ ...img, sortOrder: img.sortOrder ?? index })) },
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const { variants, images, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...rest,
          ...(rest.title ? { slug: slugify(rest.title) } : {}),
          ...(variants ? { variants: { create: variants.map((v) => ({ ...v })) } } : {}),
          ...(images
            ? { images: { create: images.map((img, index) => ({ ...img, sortOrder: img.sortOrder ?? index })) } }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
    });
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Product cannot be deleted because it has existing orders');
      }
      throw error;
    }

    return { success: true };
  }

  // ---------- Categories ----------
  listCategories() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }
    return this.prisma.category.create({ data: dto });
  }

  // ---------- Orders ----------
  async listOrders(query: AdminOrdersQueryDto) {
    const { page, limit, skip } = paginationMeta(query.page, query.limit);
    const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }
    return this.prisma.order.update({ where: { id }, data: { status: dto.status }, include: ORDER_INCLUDE });
  }

  // ---------- Users ----------
  async listUsers(query: AdminListQueryDto) {
    const { page, limit, skip } = paginationMeta(query.page, query.limit);
    const where: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map(({ passwordHash: _passwordHash, ...rest }) => rest);
    return { items, total, page, limit };
  }
}
