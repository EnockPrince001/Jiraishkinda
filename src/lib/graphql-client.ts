import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'https://localhost:7151/graphql';
console.log("GRAPHQL ENDPOINT:", GRAPHQL_ENDPOINT);
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
