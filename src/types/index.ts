export type WorkItemStatus = 'TO DO' | 'IN PROGRESS' | 'DONE';
export type WorkItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface WorkItem {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee?: string;
  reporter: string;
  storyPoints?: number;
  sprintId?: string;
  dueDate?: string;
  createdDate: string;
  updatedDate: string;
  comments: Comment[];
  subtasks: WorkItem[];
  flagged: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdDate: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  workItems: string[];
}

export interface Space {
  id: string;
  name: string;
  key: string;
  type: 'KANBAN' | 'SCRUM';
  owner: string;
  members: SpaceMember[];
}

export interface SpaceMember {
  email: string;
  role: 'ADMINISTRATOR' | 'MEMBER' | 'VIEWER';
}
