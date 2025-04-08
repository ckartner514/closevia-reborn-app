
// Organization Types
export type Organization = {
  id: string;
  name: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  user_id: string;
  org_id: string;
  role: 'admin' | 'viewer';
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
};

export type Invitation = {
  id: string;
  email: string;
  org_id: string;
  role: 'admin' | 'viewer';
  created_at: string;
  accepted: boolean;
};

// Role type
export type UserRole = 'admin' | 'viewer';
