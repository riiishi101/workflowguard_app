interface LastModifiedBy {
  name: string;
  initials: string;
  email: string;
}

export interface ProtectedWorkflowDetailsDto {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  protectionStatus: 'protected';
  lastModified: string;
  versions: number;
  lastModifiedBy: LastModifiedBy;
}
