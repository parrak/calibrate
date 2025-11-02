/**
 * Shopify Sync Route
 * Handles manual synchronization triggers
 */
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';
import { ConnectorRegistry, NormalizedProduct } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * Save a normalized product from Shopify to the database
 */
async function saveProductToDatabase(
  normalizedProduct: NormalizedProduct,
  tenantId: string,
  projectId: string
): Promise<void> {
  // Validate required fields
  if (!normalizedProduct.externalId) {
    throw new Error('Product externalId is required');
  }
  if (!normalizedProduct.title) {
    throw new Error('Product title is required');
  }
  if (!tenantId || !projectId) {
    throw new Error('tenantId and projectId are required');
  }

  // Use Shopify product ID as the product code (or handle if available)
  // Fall back to externalId if no better identifier
  const productCode = normalizedProduct.metadata?.shopifyHandle 
    || `SHOPIFY-${normalizedProduct.externalId}`;
  
  // Create or update the Product
  const product = await prisma().product.upsert({
    where: {
      tenantId_projectId_code: {
        tenantId,
        projectId,
        code: productCode,
      },
    },
    update: {
      name: normalizedProduct.title,
      status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
    },
    create: {
      tenantId,
      projectId,
      code: productCode,
      name: normalizedProduct.title,
      status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
    },
  });

  // Handle products with no variants - create a default SKU
  if (!normalizedProduct.variants || normalizedProduct.variants.length === 0) {
    // Create a default SKU for products without variants
    const defaultSkuCode = `DEFAULT-${normalizedProduct.externalId}`;
    await prisma().sku.upsert({
      where: {
        productId_code: {
          productId: product.id,
          code: defaultSkuCode,
        },
      },
      update: {
        name: normalizedProduct.title,
        status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
      },
      create: {
        productId: product.id,
        code: defaultSkuCode,
        name: normalizedProduct.title,
        status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
        attributes: {
          externalId: normalizedProduct.externalId,
        },
      },
    });
    return; // Exit early if no variants
  }

  // Save each variant as a SKU
  for (const variant of normalizedProduct.variants) {
    // Validate variant
    if (!variant.externalId) {
      console.warn(`Skipping variant without externalId for product ${productCode}`);
      continue;
    }

    // Use SKU from variant, or fall back to variant externalId
    const skuCode = variant.sku || `VARIANT-${variant.externalId}`;
    
    // Create or update the SKU
    const sku = await prisma().sku.upsert({
      where: {
        productId_code: {
          productId: product.id,
          code: skuCode,
        },
      },
      update: {
        name: variant.title || product.name,
        status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
        attributes: {
          externalId: variant.externalId,
          ...(variant.options || {}),
          ...(variant.metadata || {}),
        },
      },
      create: {
        productId: product.id,
        code: skuCode,
        name: variant.title || product.name,
        status: normalizedProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
        attributes: {
          externalId: variant.externalId,
          ...(variant.options || {}),
          ...(variant.metadata || {}),
        },
      },
    });

    // Save the price (even if 0, some products might have free variants)
    if (variant.price !== undefined && variant.price !== null) {
      await prisma().price.upsert({
        where: {
          skuId_currency: {
            skuId: sku.id,
            currency: variant.currency || 'USD',
          },
        },
        update: {
          amount: variant.price,
          status: 'ACTIVE',
        },
        create: {
          skuId: sku.id,
          currency: variant.currency || 'USD',
          amount: variant.price,
          status: 'ACTIVE',
        },
      });
    }
  }
}

/**
 * POST /api/platforms/shopify/sync
 * 
 * Trigger manual synchronization
 */
