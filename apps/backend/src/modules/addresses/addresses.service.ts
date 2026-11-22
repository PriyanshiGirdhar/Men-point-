import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  private async unsetOtherDefaults(userId: string, excludeId?: string) {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
      data: { isDefault: false },
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.unsetOtherDefaults(userId);
    }
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  private async assertOwnership(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException();
    }
    return address;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.assertOwnership(userId, id);
    if (dto.isDefault) {
      await this.unsetOtherDefaults(userId, id);
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.address.delete({ where: { id } });
    return { success: true };
  }
}
