import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OverageService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: any = {}) {
    return this.prisma.overage.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.overage.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async markAsBilled(id: string) {
    return this.prisma.overage.update({
      where: { id },
      data: { billed: true },
    });
  }

  async getOverageSummary(periodStart?: Date, periodEnd?: Date) {
    const where: any = {};
    if (periodStart && periodEnd) {
      where.periodStart = { gte: periodStart };
      where.periodEnd = { lte: periodEnd };
    }

    const overages = await this.prisma.overage.findMany({ where });

    const totalOverages = overages.reduce(
      (sum, overage) => sum + overage.amount,
      0,
    );
    const unbilledOverages = overages
      .filter((overage) => !overage.billed)
      .reduce((sum, overage) => sum + overage.amount, 0);

    const usersWithOverages = new Set(overages.map((o) => o.userId)).size;

    return {
      totalOverages,
      unbilledOverages,
      billedOverages: totalOverages - unbilledOverages,
      usersWithOverages,
      overagePeriods: overages.length,
    };
  }

  async getUnbilledOverages() {
    return this.prisma.overage.findMany({
      where: { billed: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { periodStart: 'desc' },
    });
  }
}
