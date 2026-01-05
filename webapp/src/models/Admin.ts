// src/models/Admin.ts

export interface Admin {
    adminId: string;
    userId: string; // Linked User
  
    personalInfo: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      photoURL?: string;
    };
  
    permissions: {
      canApproveUsers: boolean;
      canViewAllData: boolean;
      canManageSystem: boolean;
      canExportData: boolean;
    };
  
    isActive: boolean;
  
    createdAt: Date;
    updatedAt: Date;
  }
  