// TODO: aren't those type available in the redstone-node lib?
export type PriceDataType = {
  symbols: string[],
  values: number[],
  timestamp: number
};

export type SignedPriceDataType = {
  priceData: PriceDataType,
  signer: string,
  signature: string,
  liteSignature: string
};

export interface PriceFeedConnector {
  getSignedPrice(): Promise<SignedPriceDataType>;
  getSigner(): Promise<string>
}
