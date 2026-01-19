import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'https://worknestservicescore-c9gth7dwfxcddxc0.uaenorth-01.azurewebsites.net/graphql/';

export const getGraphQLClient = (token?: string) => {
  const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {},
  });
  return client;
};

export const graphqlClient = getGraphQLClient();
