export interface HubSpotWorkflow {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  status?: string;
  workflowId?: string;
  objectId?: string;
  workflowName?: string;
  label?: string;
  meta?: {
    description?: string;
    status?: string;
  };
}

export interface HubSpotTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface HubSpotApiResponse {
  results?: HubSpotWorkflow[];
  workflows?: HubSpotWorkflow[];
  data?: HubSpotWorkflow[];
  objects?: HubSpotWorkflow[];
  value?: HubSpotWorkflow[];
  items?: HubSpotWorkflow[];
  workflowList?: HubSpotWorkflow[];
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  hubspotData: HubSpotWorkflow;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  enabled?: boolean;
  [key: string]: any; // For flexibility
}

export interface UpdateWorkflowResponse extends HubSpotWorkflow {
  // The response is typically the full updated workflow object
}
