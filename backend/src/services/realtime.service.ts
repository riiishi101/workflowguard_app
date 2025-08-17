import { Injectable } from '@nestjs/common';

@Injectable()
export class RealtimeService {
  async sendNotification(userId: string, message: string): Promise<void> {
    console.log(`Realtime notification sent to ${userId}: ${message}`);
  }

  async broadcastToAdmins(message: string): Promise<void> {
    console.log(`Broadcast to admins: ${message}`);
  }
}
