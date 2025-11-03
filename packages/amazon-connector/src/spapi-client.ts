/// <reference path="./shims.d.ts" />
import SellingPartner from 'selling-partner-api'

export type AmazonRegion = 'na' | 'eu' | 'fe'

export interface AmazonConnectorConfig {
  region?: AmazonRegion
  marketplaceId?: string
  sellerId?: string
  refreshToken?: string
  lwaClientId?: string
  lwaClientSecret?: string
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  roleArn?: string
}

export function loadConfigFromEnv(): AmazonConnectorConfig {
  return {
    region: (process.env.AMAZON_REGION as AmazonRegion) || 'na',
    marketplaceId: process.env.AMAZON_MARKETPLACE_ID,
    sellerId: process.env.AMAZON_SELLER_ID,
    refreshToken: process.env.AMAZON_REFRESH_TOKEN,
    lwaClientId: process.env.AMAZON_CLIENT_ID || process.env.SELLING_PARTNER_APP_CLIENT_ID,
    lwaClientSecret: process.env.AMAZON_CLIENT_SECRET || process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    roleArn: process.env.AWS_SELLING_PARTNER_ROLE || process.env.AWS_ROLE_ARN,
  }
}

export function createSpApiClient(partial?: AmazonConnectorConfig): any | null {
  const cfg = { ...loadConfigFromEnv(), ...partial }

  if (!cfg.lwaClientId || !cfg.lwaClientSecret) {
    return null
  }

  try {
    const sp = new SellingPartner({
      region: cfg.region || 'na',
      refresh_token: cfg.refreshToken,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: cfg.lwaClientId!,
        SELLING_PARTNER_APP_CLIENT_SECRET: cfg.lwaClientSecret!,
        AWS_ACCESS_KEY_ID: cfg.awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: cfg.awsSecretAccessKey,
        AWS_SELLING_PARTNER_ROLE: cfg.roleArn,
      },
    })
    return sp
  } catch {
    return null
  }
}

