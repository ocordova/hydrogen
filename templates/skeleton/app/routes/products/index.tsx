import {json, type LoaderArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {ProductConnection} from '@shopify/hydrogen/storefront-api-types';
import {
  Pagination,
  getPaginationVariables,
  PAGINATION_PAGE_INFO_FRAGMENT,
} from '~/components';
import {Link} from '@remix-run/react';

export async function loader({context, request}: LoaderArgs) {
  const variables = getPaginationVariables(request, 4);
  const {products} = await context.storefront.query<{
    products: ProductConnection;
  }>(PRODUCTS_QUERY, {
    variables: {
      ...variables,
      country: context.storefront.i18n?.country,
      language: context.storefront.i18n?.language,
    },
  });

  if (!products) {
    throw new Response(null, {status: 404});
  }

  return json({products});
}

export default function Products() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <>
      <Pagination connection={products} autoLoadOnScroll>
        {({
          endCursor,
          hasNextPage,
          hasPreviousPage,
          nextPageUrl,
          nodes,
          prevPageUrl,
          startCursor,
          nextLinkRef,
          isLoading,
        }) => {
          const itemsMarkup = nodes.map((product, i) => (
            <Link
              to={`/products/${product.handle}`}
              style={{
                fontWeight: 600,
                borderRadius: 4,
                color: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                border: '1px solid',
                margin: '50px 0',
                padding: 30,
                height: 500,
                flexDirection: 'column',
                background: `url(${product.variants?.nodes?.[0]?.image?.url}) no-repeat center white`,
                backgroundSize: 'contain',
              }}
              key={product.id}
            >
              {product.title}
            </Link>
          ));

          return (
            <>
              {hasPreviousPage && (
                <Link
                  preventScrollReset={true}
                  to={prevPageUrl}
                  prefetch="intent"
                  state={{
                    pageInfo: {
                      endCursor,
                      hasNextPage,
                      startCursor,
                      hasPreviousPage: undefined,
                    },
                    nodes,
                  }}
                >
                  {isLoading ? 'Loading...' : 'Previous'}
                </Link>
              )}
              {itemsMarkup}
              {hasNextPage && (
                <Link
                  preventScrollReset={true}
                  ref={nextLinkRef}
                  to={nextPageUrl}
                  prefetch="intent"
                  state={{
                    pageInfo: {
                      endCursor,
                      hasPreviousPage,
                      hasNextPage: undefined,
                      startCursor,
                    },
                    nodes,
                  }}
                >
                  {isLoading ? 'Loading...' : 'Next'}
                </Link>
              )}
            </>
          );
        }}
      </Pagination>
    </>
  );
}
const PRODUCTS_QUERY = `#graphql
  ${PAGINATION_PAGE_INFO_FRAGMENT}
  query (
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        id
        title
        publishedAt
        handle
        variants(first: 1) {
          nodes {
            id
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      pageInfo {
        ...PaginationPageInfoFragment
      }
    }
  }
`;
