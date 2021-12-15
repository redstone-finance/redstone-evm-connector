import { ethers } from "hardhat";
import { Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

import { SamplePriceAware } from "../../typechain/SamplePriceAware";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { syncTime, toBytes32 } from "../_helpers";
import { MockPriceFeed } from "../../utils/v2/connector/impl/MockPriceFeed";
import { WrapperBuilder } from "../../index";

chai.use(solidity);

describe("Price Aware - streamr", function () {
  let owner: SignerWithAddress;
  let signer: Wallet;

  let sample: SamplePriceAware;

  it("should deploy contracts", async function () {
      [owner] = await ethers.getSigners();

      signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

      const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
      sample = (await SamplePriceAware.deploy()) as SamplePriceAware;
  });

  it("should get price with single asset from streamr", async function () {
      sample = WrapperBuilder
          .wrapLite(sample)
          .usingPriceFeed("redstone-avalanche", {
              asset: "AVAX",
              dataSources: {
                  sources: [
                      {
                          type: "streamr-storage",
                          streamrEndpointPrefix: "0x3a7d971de367fe15d164cdd952f64205f2d9f10c/redstone-oracle",
                          disabledForSinglePrices: false
                      },
                  ],
                  valueSelectionAlgorithm: "newest-valid",
                  timeoutMilliseconds: 10000,
                  maxTimestampDiffMilliseconds: 150000,
                  preVerifySignatureOffchain: true,
              },
          });

      await sample.authorizeProvider();

      await syncTime(); // recommended for hardhat test
      await sample.executeWithPrice(toBytes32("AVAX"));
  });

  it("should get price with multiple assets from streamr", async function () {
      sample = WrapperBuilder
          .wrapLite(sample)
          .usingPriceFeed("redstone-avalanche", {
              dataSources: {
                  sources: [
                      {
                          type: "streamr-storage",
                          streamrEndpointPrefix: "0x3a7d971de367fe15d164cdd952f64205f2d9f10c/redstone-oracle",
                          disabledForSinglePrices: false
                      },
                  ],
                  valueSelectionAlgorithm: "newest-valid",
                  timeoutMilliseconds: 10000,
                  maxTimestampDiffMilliseconds: 150000,
                  preVerifySignatureOffchain: true,
              },
          });

      await sample.authorizeProvider();
      await syncTime(); // recommended for hardhat test
      await sample.executeWithPrice(toBytes32("AVAX"));
  });
});
