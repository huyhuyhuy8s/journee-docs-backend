export interface DocumentMetadata {
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentAccess {
  roomId: string;
  usersAccesses: Record<string, string[]>;
  defaultAccesses: string[];
  metadata: DocumentMetadata;
}

export interface CreateDocumentRequest {
  title: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  collaborators?: string[];
}

export interface InviteCollaboratorRequest {
  email: string;
  permission?: "room:read" | "room:write";
}

export interface RenameDocumentRequest {
  title: string;
}

export interface UpdateDocumentAccessRequest {
  usersAccesses: Record<string, string[]>;
}
