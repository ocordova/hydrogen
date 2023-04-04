import {gql} from 'graphql-request';

export const LinkStorefrontQuery = gql`
  query LinkStorefront {
    hydrogenStorefronts {
      id
      title
      productionUrl
    }
  }
`;

interface HydrogenStorefront {
  id: string;
  title: string;
  productionUrl: string;
}

export interface LinkStorefrontSchema {
  hydrogenStorefronts: HydrogenStorefront[];
}