export const POST = withSecurity(async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    let projectId = body?.projectId;
    const projectSlug = body?.projectSlug;
    const syncType = body?.syncType || 'full';

    // If projectSlug is provided, resolve it to projectId
    if (projectSlug && !projectId) {
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      projectId = project.id;
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId or projectSlug parameter' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Update sync status to in progress
    await prisma().shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'SYNCING',
        syncError: null,
      },
    });

    // Create sync log entry - PlatformSyncLog model doesn't exist yet
    // TODO: Create PlatformSyncLog model or use alternative storage
    let syncLog: any = null;
    try {
      syncLog = await (prisma() as any).platformSyncLog?.create({
        data: {
          integrationId: integration.id,
          syncType,
          status: 'SYNCING',
          startedAt: new Date(),
        },
      });
    } catch (err) {
      // Model doesn't exist yet - this is expected
      console.log('PlatformSyncLog model not available, sync will proceed without logging');
    }

    try {
      // Validate environment variables
      if (!process.env.SHOPIFY_API_KEY) {
        throw new Error('SHOPIFY_API_KEY environment variable is not set');
      }
      if (!process.env.SHOPIFY_API_SECRET) {
        throw new Error('SHOPIFY_API_SECRET environment variable is not set');
      }

      // Get connector configuration
      const config = {
        platform: 'shopify' as const,
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
        apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
      };

      // Validate integration credentials
      if (!integration.shopDomain || !integration.accessToken) {
        throw new Error('Shopify integration is missing required credentials (shopDomain or accessToken)');
      }

      // Create connector with stored credentials
      const credentials = {
        platform: 'shopify' as const,
        shopDomain: integration.shopDomain,
        accessToken: integration.accessToken,
        scope: integration.scope,
      };

      const connector = await ConnectorRegistry.createConnector('shopify', config);
      await connector.initialize(credentials);

      // Verify connector is properly initialized
      const isAuthenticated = await connector.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate with Shopify. Please reconnect your integration.');
      }

      // Get project to access tenantId for saving products
      const project = await prisma().project.findUnique({
        where: { id: projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Shopify REST API maximum limit is 250 per request
      // We'll use pagination to fetch more products in batches
      const SHOPIFY_MAX_LIMIT = 250;

      // Instead of using syncAll which fetches products again, we'll list products directly
      // and save them immediately for better efficiency
      let syncResults: any[] = [];
      let summary = { total: 0, successful: 0, failed: 0 };
      let savedCount = 0;
      let saveErrors: string[] = [];
      
      // Prepare filter based on sync type
      let listFilter: any = { limit: SHOPIFY_MAX_LIMIT };
      if (syncType === 'incremental') {
        listFilter.updatedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      // Fetch and save products in batches using pagination
      let hasMore = true;
      let sinceId: string | undefined = undefined;
      let pageCount = 0;
      
      while (hasMore) {
        try {
          const listFilterWithPagination = { ...listFilter };
          if (sinceId) {
            (listFilterWithPagination as any).sinceId = sinceId;
          }
          
          const response = await connector.productOperations.list(listFilterWithPagination);
          pageCount++;
          
          // Save each product immediately
          for (const product of response.data) {
            try {
              // Validate product before saving
              if (!product.externalId) {
                console.warn(`Skipping product without externalId:`, product);
                continue;
              }
              
              // Save product to database
              await saveProductToDatabase(product, project.tenantId, projectId);
              
              // Record successful sync
              syncResults.push({
                productId: `cal-${product.externalId}`,
                externalId: product.externalId,
                platform: 'shopify',
                success: true,
                syncedAt: new Date(),
              });
              savedCount++;
              
              if (savedCount % 10 === 0) {
                console.log(`Saved ${savedCount} products so far...`);
              }
            } catch (err) {
              const errorMsg = `Failed to save product ${product.externalId || 'unknown'}: ${err instanceof Error ? err.message : 'Unknown error'}`;
              console.error(errorMsg, err);
              saveErrors.push(errorMsg);
              
              // Record failed sync
              syncResults.push({
                productId: `cal-${product.externalId || 'unknown'}`,
                externalId: product.externalId || 'unknown',
                platform: 'shopify',
                success: false,
                error: errorMsg,
                syncedAt: new Date(),
              });
            }
          }
          
          // Check if there are more pages
          hasMore = response.pagination.hasNext;
          if (response.pagination.nextCursor) {
            sinceId = response.pagination.nextCursor;
          } else if (response.data.length > 0) {
            // Fallback: use last product's external ID
            const lastProduct = response.data[response.data.length - 1];
            sinceId = lastProduct.externalId;
          } else {
            hasMore = false;
          }
          
          // Prevent infinite loops
          if (pageCount > 1000) {
            console.warn('Reached maximum page limit (1000), stopping pagination');
            hasMore = false;
          }
        } catch (err) {
          console.error(`Error during product listing/saving (page ${pageCount}):`, err);
          hasMore = false;
          // Add error to results
          syncResults.push({
            productId: 'unknown',
            externalId: 'unknown',
            platform: 'shopify',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            syncedAt: new Date(),
          });
        }
      }
      
      // Calculate summary
      summary = {
        total: syncResults.length,
        successful: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length,
      };
      
      console.log(`Sync completed: ${summary.successful} successful, ${summary.failed} failed`);
      console.log(`Saved ${savedCount} products to database`);
      if (saveErrors.length > 0) {
        console.error(`Failed to save ${saveErrors.length} products:`, saveErrors.slice(0, 5)); // Log first 5 errors
      }

      // Update sync log with results
      if (syncLog?.id) {
        try {
          await (prisma() as any).platformSyncLog?.update({
            where: { id: syncLog.id },
            data: {
              status: summary.failed === 0 ? 'SUCCESS' : 'PARTIAL',
              completedAt: new Date(),
              itemsProcessed: summary.total,
              itemsSuccessful: summary.successful,
              itemsFailed: summary.failed,
              errors: summary.failed > 0 ? syncResults.filter(r => !r.success).map(r => r.error).filter(Boolean) : null,
            },
          });
        } catch (err) {
          console.log('Could not update sync log:', err);
        }
      }

      // Update integration status with summary information
      const finalStatus = summary.failed === 0 ? 'SUCCESS' : 'PARTIAL';
      
      // Store summary in syncError field in a parseable format
      // Format: "SUMMARY: total=X, successful=Y, failed=Z" for both success and partial
      // This allows us to extract summary information for display in sync history
      const summaryText = `SUMMARY: total=${summary.total}, successful=${summary.successful}, failed=${summary.failed}`;
      const syncErrorMsg = summary.failed > 0 
        ? `${summary.failed} items failed to sync (${summary.successful} successful, ${summary.total} total). ${summaryText}`
        : summaryText; // Store summary even for successful syncs
      
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: finalStatus,
          syncError: syncErrorMsg,
        },
      });

      return NextResponse.json({
        success: true,
        syncType,
        summary,
        syncLogId: syncLog?.id || null,
        message: `Sync completed: ${summary.successful}/${summary.total} items processed successfully`,
      });
    } catch (error) {
      // Extract detailed error message
      let errorMessage = 'Unknown error';
      let errorDetails: any = null;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          stack: error.stack,
          // Include additional properties if available
          ...(error as any).statusCode && { statusCode: (error as any).statusCode },
          ...(error as any).responseData && { responseData: (error as any).responseData },
        };
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || JSON.stringify(error);
        errorDetails = error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      const statusCode = errorDetails?.statusCode || (error instanceof Error && (error as any).statusCode);
      const isAuthError = statusCode === 401 || errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('unauthorized');

      // Provide helpful message for authentication errors
      if (isAuthError) {
        errorMessage = 'Shopify authentication failed. The access token may be invalid or expired. Please reconnect your Shopify integration.';
      }

      console.error('Shopify sync error details:', {
        errorMessage,
        errorDetails,
        integrationId: integration.id,
        shopDomain: integration.shopDomain,
        statusCode,
        isAuthError,
      });

      // Update sync log with error
      if (syncLog?.id) {
        try {
          await (prisma() as any).platformSyncLog?.update({
            where: { id: syncLog.id },
            data: {
              status: 'ERROR',
              completedAt: new Date(),
              errors: [errorMessage],
            },
          });
        } catch (err) {
          console.log('Could not update sync log with error:', err);
        }
      }

      // Update integration status - mark as needing re-authentication for 401 errors
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'ERROR',
          syncError: errorMessage,
          // Mark as inactive if authentication failed, so user knows to reconnect
          ...(isAuthError && { isActive: false }),
        },
      });

      // Re-throw with better error message
      const syncError = new Error(`Shopify sync failed: ${errorMessage}`);
      if (errorDetails) {
        (syncError as any).details = errorDetails;
      }
      throw syncError;
    }
  } catch (error) {
    console.error('Shopify sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Shopify data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/platforms/shopify/sync/status
 * 
 * Get sync status and history
 */
export const GET = withSecurity(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let projectId = searchParams.get('projectId');
    const projectSlug = searchParams.get('projectSlug');

    // If projectSlug is provided, resolve it to projectId
    if (projectSlug && !projectId) {
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      projectId = project.id;
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId or projectSlug parameter' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Get recent sync logs - PlatformSyncLog model doesn't exist yet, so return empty array
    // TODO: Create PlatformSyncLog model or use alternative storage
    const syncLogs: any[] = [];
    
    // Try to query sync logs if model exists, catch error gracefully
    try {
      // This will fail if model doesn't exist, but we'll catch it
      const logs = await (prisma() as any).platformSyncLog?.findMany({
        where: { integrationId: integration.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }) || [];
      syncLogs.push(...logs);
    } catch (err) {
      // Model doesn't exist yet - this is expected
      console.log('PlatformSyncLog model not available, returning empty logs');
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platformName: integration.shopDomain,
        status: integration.isActive ? 'CONNECTED' : 'DISCONNECTED',
        syncStatus: integration.syncStatus,
        lastSyncAt: integration.lastSyncAt?.toISOString() || null,
        syncError: integration.syncError,
      },
      syncLogs: syncLogs.map(log => ({
        id: log.id,
        syncType: log.syncType,
        status: log.status,
        startedAt: log.startedAt?.toISOString() || new Date().toISOString(),
        completedAt: log.completedAt?.toISOString() || null,
        itemsProcessed: log.itemsProcessed || 0,
        itemsSuccessful: log.itemsSuccessful || 0,
        itemsFailed: log.itemsFailed || 0,
        errors: log.errors || null,
      })),
    });
  } catch (error) {
    console.error('Shopify sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
});
