# @shopify/hydrogen

## 2024.0.0

### Major Changes

- Releases 2023-04 ([#797](https://github.com/Shopify/hydrogen/pull/797)) by [@github-actions](https://github.com/apps/github-actions)

- Adds a new `Image` component, replacing the existing one. While your existing implementation won't break, props `widths` and `loaderOptions` are now deprecated disregarded, with a new `aspectRatio` prop added. ([#787](https://github.com/Shopify/hydrogen/pull/787)) by [@benjaminsehl](https://github.com/benjaminsehl)

  ### Migrating to the new `Image`

  The new `Image` component is responsive by default, and requires less configuration to ensure the right image size is being rendered on all screen sizes.

  **Before**

  ```jsx
  <Image
    data={image}
    widths={[400, 800, 1200]}
    width="100px"
    sizes="90vw"
    loaderOptions={{
      scale: 2,
      crop: 'left',
    }}
  />
  ```

  **After**

  ```jsx
  <Image data={image} sizes="90vw" crop="left" aspectRatio="3/2" />
  ```

  Note that `widths` and `loaderOptions` have now been deprecated, declaring `width` is no longer necessary, and we’ve added an `aspectRatio` prop:

  - `widths` is now calculated automatically based on a new `srcSetOptions` prop (see below for details).
  - `loaderOptions` has been removed in favour of declaring `crop` and `src` as props. `width` and `height` should only be set as props if rendering a fixed image size, with `width` otherwise defaulting to `100%`, and the loader calculating each dynamically.
  - `aspectRatio` is calculated automatically using `data.width` and `data.height` (if available) — but if you want to present an image with an aspect ratio other than what was uploaded, you can set using the format `Int/Int` (e.g. `3/2`, [see MDN docs for more info](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio), note that you must use the _fraction_ style of declaring aspect ratio, decimals are not supported); if you've set an `aspectRatio`, we will default the crop to be `crop: center` (in the example above we've specified this to use `left` instead).

  ### Examples

  <!-- Simplest possible usage -->

  #### Basic Usage

  ```jsx
  <Image data={data} />
  ```

  This would use all default props, which if exhaustively declared would be the same as typing:

  ```jsx
  <Image
    data={data}
    crop="center"
    decoding="async"
    loading="lazy"
    width="100%"
    sizes="100vw"
    srcSetOptions={{
      interval: 15,
      startingWidth: 200,
      incrementSize: 200,
      placeholderWidth: 100,
    }}
  />
  ```

  An alternative way to write this without using `data` would be to use the `src`, `alt`, and `aspectRatio` props. For example:

  ```jsx
  <Image
    src={data.url}
    alt={data.altText}
    aspectRatio={`${data.width}/${data.height}`}
  />
  ```

  Assuming `data` had the following shape:

  ```json
  {
    "url": "https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg",
    "altText": "alt text",
    "width": "4000",
    "height": "4000"
  }
  ```

  All three above examples would result in the following HTML:

  ```html
  <img
    srcset="https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=300&height=300&crop=center 300w, … *13 additional sizes* … https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=3000&height=3000&crop=center 3000w"
    src="https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=100&height=100&crop=center"
    alt="alt text"
    sizes="100vw"
    loading="lazy"
    decoding="async"
    width="100px"
    height="100px"
    style="aspect-ratio: 4000 / 4000;"
  />
  ```

  #### Fixed-size Images

  When using images that are meant to be a fixed size, like showing a preview image of a product in the cart, instead of using `aspectRatio`, you'll instead declare `width` and `height` manually with fixed values. For example:

  ```jsx
  <Image data={data} width={80} height={80} />
  ```

  Instead of generating 15 images for a broad range of screen sizes, `Image` will instead only generate 3, for various screen pixel densities (1x, 2x, and 3x). The above example would result in the following HTML:

  ```html
  <img
    srcset="
      https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=80&height=80&crop=center   1x,
      https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=160&height=160&crop=center 2x,
      https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=240&height=240&crop=center 3x
    "
    src="https://cdn.shopify.com/s/files/1/0551/4566/0472/products/Main.jpg?width=80&height=80"
    alt="alt text"
    loading="lazy"
    width="80px"
    height="80px"
    style="aspect-ratio: 80 / 80;"
  />
  ```

  If you don't want to have a fixed aspect ratio, and instead respect whatever is returned from your query, the following syntax can also be used:

  ```jsx
  <Image data={data} width="5rem" />
  ```

  Which would result in the same HTML as above, however the generated URLs inside the `src` and `srcset` attributes would not have `height` or `crop` parameters appended to them, and the generated `aspect-ratio` in `style` would be `4000 / 4000` (if using the same `data` values as our original example).

  #### Custom Loaders

  If your image isn't coming from the Storefront API, but you still want to take advantage of the `Image` component, you can pass a custom `loader` prop, provided the CDN you're working with supports URL-based transformations.

  The `loader` is a function which expects a `params` argument of the following type:

  ```ts
  type LoaderParams = {
    /** The base URL of the image */
    src?: ImageType['url'];
    /** The URL param that controls width */
    width?: number;
    /** The URL param that controls height */
    height?: number;
    /** The URL param that controls the cropping region */
    crop?: Crop;
  };
  ```

  Here is an example of using `Image` with a custom loader function:

  ```jsx
  const customLoader = ({src, width, height, crop}) => {
    return `${src}?w=${width}&h=${height}&gravity=${crop}`;
  };

  export default function CustomImage(props) {
    <Image loader={customLoader} {...props} />;
  }

  // In Use:

  <CustomImage data={customCDNImageData} />;
  ```

  If your CDN happens to support the same semantics as Shopify (URL params of `width`, `height`, and `crop`) — the default loader will work a non-Shopify `src` attribute.

  An example output might look like: `https://mycdn.com/image.jpeg?width=100&height=100&crop=center`

  ### Additional changes

  - Added the `srcSetOptions` prop used to create the image URLs used in `srcset`. It’s an object with the following keys and defaults:

    ```js
    srcSetOptions = {
      intervals: 15, // The number of sizes to generate
      startingWidth: 200, // The smalles image size
      incrementSize: 200, // The increment by to increase for each size, in pixesl
      placeholderWidth: 100, // The size used for placeholder fallback images
    };
    ```

  - Added an export for `IMAGE_FRAGMENT`, which can be imported from Hydrogen and used in any Storefront API query, which will fetch the required fields needed by the component.

  - Added an export for `shopifyLoader` for using Storefront API responses in conjunction with alternative frameworks that already have their own `Image` component, like Next.js

### Patch Changes

- Updated dependencies [[`82b6af7`](https://github.com/Shopify/hydrogen/commit/82b6af71cafe1f88c24630178e61cd09e5a59f5e), [`361879e`](https://github.com/Shopify/hydrogen/commit/361879ee11dfe8f1ee916b022165b1e7f0e45964)]:
  - @shopify/hydrogen-react@2024.0.0

## 2023.1.7

### Patch Changes

- Bump internal Remix dependencies to 1.15.0. ([#728](https://github.com/Shopify/hydrogen/pull/728)) by [@wizardlyhel](https://github.com/wizardlyhel)

  Recommendations to follow:

  - Upgrade all the Remix packages in your app to 1.15.0.
  - Enable Remix v2 future flags at your earliest convenience following [the official guide](https://remix.run/docs/en/1.15.0/pages/v2).

- Add an experimental `createWithCache_unstable` utility, which creates a function similar to `useQuery` from Hydrogen v1. Use this utility to query third-party APIs and apply custom cache options. ([#600](https://github.com/Shopify/hydrogen/pull/600)) by [@frandiox](https://github.com/frandiox)

  To setup the utility, update your `server.ts`:

  ```js
  import {
    createStorefrontClient,
    createWithCache_unstable,
    CacheLong,
  } from '@shopify/hydrogen';

  // ...

    const cache = await caches.open('hydrogen');
    const withCache = createWithCache_unstable({cache, waitUntil});

    // Create custom utilities to query third-party APIs:
    const fetchMyCMS = (query) => {
      // Prefix the cache key and make it unique based on arguments.
      return withCache(['my-cms', query], CacheLong(), () => {
        const cmsData = await (await fetch('my-cms.com/api', {
          method: 'POST',
          body: query
        })).json();

        const nextPage = (await fetch('my-cms.com/api', {
          method: 'POST',
          body: cmsData1.nextPageQuery,
        })).json();

        return {...cmsData, nextPage}
      });
    };

    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => ({
        session,
        waitUntil,
        storefront,
        env,
        fetchMyCMS,
      }),
    });
  ```

  **Note:** The utility is unstable and subject to change before stabalizing in the 2023.04 release.

- Updated dependencies [[`85ae63a`](https://github.com/Shopify/hydrogen/commit/85ae63ac37e5c4200919d8ae6c861c60effb4ded), [`5e26503`](https://github.com/Shopify/hydrogen/commit/5e2650374441fb5ae4840215fefdd5d547a378c0)]:
  - @shopify/hydrogen-react@2023.1.8

## 2023.1.6

### Patch Changes

- Add new `loader` API for setting seo tags within route module ([#591](https://github.com/Shopify/hydrogen/pull/591)) by [@cartogram](https://github.com/cartogram)

- `ShopPayButton` component now can receive a `storeDomain`. The component now does not require `ShopifyProvider`. ([#645](https://github.com/Shopify/hydrogen/pull/645)) by [@lordofthecactus](https://github.com/lordofthecactus)

- 1. Update Remix to 1.14.0 ([#599](https://github.com/Shopify/hydrogen/pull/599)) by [@blittle](https://github.com/blittle)

  1. Add `Cache-Control` defaults to all the demo store routes

- Added `robots` option to SEO config that allows users granular control over the robots meta tag. This can be set on both a global and per-page basis using the handle.seo property. ([#572](https://github.com/Shopify/hydrogen/pull/572)) by [@cartogram](https://github.com/cartogram)

  Example:

  ```ts
  export handle = {
    seo: {
      robots: {
        noIndex: false,
        noFollow: false,
      }
    }
  }
  ```

- Fix active cart session event in Live View ([#614](https://github.com/Shopify/hydrogen/pull/614)) by [@wizardlyhel](https://github.com/wizardlyhel)

  Introducing `getStorefrontHeaders` that collects the required Shopify headers for making a
  Storefront API call.

  - Make cart constants available as exports from `@shopify/hydrogen-react`
  - Deprecating `buyerIp` and `requestGroupId` props from `createStorefrontClient` from `@shopify/hydrogen`
  - Deprecating `getBuyerIp` function from `@shopify/remix-oxygen`

  ```diff
  + import {getStorefrontHeaders} from '@shopify/remix-oxygen';
  import {createStorefrontClient, storefrontRedirect} from '@shopify/hydrogen';

  export default {
    async fetch(
      request: Request,
      env: Env,
      executionContext: ExecutionContext,
    ): Promise<Response> {

      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
  -     buyerIp: getBuyerIp(request),
        i18n: {language: 'EN', country: 'US'},
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: `https://${env.PUBLIC_STORE_DOMAIN}`,
        storefrontApiVersion: env.PUBLIC_STOREFRONT_API_VERSION || '2023-01',
        storefrontId: env.PUBLIC_STOREFRONT_ID,
  -     requestGroupId: request.headers.get('request-id'),
  +     storefrontHeaders: getStorefrontHeaders(request),
      });
  ```

- Updated dependencies [[`c78f441`](https://github.com/Shopify/hydrogen/commit/c78f4410cccaf99d93b2a4e4fbd877fcaa2c1bce), [`7fca5d5`](https://github.com/Shopify/hydrogen/commit/7fca5d569be1d6749fdfa5ada6723d8186f0d775)]:
  - @shopify/hydrogen-react@2023.1.7

## 2023.1.5

### Patch Changes

- Fix the latest tag ([#562](https://github.com/Shopify/hydrogen/pull/562)) by [@blittle](https://github.com/blittle)

## 2023.1.4

### Patch Changes

- Fix template imports to only reference `@shopify/hydrogen`, not `@shopify/hydrogen-react` ([#523](https://github.com/Shopify/hydrogen/pull/523)) by [@blittle](https://github.com/blittle)

## 2023.1.3

### Patch Changes

- Send Hydrogen version in Storefront API requests. ([#471](https://github.com/Shopify/hydrogen/pull/471)) by [@frandiox](https://github.com/frandiox)

- Fix default Storefront type in LoaderArgs. ([#496](https://github.com/Shopify/hydrogen/pull/496)) by [@frandiox](https://github.com/frandiox)

## 2023.1.2

### Patch Changes

- Add license files and readmes for all packages ([#463](https://github.com/Shopify/hydrogen/pull/463)) by [@blittle](https://github.com/blittle)

## 2023.1.1

### Patch Changes

- Initial release
