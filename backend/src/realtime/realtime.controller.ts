import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { RealtimeService } from '../services/realtime.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

interface SendNotificationDto {
  userId?: string;
  room?: string;
  type:
    | 'overage_alert'
    | 'billing_update'
    | 'system_alert'
    | 'usage_warning'
    | 'workflow_update'
    | 'audit_log';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SendUpdateDto {
  userId?: string;
  room?: string;
  type:
    | 'workflow_created'
    | 'workflow_updated'
    | 'workflow_deleted'
    | 'overage_detected'
    | 'billing_updated'
    | 'user_activity';
  data: any;
}

interface BroadcastMessageDto {
  message: string;
  data?: any;
  scheduledTime?: Date;
}

@Controller('realtime')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  /**
   * Get real-time connection status
   */
  @Get('status')
  async getConnectionStatus(@Request() req: RequestWithUser) {
    const isConnected = this.realtimeService.isUserConnected(req.user.id);
    const connectedUsersCount = this.realtimeService.getConnectedUsersCount();

    return {
      isConnected,
      connectedUsersCount,
      userId: req.user.id,
      userEmail: req.user.email,
    };
  }

  /**
   * Get connected users (admin only)
   */
  @Get('users')
  @Roles('admin')
  async getConnectedUsers() {
    const totalUsers = this.realtimeService.getConnectedUsersCount();
    const adminUsers = this.realtimeService.getConnectedUsersByRole('admin');
    const regularUsers = this.realtimeService.getConnectedUsersByRole('user');

    return {
      totalUsers,
      adminUsers: adminUsers.length,
      regularUsers: regularUsers.length,
      users: {
        admins: adminUsers.map((user) => ({
          id: user.userId,
          email: user.userEmail,
          name: user.userName,
          connectedAt: user.connectedAt,
        })),
        regular: regularUsers.map((user) => ({
          id: user.userId,
          email: user.userEmail,
          name: user.userName,
          connectedAt: user.connectedAt,
        })),
      },
    };
  }

  /**
   * Send notification to specific user
   */
  @Post('notification/user')
  @Roles('admin')
  async sendNotificationToUser(@Body() data: SendNotificationDto) {
    if (!data.userId) {
      return { success: false, message: 'User ID is required' };
    }

    const notification = {
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      timestamp: new Date(),
      priority: data.priority,
    };

    await this.realtimeService.sendNotificationToUser(
      data.userId,
      notification,
    );

    return {
      success: true,
      message: `Notification sent to user ${data.userId}`,
      notification,
    };
  }

  /**
   * Send notification to room
   */
  @Post('notification/room')
  @Roles('admin')
  async sendNotificationToRoom(@Body() data: SendNotificationDto) {
    if (!data.room) {
      return { success: false, message: 'Room is required' };
    }

    const notification = {
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      timestamp: new Date(),
      priority: data.priority,
    };

    await this.realtimeService.sendNotificationToRoom(data.room, notification);

    return {
      success: true,
      message: `Notification sent to room ${data.room}`,
      notification,
    };
  }

  /**
   * Send notification to all users
   */
  @Post('notification/all')
  @Roles('admin')
  async sendNotificationToAll(@Body() data: SendNotificationDto) {
    const notification = {
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      timestamp: new Date(),
      priority: data.priority,
    };

    await this.realtimeService.sendNotificationToAll(notification);

    return {
      success: true,
      message: 'Notification sent to all users',
      notification,
    };
  }

  /**
   * Send real-time update to user
   */
  @Post('update/user')
  @Roles('admin')
  async sendUpdateToUser(@Body() data: SendUpdateDto) {
    if (!data.userId) {
      return { success: false, message: 'User ID is required' };
    }

    const update = {
      type: data.type,
      data: data.data,
      timestamp: new Date(),
    };

    await this.realtimeService.sendUpdateToUser(data.userId, update);

    return {
      success: true,
      message: `Update sent to user ${data.userId}`,
      update,
    };
  }

  /**
   * Send real-time update to room
   */
  @Post('update/room')
  @Roles('admin')
  async sendUpdateToRoom(@Body() data: SendUpdateDto) {
    if (!data.room) {
      return { success: false, message: 'Room is required' };
    }

    const update = {
      type: data.type,
      data: data.data,
      timestamp: new Date(),
    };

    await this.realtimeService.sendUpdateToRoom(data.room, update);

    return {
      success: true,
      message: `Update sent to room ${data.room}`,
      update,
    };
  }

