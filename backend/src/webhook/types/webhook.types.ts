export interface Webhook {
  id: string;
  name: string;
  endpointUrl: string;
  secret?: string | null;
  events: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
