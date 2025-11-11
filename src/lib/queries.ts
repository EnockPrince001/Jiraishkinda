import { gql } from 'graphql-request';

export const GET_ME = gql`
  query {
    getMe {
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
    }
  }
`;

export const GET_WORK_ITEMS = gql`
  query GetWorkItems($spaceKey: String!) {
    workItemsForSpace(spaceKey: $spaceKey) {
      id
      key
      summary
      status
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
  mutation UpdateTaskStatus($itemId: UUID!, $newStatus: WorkItemStatus!) {
    updateWorkItem(workItemId: $itemId, input: { status: $newStatus }) {
      id
      status
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
      status
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
