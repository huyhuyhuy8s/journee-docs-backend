import { Document } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DocumentService {
  private loadDocuments(): Document[] {
    try {
      if (fs.existsSync(DOCUMENTS_FILE)) {
        const data = fs.readFileSync(DOCUMENTS_FILE, 'utf8');
        const documents = JSON.parse(data);
        
        console.log('📂 Loaded documents from file:', documents.length);
        
        return documents.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        }));
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
    }
    
    console.log('📂 No documents file found, creating default documents');
    const defaultDocs = this.getDefaultDocuments();
    this.saveDocuments(defaultDocs);
    return defaultDocs;
  }

  private saveDocuments(documents: Document[]): void {
    try {
      console.log('💾 Saving documents to file:', documents.length);
      fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
    } catch (error) {
      console.error('❌ Error saving documents:', error);
    }
  }

  private getDefaultDocuments(): Document[] {
    // Get the actual current user ID from environment or use a placeholder
    const defaultUserId = 'user_340w7vJfrNB1M2fzcM5Rd3bo9GT'; // Your actual user ID
    
    return [
      {
        id: 'doc_welcome_sample',
        title: 'Welcome to Journee Docs',
        roomId: 'room_welcome_sample',
        createdBy: defaultUserId,
        collaborators: [defaultUserId],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'doc_guide_sample',
        title: 'Getting Started Guide',
        roomId: 'room_guide_sample',
        createdBy: defaultUserId,
        collaborators: [defaultUserId],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date(),
      }
    ];
  }

  async getDocuments(params: {
    userId: string;
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
  }) {
    console.log('📄 DocumentService.getDocuments called with params:', {
      userId: params.userId,
      page: params.page,
      limit: params.limit,
      search: params.search,
    });
    
    const allDocuments = this.loadDocuments();
    console.log('📊 Total documents loaded:', allDocuments.length);
    
    // Debug: Log all documents with their collaborators
    console.log('📋 All documents in system:');
    allDocuments.forEach((doc, index) => {
      console.log(`  ${index + 1}. "${doc.title}" (ID: ${doc.id})`);
      console.log(`     Created by: ${doc.createdBy}`);
      console.log(`     Collaborators: [${doc.collaborators.join(', ')}]`);
      console.log(`     User has access: ${doc.createdBy === params.userId || doc.collaborators.includes(params.userId)}`);
    });

    // Filter documents where user is creator or collaborator
    let userDocuments = allDocuments.filter(doc => {
      const isCreator = doc.createdBy === params.userId;
      const isCollaborator = doc.collaborators.includes(params.userId);
      const hasAccess = isCreator || isCollaborator;
      
      console.log(`🔍 Document "${doc.title}": creator=${isCreator}, collaborator=${isCollaborator}, access=${hasAccess}`);
      
      return hasAccess;
    });

    console.log('👤 User documents after filtering:', userDocuments.length);

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      userDocuments = userDocuments.filter(doc =>
        doc.title.toLowerCase().includes(searchLower)
      );
      console.log(`🔍 After search filter "${params.search}":`, userDocuments.length);
    }

    // Apply date filters
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      userDocuments = userDocuments.filter(doc => doc.createdAt >= fromDate);
      console.log('📅 After date from filter:', userDocuments.length);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      userDocuments = userDocuments.filter(doc => doc.createdAt <= toDate);
      console.log('📅 After date to filter:', userDocuments.length);
    }

    // Sort documents
    userDocuments.sort((a, b) => {
      const aValue = a[params.sortBy as keyof Document];
      const bValue = b[params.sortBy as keyof Document];
      
      if (params.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedDocuments = userDocuments.slice(startIndex, endIndex);

    const result = {
      data: paginatedDocuments,
      totalCount: userDocuments.length,
      currentPage: params.page,
      totalPages: Math.ceil(userDocuments.length / params.limit),
    };

    console.log(`📋 Final result: ${result.data.length} documents (page ${result.currentPage}/${result.totalPages})`);
    return result;
  }

  async createDocument(data: {
    title: string;
    createdBy: string;
    collaborators: string[];
  }): Promise<Document> {
    console.log('📝 Creating new document:', data);
    
    const documents = this.loadDocuments();
    
    const document: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title || 'Untitled Document',
      roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: data.createdBy,
      collaborators: data.collaborators.includes(data.createdBy) 
        ? data.collaborators 
        : [...data.collaborators, data.createdBy],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    documents.push(document);
    this.saveDocuments(documents);
    
    console.log('✅ Document created successfully:', {
      id: document.id,
      title: document.title,
      roomId: document.roomId,
      createdBy: document.createdBy,
      collaborators: document.collaborators,
    });
    
    return document;
  }

  async getDocument(id: string, userId: string): Promise<Document | null> {
    console.log("📖 Getting document:", id, "for user:", userId);

    const documents = this.loadDocuments();
    const document = documents.find((doc) => doc.id === id);

    if (!document) {
      console.log("❌ Document not found:", id);
      return null;
    }

    // Check if user has access
    const hasAccess =
      document.createdBy === userId || document.collaborators.includes(userId);

    if (!hasAccess) {
      console.log("🚫 Access denied for user:", userId, "to document:", id);
      console.log("📝 Document created by:", document.createdBy);
      console.log("👥 Collaborators:", document.collaborators);
      throw new Error("Access denied");
    }

    console.log("✅ Document access granted:", document.title);
    return document;
  }

  async getDocumentByRoomId(roomId: string, userId: string): Promise<Document | null> {
    console.log('🔍 Finding document by room ID:', roomId, 'for user:', userId);
    
    const documents = this.loadDocuments();
    const document = documents.find(doc => doc.roomId === roomId);
    
    if (!document) {
      console.log('❌ Document not found by room ID:', roomId);
      return null;
    }

    // Check if user has access
    const hasAccess = document.createdBy === userId || 
                     document.collaborators.includes(userId);

    if (!hasAccess) {
      console.log('🚫 Access denied for user:', userId, 'to document with room:', roomId);
      console.log('📝 Document created by:', document.createdBy);
      console.log('👥 Collaborators:', document.collaborators);
      throw new Error('Access denied');
    }

    console.log('✅ Document found by room ID:', document.title);
    return document;
  }

  async updateDocument(
    id: string,
    userId: string,
    updates: {
      title?: string;
      collaborators?: string[];
    }
  ): Promise<Document | null> {
    console.log('📝 Updating document:', id, 'for user:', userId, 'with updates:', updates);

    const documents = this.loadDocuments();
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      console.log('❌ Document not found:', id);
      return null;
    }

    const document = documents[documentIndex];

    // Check if user has access
    const hasAccess = document.createdBy === userId || 
                     document.collaborators.includes(userId);

    if (!hasAccess) {
      console.log('🚫 Update access denied for user:', userId);
      throw new Error('Access denied');
    }

    // Update document
    if (updates.title !== undefined) {
      document.title = updates.title;
      console.log('📝 Title updated to:', updates.title);
    }

    if (updates.collaborators) {
      // Ensure creator is always in collaborators
      const collaborators = updates.collaborators.includes(document.createdBy)
        ? updates.collaborators
        : [...updates.collaborators, document.createdBy];
      
      document.collaborators = collaborators;
      console.log('👥 Collaborators updated to:', collaborators);
    }

    document.updatedAt = new Date();
    documents[documentIndex] = document;
    
    this.saveDocuments(documents);
    console.log('✅ Document updated successfully:', document.title);
    return document;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    console.log("🗑️ Deleting document:", id, "for user:", userId);

    const documents = this.loadDocuments();
    const documentIndex = documents.findIndex((doc) => doc.id === id);

    if (documentIndex === -1) {
      console.log("❌ Document not found:", id);
      return false;
    }

    const document = documents[documentIndex];

    // Only creator can delete
    if (document.createdBy !== userId) {
      console.log(
        "🚫 Only creator can delete. Creator:",
        document.createdBy,
        "User:",
        userId
      );
      throw new Error("Only the creator can delete this document");
    }

    documents.splice(documentIndex, 1);
    this.saveDocuments(documents);

    console.log("✅ Document deleted:", id);
    return true;
  }

  async addCollaborator(
    documentId: string,
    userId: string,
    collaboratorId: string
  ): Promise<Document | null> {
    console.log(
      "👥 Adding collaborator:",
      collaboratorId,
      "to document:",
      documentId
    );

    const documents = this.loadDocuments();
    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return null;
    }

    const document = documents[documentIndex];

    // Check if user has access
    const hasAccess =
      document.createdBy === userId || document.collaborators.includes(userId);

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Add collaborator if not already present
    if (!document.collaborators.includes(collaboratorId)) {
      document.collaborators.push(collaboratorId);
      document.updatedAt = new Date();
      documents[documentIndex] = document;
      this.saveDocuments(documents);
      console.log("✅ Collaborator added:", collaboratorId);
    } else {
      console.log("ℹ️ Collaborator already exists:", collaboratorId);
    }

    return document;
  }

  async removeCollaborator(
    documentId: string,
    userId: string,
    collaboratorId: string
  ): Promise<Document | null> {
    console.log(
      "👥 Removing collaborator:",
      collaboratorId,
      "from document:",
      documentId
    );

    const documents = this.loadDocuments();
    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return null;
    }

    const document = documents[documentIndex];

    // Only creator can remove collaborators (or user can remove themselves)
    if (document.createdBy !== userId && collaboratorId !== userId) {
      throw new Error("Only the creator can remove collaborators");
    }

    // Don't remove the creator
    if (collaboratorId === document.createdBy) {
      throw new Error("Cannot remove the creator from collaborators");
    }

    // Remove collaborator
    document.collaborators = document.collaborators.filter(
      (id) => id !== collaboratorId
    );
    document.updatedAt = new Date();
    documents[documentIndex] = document;

    this.saveDocuments(documents);
    console.log("✅ Collaborator removed:", collaboratorId);
    return document;
  }

  // Utility method to get all documents (admin use)
  async getAllDocuments(): Promise<Document[]> {
    return this.loadDocuments();
  }

  // Utility method to reset to default documents
  async resetToDefaults(): Promise<void> {
    const defaultDocuments = this.getDefaultDocuments();
    this.saveDocuments(defaultDocuments);
    console.log("🔄 Documents reset to defaults");
  }
}

export const documentService = new DocumentService();
