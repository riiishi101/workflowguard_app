import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLog } from '@prisma/client';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    try {
      return await this.prisma.auditLog.create({
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.create:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async findAll(): Promise<AuditLog[]> {
    try {
      return await this.prisma.auditLog.findMany({
        include: {
          user: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.findAll:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: { userId },
        include: {
          user: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.findByUser:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          user: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.findByEntity:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<AuditLog | null> {
    try {
      return await this.prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.findOne:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async update(id: string, data: any): Promise<AuditLog> {
    try {
      return await this.prisma.auditLog.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.update:',
        error,
        error?.stack,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<AuditLog> {
    try {
      return await this.prisma.auditLog.delete({
        where: { id },
      });
    } catch (error) {
      console.error(
        'Prisma error in AuditLogService.remove:',
        error,
        error?.stack,
      );
      throw error;
    }
  }
}
