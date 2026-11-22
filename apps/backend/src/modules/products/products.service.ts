import { Injectable, NotFoundException } from '@nestjs/common';
import { Gender, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { ProductsQueryDto } from './dto/products-query.dto';
import { paginationMeta } from '../../common/utils/pagination';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private priceCondition(minPrice?: number, maxPrice?: number): Prisma.ProductWhereInput {
    const range: { gte?: number; lte?: number } = {};
    if (minPrice !== undefined) range.gte = minPrice;
    if (maxPrice !== undefined) range.lte = maxPrice;
    return {
      OR: [{ discountPrice: range }, { AND: [{ discountPrice: null }, { basePrice: range }] }],
    };
  }

  async findAll(query: ProductsQueryDto) {
    const { page, limit, skip } = paginationMeta(query.page, query.limit);
    const conditions: Prisma.ProductWhereInput[] = [{ isActive: true }];

    if (query.gender) {
      conditions.push({ gender: query.gender });
    }
    if (query.category) {
      const ids = await this.categoriesService.findIdsBySlugIncludingDescendants(query.category);
      conditions.push({ categoryId: { in: ids.length ? ids : ['__none__'] } });
    }
    if (query.size?.length) {
      conditions.push({ variants: { some: { size: { in: query.size } } } });
    }
    if (query.color?.length) {
      conditions.push({ variants: { some: { color: { in: query.color } } } });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      conditions.push(this.priceCondition(query.minPrice, query.maxPrice));
    }
    if (query.q) {
      conditions.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { brand: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = { AND: conditions };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : query.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : { createdAt: 'desc' };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { select: { size: true, color: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      brand: product.brand,
      gender: product.gender,
      basePrice: product.basePrice,
      discountPrice: product.discountPrice,
      image: product.images[0]?.url ?? null,
      sizes: Array.from(new Set(product.variants.map((v) => v.size))),
      colors: Array.from(new Set(product.variants.map((v) => v.color))),
    }));

    return { items, total, page, limit };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, sortOrder: true } },
        variants: { select: { id: true, size: true, color: true, colorHex: true, stock: true, sku: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      gender: product.gender,
      basePrice: product.basePrice,
      discountPrice: product.discountPrice,
      category: product.category,
      images: product.images,
      variants: product.variants,
    };
  }

  async getFilters(categorySlug?: string, gender?: Gender) {
    const conditions: Prisma.ProductWhereInput[] = [{ isActive: true }];
    if (categorySlug) {
      const ids = await this.categoriesService.findIdsBySlugIncludingDescendants(categorySlug);
      conditions.push({ categoryId: { in: ids.length ? ids : ['__none__'] } });
    }
    if (gender) {
      conditions.push({ gender });
    }

    const products = await this.prisma.product.findMany({
      where: { AND: conditions },
      select: {
        basePrice: true,
        discountPrice: true,
        variants: { select: { size: true, color: true, colorHex: true } },
      },
    });

    const sizes = new Set<string>();
    const colors = new Map<string, string | null>();
    let minPrice = 0;
    let maxPrice = 0;
    let first = true;

    for (const product of products) {
      const effective = Number(product.discountPrice ?? product.basePrice);
      if (first) {
        minPrice = effective;
        maxPrice = effective;
        first = false;
      } else {
        if (effective < minPrice) minPrice = effective;
        if (effective > maxPrice) maxPrice = effective;
      }
      for (const variant of product.variants) {
        sizes.add(variant.size);
        if (!colors.has(variant.color)) {
          colors.set(variant.color, variant.colorHex ?? null);
        }
      }
    }

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors.entries()).map(([name, hex]) => ({ name, hex })),
      minPrice,
      maxPrice,
    };
  }
}
