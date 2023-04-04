import Command from '@shopify/cli-kit/node/base-command';
import {
  renderConfirmationPrompt,
  renderSelectPrompt,
  renderWarning,
} from '@shopify/cli-kit/node/ui';
import {outputInfo, outputSuccess} from '@shopify/cli-kit/node/output';

import {adminRequest, parseGid} from '../../lib/graphql.js';
import {commonFlags} from '../../lib/flags.js';
import {getHydrogenShop} from '../../lib/shop.js';
import {getAdminSession} from '../../lib/admin-session.js';
import {hydrogenStorefrontUrl} from '../../lib/admin-urls.js';
import {
  LinkStorefrontQuery,
  LinkStorefrontSchema,
} from '../../lib/graphql/admin/link-storefront.js';
import {getConfig, setStorefront} from '../../lib/shopify-config.js';
import {missingStorefronts} from '../../lib/missing-storefronts.js';

export default class Link extends Command {
  static description =
    "Link your local development to one of your shop's Hydrogen storefronts.";

  static hidden = true;

  static flags = {
    force: commonFlags.force,
    path: commonFlags.path,
    shop: commonFlags.shop,
    storefront: commonFlags.hydrogenStorefront,
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Link);
    await linkStorefront(flags);
  }
}

export interface LinkFlags {
  force?: boolean;
  path?: string;
  shop?: string;
  storefront?: string;
}

export async function linkStorefront({
  force,
  path,
  shop: flagShop,
  storefront: flagStorefront,
}: LinkFlags) {
  const shop = await getHydrogenShop({path, shop: flagShop});
  const {storefront: configStorefront} = await getConfig(path ?? process.cwd());

  if (configStorefront && !force) {
    const overwriteLink = await renderConfirmationPrompt({
      message: `${configStorefront.title} is currently linked to your local environment. Do you want to change storefronts?`,
    });

    if (!overwriteLink) {
      return;
    }
  }

  const adminSession = await getAdminSession(shop);

  const result: LinkStorefrontSchema = await adminRequest(
    LinkStorefrontQuery,
    adminSession,
  );

  if (!result.hydrogenStorefronts.length) {
    missingStorefronts(adminSession);
    return;
  }

  let selectedStorefront;

  if (flagStorefront) {
    selectedStorefront = result.hydrogenStorefronts.find(
      (storefront) => storefront.title === flagStorefront,
    );

    if (!selectedStorefront) {
      renderWarning({
        headline: 'Failed to link to storefront',
        body: `There were no storefront matching ${flagStorefront} on your ${shop} shop. Run LIST to see available storefronts.`,
      });

      return;
    }
  } else {
    const choices = result.hydrogenStorefronts.map((storefront) => ({
      label: `${storefront.title} ${storefront.productionUrl}${
        storefront.id === configStorefront?.id ? ' (Current)' : ''
      }`,
      value: storefront.id,
    }));

    const storefrontId = await renderSelectPrompt({
      message: `Choose a storefront to link your local development to:`,
      choices,
      defaultValue: 'true',
    });

    selectedStorefront = result.hydrogenStorefronts.find(
      (storefront) => storefront.id === storefrontId,
    );
  }

  if (!selectedStorefront) {
    return;
  }

  await setStorefront(path ?? process.cwd(), selectedStorefront);

  outputSuccess(`Linked to ${selectedStorefront.title}`);
  outputInfo(
    `Admin URL: ${hydrogenStorefrontUrl(
      adminSession,
      parseGid(selectedStorefront.id),
    )}`,
  );
  outputInfo(`Site URL: ${selectedStorefront.productionUrl}`);
}
