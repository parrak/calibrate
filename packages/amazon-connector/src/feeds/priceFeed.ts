export interface PriceFeedItem {
  sku: string
  price: number
  currency: string
}

export function buildPriceFeedXML(items: PriceFeedItem[]): string {
  const messages = items
    .map((it, idx) => `
    <Message>
      <MessageID>${idx + 1}</MessageID>
      <Price>
        <SKU>${escapeXml(it.sku)}</SKU>
        <StandardPrice currency="${escapeXml(it.currency)}">${it.price.toFixed(2)}</StandardPrice>
      </Price>
    </Message>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amznenvelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>Self</MerchantIdentifier>
  </Header>
  <MessageType>Price</MessageType>
  ${messages}
</AmazonEnvelope>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

