// --- 1. Enums (Using underscores to match Backend) ---
export type WorkItemStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';
export type WorkItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';
export type SpaceType = 'KANBAN' | 'SCRUM';
export type SpaceRole = 'ADMINISTRATOR' | 'MEMBER' | 'VIEWER';

// --- 2. Helper Types ---
export interface UserStub {
  id: string;
  userName: string;
}

// --- 3. Main Interfaces ---

export interface Comment {
  id: string;
  author: UserStub;
  content: string;
  createdDate: string;
}

export interface WorkItem {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee?: UserStub;
  reporter: UserStub;
  storyPoints?: number;
  sprintId?: string;
  dueDate?: string;
  createdDate: string;
  updatedDate: string;
  comments: Comment[];
  subtasks: WorkItem[];
  flagged: boolean;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  status: SprintStatus;
  workItems: WorkItem[];
}

export interface SpaceMember {
  role: SpaceRole;
  user: UserStub;
}

export interface Space {
  id: string;
  name: string;
  key: string;
  type: SpaceType;
  owner: UserStub;
  members: SpaceMember[];
  sprints: Sprint[];
}