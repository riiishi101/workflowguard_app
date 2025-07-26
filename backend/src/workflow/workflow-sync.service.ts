import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkflowService } from './workflow.service';
import { UserService } from '../user/user.service';

@Injectable()
export class WorkflowSyncService {
  private readonly logger = new Logger(WorkflowSyncService.name);

  constructor(
    private readonly workflowService: WorkflowService,
    private readonly userService: UserService,
  ) {}

  // Runs every hour
  @Cron('0 * * * *')
  async syncAllWorkflows() {
    this.logger.log('Starting scheduled HubSpot workflow sync...');
    const users = await this.userService.findAllWithHubSpotTokens();
    for (const user of users) {
      try {
        const hubspotWorkflows =
          await this.workflowService.getWorkflowsFromHubSpot(user.id);
        for (const hubspotWorkflow of hubspotWorkflows) {
          // Find the workflow in our DB by hubspotId
          const dbWorkflow = await this.workflowService.findByHubspotId(
            hubspotWorkflow.id?.toString() || hubspotWorkflow.workflowId,
          );
          if (!dbWorkflow) continue;
          // Get latest version
          const latestVersion = await this.workflowService[
            'prisma'
          ].workflowVersion.findFirst({
            where: { workflowId: dbWorkflow.id },
            orderBy: { version: 'desc' },
          });
          // Compare and snapshot if changed
          if (
            this.workflowService['isWorkflowChanged'](
              hubspotWorkflow,
              latestVersion,
            )
          ) {
            await this.workflowService.snapshotFromHubSpot(
              dbWorkflow.id,
              user.id,
            );
            this.logger.log(
              `Snapshotted workflow ${dbWorkflow.id} for user ${user.id}`,
            );
          }
        }
      } catch (err) {
        this.logger.error(
          `Error syncing workflows for user ${user.id}: ${err.message}`,
        );
      }
    }
    this.logger.log('HubSpot workflow sync complete.');
  }
}
