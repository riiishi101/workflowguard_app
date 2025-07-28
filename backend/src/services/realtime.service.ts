import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface UserConnection {
  userId: string;
  socketId: string;
  userEmail: string;
  userName: string;
  role: string;
  connectedAt: Date;
}

interface NotificationMessage {
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
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface RealTimeUpdate {
  type:
    | 'workflow_created'
    | 'workflow_updated'
    | 'workflow_deleted'
    | 'overage_detected'
    | 'billing_updated'
    | 'user_activity';
  data: any;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
    credentials: true,
  },
  namespace: '/realtime',
})
@Injectable()
export class RealtimeService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeService.name);
  private userConnections: Map<string, UserConnection> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of room names

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { subscription: true },
      });

      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid user`);
        client.disconnect();
        return;
      }

      // Store user connection
      const userConnection: UserConnection = {
        userId: user.id,
        socketId: client.id,
        userEmail: user.email,
        userName: user.name || user.email,
        role: user.role,
        connectedAt: new Date(),
      };

      this.userConnections.set(client.id, userConnection);

      // Join user-specific room
      await client.join(`user:${user.id}`);
      this.addUserToRoom(user.id, `user:${user.id}`);

      // Join role-based room
      await client.join(`role:${user.role}`);
      this.addUserToRoom(user.id, `role:${user.role}`);

      // Join admin room if admin
      if (user.role === 'admin') {
        await client.join('admin');
        this.addUserToRoom(user.id, 'admin');
      }

      this.logger.log(`User ${user.email} connected with socket ${client.id}`);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to WorkflowGuard real-time updates',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userConnection = this.userConnections.get(client.id);
    if (userConnection) {
      this.logger.log(`User ${userConnection.userEmail} disconnected`);
      this.userConnections.delete(client.id);
      this.removeUserFromAllRooms(userConnection.userId);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    notification: NotificationMessage,
  ) {
    const userConnection = this.findUserConnection(userId);
    if (userConnection) {
      this.server
        .to(userConnection.socketId)
        .emit('notification', notification);
      this.logger.log(
        `Notification sent to user ${userConnection.userEmail}: ${notification.type}`,
      );
    }
  }

  /**
   * Send notification to all users in a room
   */
  async sendNotificationToRoom(
    room: string,
    notification: NotificationMessage,
  ) {
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Notification sent to room ${room}: ${notification.type}`);
  }

  /**
   * Send notification to all connected users
   */
  async sendNotificationToAll(notification: NotificationMessage) {
    this.server.emit('notification', notification);
    this.logger.log(`Notification sent to all users: ${notification.type}`);
  }

  /**
   * Send real-time update to specific user
   */
  async sendUpdateToUser(userId: string, update: RealTimeUpdate) {
    const userConnection = this.findUserConnection(userId);
    if (userConnection) {
      this.server.to(userConnection.socketId).emit('update', update);
      this.logger.log(
        `Update sent to user ${userConnection.userEmail}: ${update.type}`,
      );
    }
  }

  /**
   * Send real-time update to room
   */
  async sendUpdateToRoom(room: string, update: RealTimeUpdate) {
    this.server.to(room).emit('update', update);
    this.logger.log(`Update sent to room ${room}: ${update.type}`);
  }

  /**
   * Send real-time update to all users
   */
  async sendUpdateToAll(update: RealTimeUpdate) {
    this.server.emit('update', update);
    this.logger.log(`Update sent to all users: ${update.type}`);
  }

  /**
   * Send overage alert in real-time
   */
  async sendOverageAlert(userId: string, overageData: any) {
    const notification: NotificationMessage = {
      type: 'overage_alert',
      title: '⚠️ Overage Alert',
      message: `You have exceeded your plan limits. ${overageData.count} overages detected.`,
      data: overageData,
      timestamp: new Date(),
      priority: 'high',
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send billing update in real-time
   */
  async sendBillingUpdate(userId: string, billingData: any) {
    const notification: NotificationMessage = {
      type: 'billing_update',
      title: '💰 Billing Update',
      message: `Billing update available. Total amount: $${billingData.totalAmount.toFixed(2)}`,
      data: billingData,
      timestamp: new Date(),
      priority: 'medium',
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send system alert in real-time
   */
  async sendSystemAlert(userId: string, alertData: any) {
    const notification: NotificationMessage = {
      type: 'system_alert',
      title: '🔧 System Alert',
      message: alertData.message,
      data: alertData,
      timestamp: new Date(),
      priority: alertData.actionRequired ? 'high' : 'medium',
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send usage warning in real-time
   */
  async sendUsageWarning(userId: string, usageData: any) {
    const notification: NotificationMessage = {
      type: 'usage_warning',
      title: '⚠️ Usage Warning',
      message: `You're approaching your plan limits. ${usageData.percentageUsed}% used.`,
      data: usageData,
      timestamp: new Date(),
      priority: 'medium',
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send workflow update in real-time
   */
  async sendWorkflowUpdate(userId: string, workflowData: any) {
    const update: RealTimeUpdate = {
      type: 'workflow_updated',
      data: workflowData,
      timestamp: new Date(),
    };

    await this.sendUpdateToUser(userId, update);
  }

  /**
   * Send audit log update in real-time (admin only)
   */
  async sendAuditLogUpdate(auditData: any) {
    const update: RealTimeUpdate = {
      type: 'user_activity',
      data: auditData,
      timestamp: new Date(),
    };

    await this.sendUpdateToRoom('admin', update);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get connected users by role
   */
  getConnectedUsersByRole(role: string): UserConnection[] {
    return Array.from(this.userConnections.values()).filter(
      (conn) => conn.role === role,
    );
  }

  /**
   * Get user connection info
   */
  getUserConnection(socketId: string): UserConnection | undefined {
    return this.userConnections.get(socketId);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return Array.from(this.userConnections.values()).some(
      (conn) => conn.userId === userId,
    );
  }

  /**
   * Broadcast admin message
   */
  async broadcastAdminMessage(message: string, data?: any) {
    const notification: NotificationMessage = {
      type: 'system_alert',
      title: '📢 Admin Message',
      message,
      data,
      timestamp: new Date(),
      priority: 'medium',
    };

    await this.sendNotificationToRoom('admin', notification);
  }

  /**
   * Broadcast system maintenance
   */
  async broadcastSystemMaintenance(message: string, scheduledTime?: Date) {
    const notification: NotificationMessage = {
      type: 'system_alert',
      title: '🔧 System Maintenance',
      message,
      data: { scheduledTime },
      timestamp: new Date(),
      priority: 'high',
    };

    await this.sendNotificationToAll(notification);
  }

  /**
   * Handle client message
   */
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userConnection = this.userConnections.get(client.id);
    if (userConnection) {
      this.logger.log(`Message from ${userConnection.userEmail}: ${data.type}`);

      // Echo back to sender
      client.emit('message', {
        type: 'echo',
        data: data,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle user typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userConnection = this.userConnections.get(client.id);
    if (userConnection) {
      // Broadcast typing indicator to room
      client.broadcast.to(`user:${userConnection.userId}`).emit('typing', {
        userId: userConnection.userId,
        userName: userConnection.userName,
        isTyping: data.isTyping,
      });
    }
  }

  /**
   * Handle user activity
   */
  @SubscribeMessage('activity')
  handleActivity(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userConnection = this.userConnections.get(client.id);
    if (userConnection) {
      this.logger.log(
        `User activity from ${userConnection.userEmail}: ${data.type}`,
      );

      // Log activity for analytics
      this.logUserActivity(userConnection.userId, data);
    }
  }

  /**
   * Helper methods
   */
  private findUserConnection(userId: string): UserConnection | undefined {
    return Array.from(this.userConnections.values()).find(
      (conn) => conn.userId === userId,
    );
  }

  private addUserToRoom(userId: string, room: string) {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(room);
  }

  private removeUserFromAllRooms(userId: string) {
    this.userRooms.delete(userId);
  }

  private async logUserActivity(userId: string, activity: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'realtime_activity',
          entityType: 'user_activity',
          entityId: userId,
          oldValue: { type: 'null' },
          newValue: activity,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log user activity:`, error);
    }
  }
}
