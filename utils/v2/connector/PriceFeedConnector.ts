// TODO: aren't those type available in the redstone-node lib?
export type PriceDataType = {
  symbols: string[],
  values: number[],
  timestamp: number
};

export type SignedPriceDataType = {
  priceData: PriceDataType,
  signer: string,
  signature: string
};

export interface PriceFeedConnector {
  getSignedPrice(asset?: string): Promise<SignedPriceDataType>;
}
