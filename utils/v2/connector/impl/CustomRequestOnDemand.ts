import {
  SignedPriceDataType,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { PriceFeedConnector } from "../PriceFeedConnector";
import axios from "axios";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";

export interface CustomRequestDetails {
  url: string;
  jsonpath: string;
  expectedSymbol: string;
};

export interface CustomRequestOnDemandOptions {
  nodes: string[];
  customRequestDetails: CustomRequestDetails;
};

export class CustomRequestOnDemand implements PriceFeedConnector {

  constructor(private opts: CustomRequestOnDemandOptions) {}

  // This is the entrypoint function of this module
  async getSignedPrice(): Promise<SignedPriceDataType> {
    const nodeUrl = `${this.opts.nodes[0]}/custom-url-requests`;
    const response = await axios.get(nodeUrl, {
      params: {
        "custom-url-request-config-base64": toBase64(JSON.stringify({
          url: this.opts.customRequestDetails.url,
          jsonpath: this.opts.customRequestDetails.jsonpath,
        })),
      },
    });

    // Validating response
    const { liteSignature, prices } = response.data;
    const symbol = prices[0].symbol;
    const expectedSymbol = this.opts.customRequestDetails.expectedSymbol;
    if (symbol !== expectedSymbol) {
      throw new Error(
        `Expected symbol (${expectedSymbol}) and received symbol (${symbol}) do not match`
      );
    }

    // Prepare result in the correct format
    const priceSigner = new EvmPriceSigner();
    const serialized = priceSigner.serializeToMessage(response.data);
    const signedPriceData: SignedPriceDataType = {
      priceData: serialized,
      signature: "",
      liteSignature,
    };

    return signedPriceData;
  }

  getDefaultSigner(): string {
    // Evm address of the default node for on-demand custom requests
    return "0x63b3Cc527bFD6e060EB65d4e902667Ae19aEcEC2";
  }
}

function toBase64(str: string): string {
  const buff = Buffer.from(str, "utf-8");
  return buff.toString("base64");
}

