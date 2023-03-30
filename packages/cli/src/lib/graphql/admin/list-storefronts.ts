import {gql} from 'graphql-request';

export const ListStorefrontsQuery = gql`
  query ListStorefronts {
    hydrogenStorefronts {
      id
      title
      productionUrl
      currentProductionDeployment {
        id
        createdAt
        commitMessage
      }
    }
  }
`;

export interface Deployment {
  id: string;
  createdAt: string;
  commitMessage: string | null;
}

interface HydrogenStorefront {
  id: string;
  title: string;
  productionUrl?: string;
  currentProductionDeployment: Deployment | null;
}

export interface ListStorefrontsSchema {
  hydrogenStorefronts: HydrogenStorefront[];
}
