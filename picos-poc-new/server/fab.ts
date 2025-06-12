import prodHierMap from '../coke-data/prodHierMap'
/**
 * Fetch a single product hierarchy record from a GraphQL API.
 *
 * Requirements
 *   • Runs in Node 20+ (native `fetch`) or any modern browser.
 *   • NO third-party packages required.
 *
 * Usage example
 *   const product = await fetchProductByName('Acme Widget L-5', {
 *     endpoint: 'https://api.example.com/graphql',
 *     token:   process.env.API_TOKEN              // optional
 *   });
 *   console.log(product?.l3DisplayName);
 */

export interface Product {
  productId:       string;
  l1DisplayName:   string;
  l2DisplayName:   string;
  l3DisplayName:   string;
  l4DisplayName:   string;
  l5DisplayName:   string;
}

interface FetchProductOptions {
  /** Full URL of the GraphQL endpoint */
  endpoint: string;
  /** Bearer token or other auth header (omit if not needed) */
  token?: string;
  /** Throw if nothing matched instead of returning null (default: false) */
  strict?: boolean;
}

/**
 * Fetch exactly one product hierarchy record whose l5DisplayName equals the
 * supplied `displayName`. Returns `null` when no match is found unless
 * `strict` is enabled.
 */
export async function fetchProductByName(
  displayName?: string
): Promise<Product | null> {
  if(!displayName) return null
  const mappedName = prodHierMap.find(f => f.Name === displayName)
  if(!mappedName) return null
  const endpoint = process.env.FAB_URL || '';
  const token = process.env.FAB_KEY || '';
  const strict = false;
  const queryName = 'getProductHierarchyFlattenedFilterList'
  // GraphQL query & variables ------------------------------------------------
  const QUERY = /* GraphQL */ `
    query getProdByName($displayName: String!) {
      ${queryName}(
        filter: { l5DisplayName: { EQ: $displayName } }
      ) {
        items {
          productId
          l1DisplayName
          l2DisplayName
          l3DisplayName
          l4DisplayName
          l5DisplayName
        }
      }
    }
  `;

  const variables = { displayName: mappedName.L5_Promoted_Group__c };

  // Build request -----------------------------------------------------------
  const headers: Record<string, string> = {
    'Content-Type': 'applkeyication/json',
    ...(token ? { 'X-Api-Key': token } : {})
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: QUERY, variables })
  });

  // Transport-level failure
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const body: any = await res.json();
  // GraphQL errors
  if (body.errors?.length) {
    const msg = body.errors.map((e: any) => e.message).join('; ');
    throw new Error(`GraphQL error: ${msg}`);
  }

  const items: Product[] = body.data?.[queryName]?.items ?? [];

  if (!items.length) {
    if (strict) throw new Error(`No product found for “${displayName}”`);
    return null;
  }

  // If more than one record somehow slips through, just return the first
  return items[0];
}

// SSD
// EWT
// JCE
// ACT
// ENG
// TEA
// BWT