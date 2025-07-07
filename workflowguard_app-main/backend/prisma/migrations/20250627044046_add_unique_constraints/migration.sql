/*
  Warnings:

  - A unique constraint covering the columns `[hubspotId]` on the table `Workflow` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workflowId,versionNumber]` on the table `WorkflowVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Workflow_hubspotId_key" ON "Workflow"("hubspotId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_workflowId_versionNumber_key" ON "WorkflowVersion"("workflowId", "versionNumber");