  /**
   * Send real-time update to all users
   */
  @Post('update/all')
  @Roles('admin')
  async sendUpdateToAll(@Body() data: SendUpdateDto) {
    const update = {
      type: data.type,
      data: data.data,
      timestamp: new Date(),
    };

    await this.realtimeService.sendUpdateToAll(update);

    return {
      success: true,
      message: 'Update sent to all users',
      update,
    };
  }

  /**
   * Send overage alert in real-time
   */
  @Post('overage-alert')
  @Roles('admin')
  async sendOverageAlert(@Body() data: { userId: string; overageData: any }) {
    await this.realtimeService.sendOverageAlert(data.userId, data.overageData);

    return {
      success: true,
      message: `Overage alert sent to user ${data.userId}`,
    };
  }

  /**
   * Send billing update in real-time
   */
  @Post('billing-update')
  @Roles('admin')
  async sendBillingUpdate(@Body() data: { userId: string; billingData: any }) {
    await this.realtimeService.sendBillingUpdate(data.userId, data.billingData);

    return {
      success: true,
      message: `Billing update sent to user ${data.userId}`,
    };
  }

  /**
   * Send system alert in real-time
   */
  @Post('system-alert')
  @Roles('admin')
  async sendSystemAlert(@Body() data: { userId: string; alertData: any }) {
    await this.realtimeService.sendSystemAlert(data.userId, data.alertData);

    return {
      success: true,
      message: `System alert sent to user ${data.userId}`,
    };
  }

  /**
   * Send usage warning in real-time
   */
  @Post('usage-warning')
  @Roles('admin')
  async sendUsageWarning(@Body() data: { userId: string; usageData: any }) {
    await this.realtimeService.sendUsageWarning(data.userId, data.usageData);

    return {
      success: true,
      message: `Usage warning sent to user ${data.userId}`,
    };
  }

  /**
   * Send workflow update in real-time
   */
  @Post('workflow-update')
  @Roles('admin')
  async sendWorkflowUpdate(
    @Body() data: { userId: string; workflowData: any },
  ) {
    await this.realtimeService.sendWorkflowUpdate(
      data.userId,
      data.workflowData,
    );

    return {
      success: true,
      message: `Workflow update sent to user ${data.userId}`,
    };
  }

  /**
   * Send audit log update in real-time (admin only)
   */
  @Post('audit-log-update')
  @Roles('admin')
  async sendAuditLogUpdate(@Body() data: { auditData: any }) {
    await this.realtimeService.sendAuditLogUpdate(data.auditData);

    return {
      success: true,
      message: 'Audit log update sent to admin room',
    };
  }

  /**
   * Broadcast admin message
   */
  @Post('broadcast/admin')
  @Roles('admin')
  async broadcastAdminMessage(@Body() data: BroadcastMessageDto) {
    await this.realtimeService.broadcastAdminMessage(data.message, data.data);

    return {
      success: true,
      message: 'Admin message broadcasted',
    };
  }

  /**
   * Broadcast system maintenance
   */
  @Post('broadcast/maintenance')
  @Roles('admin')
  async broadcastSystemMaintenance(@Body() data: BroadcastMessageDto) {
    await this.realtimeService.broadcastSystemMaintenance(
      data.message,
      data.scheduledTime,
    );

    return {
      success: true,
      message: 'System maintenance broadcasted to all users',
    };
  }

  /**
   * Test real-time connection
   */
  @Post('test')
  async testConnection(@Request() req: RequestWithUser) {
    const isConnected = this.realtimeService.isUserConnected(req.user.id);

    if (isConnected) {
      // Send a test notification to the user
      await this.realtimeService.sendNotificationToUser(req.user.id, {
        type: 'system_alert',
        title: '🧪 Test Notification',
        message: 'This is a test notification from the real-time system.',
        timestamp: new Date(),
        priority: 'low',
      });

      return {
        success: true,
        message: 'Test notification sent successfully',
        isConnected: true,
      };
    } else {
      return {
        success: false,
        message: 'User is not connected to real-time system',
        isConnected: false,
      };
    }
  }

  /**
   * Get user's real-time rooms
   */
  @Get('rooms')
  async getUserRooms(@Request() req: RequestWithUser) {
    const isConnected = this.realtimeService.isUserConnected(req.user.id);

    if (!isConnected) {
      return {
        success: false,
        message: 'User is not connected to real-time system',
        rooms: [],
      };
    }

    const rooms = [`user:${req.user.id}`, `role:${req.user.role}`];

    if (req.user.role === 'admin') {
      rooms.push('admin');
    }

    return {
      success: true,
      rooms,
      isConnected: true,
    };
  }
}
