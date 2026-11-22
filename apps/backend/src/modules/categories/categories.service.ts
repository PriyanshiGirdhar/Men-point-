import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender } from '@prisma/client';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  gender: Gender | null;
  children: CategoryNode[];
}

function toTree(category: any): CategoryNode {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl,
    gender: category.gender,
    children: (category.children ?? []).map(toTree),
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: this.childrenInclude(3),
    });
    return categories.map((category) => toTree(category));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: this.childrenInclude(3),
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return toTree(category);
  }

  /** Builds a nested `include` for a fixed max depth (categories are only a few levels deep). */
  private childrenInclude(depth: number): any {
    if (depth <= 0) {
      return undefined;
    }
    return {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: this.childrenInclude(depth - 1),
      },
    };
  }

  /** Returns the category id plus every descendant id, used for catalog filtering by category slug. */
  async findIdsBySlugIncludingDescendants(slug: string): Promise<string[]> {
    const root = await this.prisma.category.findUnique({ where: { slug } });
    if (!root) {
      return [];
    }
    const ids = [root.id];
    let frontier = [root.id];
    while (frontier.length > 0) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      ids.push(...childIds);
      frontier = childIds;
    }
    return ids;
  }
}
