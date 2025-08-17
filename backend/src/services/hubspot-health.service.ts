import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
}

export interface HealthMetrics {
  metrics: Record<string, unknown>;
}

@Injectable()
export class HubSpotHealthService {
  async checkHealth(): Promise<HealthStatus> {
    return { status: 'healthy' };
  }

  async getMetrics(): Promise<HealthMetrics> {
    return { metrics: {} };
  }
}
