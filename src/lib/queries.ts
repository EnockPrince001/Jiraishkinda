import { gql } from 'graphql-request';

export const GET_ME = gql`
  query {
    me {
      id
      userName
      email
      spaces {
        role
        space {
          id
          name
          key
          type
        }
      }
    }
  }
`;

export const GET_SPACE_DATA = gql`
  query GetSpaceData($spaceKey: String!) {
    space(spaceKey: $spaceKey) {
      id
      name
      key
      type
      members {
        role
        user {
          id
          userName
          email
        }
      }
      sprints {
        id
        name
        status
        startDate
        endDate
        goal
      }
      boardColumns {
        id
        name
        order
        isSystem
      }
    }
  }
`;

export const GET_WORK_ITEMS = gql`
  query GetWorkItems($spaceKey: String!) {
    workItemsForSpace(spaceKey: $spaceKey) {
      id
      key
      summary
      boardColumnId
      priority
      flagged
      storyPoints
      sprintId
      createdDate
      updatedDate
      assignee {
        id
        userName
      }
      reporter {
        id
        userName
      }
    }
  }
`;

export const UPDATE_WORK_ITEM = gql`
  mutation UpdateTaskStatus($itemId: UUID!, $boardColumnId: UUID!) {
    updateWorkItem(workItemId: $itemId, input: { boardColumnId: $boardColumnId }) {
      id
      boardColumnId
    }
  }
`;

export const CREATE_SPACE = gql`
  mutation CreateSpace($input: CreateSpaceInput!) {
    createSpace(input: $input) {
      id
      name
      key
      type
    }
  }
`;

export const CREATE_SPRINT = gql`
  mutation CreateSprint($input: CreateSprintInput!) {
    createSprint(input: $input) {
      id
      name
      status
    }
  }
`;

export const CREATE_WORK_ITEM = gql`
  mutation CreateWorkItem($input: CreateWorkItemInput!) {
    createWorkItem(input: $input) {
      id
      key
      summary
      boardColumnId
    }
  }
`;

export const INVITE_USER_TO_SPACE = gql`
  mutation InviteUser($input: InviteUserInput!) {
    inviteUserToSpace(input: $input) {
      role
      user {
        userName
      }
    }
  }
`;

export const UPDATE_SPRINT = gql`
  mutation UpdateSprint($sprintId: UUID!, $input: UpdateSprintInput!) {
    updateSprint(sprintId: $sprintId, input: $input) {
      id
      name
      status
      startDate
      endDate
      goal
    }
  }
`;

export const DELETE_SPRINT = gql`
  mutation DeleteSprint($sprintId: UUID!) {
    deleteSprint(sprintId: $sprintId) {
      id
    }
  }
`;

export const START_SPRINT = gql`
  mutation StartSprint($sprintId: UUID!) {
    startSprint(sprintId: $sprintId) {
      id
      status
    }
  }
`;

export const COMPLETE_SPRINT = gql`
  mutation CompleteSprint($sprintId: UUID!) {
    completeSprint(sprintId: $sprintId) {
      id
      status
    }
  }
`;

export const DELETE_WORK_ITEM = gql`
  mutation DeleteWorkItem($itemId: UUID!) {
    deleteWorkItem(workItemId: $itemId) {
      id
    }
  }
`;

export const MOVE_WORK_ITEM = gql`
  mutation MoveWorkItem($itemId: UUID!, $sprintId: UUID, $moveToBacklog: Boolean) {
    updateWorkItem(workItemId: $itemId, input: { sprintId: $sprintId, moveToBacklog: $moveToBacklog }) {
      id
      sprintId
    }
  }
`;

export const UPDATE_WORK_ITEM_ASSIGNEE = gql`
  mutation UpdateWorkItemAssignee($itemId: UUID!, $assigneeId: UUID) {
    updateWorkItem(workItemId: $itemId, input: { assigneeId: $assigneeId }) {
      id
      assignee {
        id
        userName
      }
    }
  }
`;

export const TOGGLE_WORK_ITEM_FLAG = gql`
  mutation ToggleWorkItemFlag($itemId: UUID!, $flagged: Boolean!) {
    updateWorkItem(workItemId: $itemId, input: { flagged: $flagged }) {
      id
      flagged
    }
  }
`;

export const GET_WORK_ITEM_DETAILS = gql`
  query GetWorkItemDetails($id: UUID!) {
    workItem(id: $id) {
      id
      key
      summary
      description
      boardColumnId
      priority
      flagged
      storyPoints
      sprintId
      dueDate
      createdDate
      updatedDate
      assignee {
        id
        userName
      }
      reporter {
        id
        userName
      }
      comments {
        id
        content
        createdDate
        author {
          id
          userName
        }
      }
      subtasks {
        id
        key
        summary
        boardColumnId
        priority
      }
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($workItemId: UUID!, $content: String!) {
    addComment(workItemId: $workItemId, content: $content) {
      id
      content
      createdDate
      author {
        id
        userName
      }
    }
  }
`;

export const CREATE_SUBTASK = gql`
  mutation CreateSubtask($parentWorkItemId: UUID!, $input: CreateWorkItemInput!) {
    createSubtask(parentWorkItemId: $parentWorkItemId, input: $input) {
      id
      key
      summary
      boardColumnId
      priority
    }
  }
`;

export const UPDATE_WORK_ITEM_DETAILS = gql`
  mutation UpdateWorkItemDetails($itemId: UUID!, $input: UpdateWorkItemInput!) {
    updateWorkItem(workItemId: $itemId, input: $input) {
      id
      summary
      description
      storyPoints
      dueDate
      priority
      boardColumnId
      sprintId
      assignee {
        id
        userName
      }
    }
  }
`;

export const ADD_BOARD_COLUMN = gql`
  mutation AddBoardColumn($name: String!, $spaceId: UUID!) {
    addBoardColumn(name: $name, spaceId: $spaceId) {
      id
      name
      order
      isSystem
    }
  }
`;
export const SEARCH_WORK_ITEMS = gql`
  query SearchWorkItems($spaceKey: String!, $search: String) { # Removed ! to make it optional
    workItemsForSpace(spaceKey: $spaceKey) {
      id
      key
      summary
    }
  }
`;

export const SEARCH_EPICS = gql`
  query SearchEpics($spaceKey: String!) {
    workItemsForSpace(spaceKey: $spaceKey) {
      id
      key
      summary
      priority
    }
  }
`;