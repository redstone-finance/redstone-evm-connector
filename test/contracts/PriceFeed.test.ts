import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { PriceVerifier } from "../../typechain/PriceVerifier";
import { PriceFeed } from "../../typechain/PriceFeed";
import {PriceSigner} from "../../utils/price-signer";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Wallet} from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("Price feed", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let signer: Wallet;
  let verifier: PriceVerifier;
  let priceFeed: PriceFeed;
  let currentTime: number;
  const priceSigner = new PriceSigner();

  it("Should deploy the Verifier", async function() {
    [owner, other] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);
    verifier = (await Verifier.deploy()) as PriceVerifier;
  });


  it("Should not allow creating price feed with an empty verifier", async function() {
    const PriceFeed = await ethers.getContractFactory("PriceFeed");

    await expect(PriceFeed.deploy(ethers.constants.AddressZero, 5 * 60))
      .to.be.revertedWith('Cannot set an empty verifier');
  });


  it("Should not allow creating price feed with zero delay", async function() {
    const PriceFeed = await ethers.getContractFactory("PriceFeed");

    await expect(PriceFeed.deploy(verifier.address, 0))
      .to.be.revertedWith('Maximum price delay must be greater than 0');
  });


  it("Should deploy a price feed", async function() {
    const PriceFeed = await ethers.getContractFactory("PriceFeed");

    priceFeed = await PriceFeed.deploy(verifier.address, 5 * 60) as PriceFeed;
    expect(priceFeed.address).not.to.equal(ethers.constants.AddressZero);
  });


  it("Should not allow setting the price without authorization", async function() {
    const Mock = await ethers.getContractFactory("MockDefi");
    let mock = await Mock.deploy();
    currentTime = await mock.getCurrentTime() * 1000;

    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      values: [1800],
      timestamp: currentTime
    };

    const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
    await expect(priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature))
      .to.be.revertedWith('Unauthorized price data signer');
  });


  it("Should not allow authorization from non owner", async function() {
      await expect(priceFeed.connect(other).authorizeSigner(signer.address))
        .to.be.revertedWith('Ownable: caller is not the owner');
  });


  it("Should authorize a signer", async function() {
    await priceFeed.authorizeSigner(signer.address);
  });


  it("Should not allow setting a price after delay", async function() {

    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      values: [1800],
      timestamp: currentTime - 301000
    };

    const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
    await expect(priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature))
      .to.be.revertedWith('Price data timestamp too old');
  });


  it("Should set a single price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      values: [1800],
      timestamp: currentTime
    };

    const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
    await priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature);

    let contractPrice = await priceFeed.getPrice(priceData.symbols[0]);

    expect(contractPrice).to.be.equal(priceData.values[0]);
  });


  it("Should throw an error while querying unavailable price", async function() {
    await expect(priceFeed.getPrice(ethers.utils.formatBytes32String("ETH2")))
      .to.be.revertedWith('No pricing data for given symbol');
  });


  it("Should not allow changing the price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      values: [1900],
      timestamp: currentTime
    };

    const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
    await expect(priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature))
      .to.be.revertedWith('The prices could be set only once in the transaction');
  });


  it("Should not allow to clear the price by other users", async function() {
      let priceData = {
          symbols: ["ETH"].map(ethers.utils.formatBytes32String),
          values: [1900],
          timestamp: currentTime
      };

      await expect(priceFeed.connect(other).clearPrices(priceData))
          .to.be.revertedWith('The prices could be cleared only by the address which set them');
  });


  it("Should clear the single price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      values: [1900],
      timestamp: currentTime
    };

    await priceFeed.clearPrices(priceData);

    await expect(priceFeed.getPrice(priceData.symbols[0]))
      .to.be.revertedWith('No pricing data for given symbol');
  });


  it("Should not allow revoking authorization from non owner", async function() {
      await expect(priceFeed.connect(other).revokeSigner(signer.address))
          .to.be.revertedWith('Ownable: caller is not the owner');
  });


  it("Should revoke authorization", async function() {
      await priceFeed.revokeSigner(signer.address);

      let priceData = {
          symbols: ["ETH"].map(ethers.utils.formatBytes32String),
          values: [1800],
          timestamp: currentTime
      };

      const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
      await expect(priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature))
          .to.be.revertedWith('Unauthorized price data signer');
  });


  it("Should authorize again after revoking a signer", async function() {
    await priceFeed.authorizeSigner(signer.address);
  });


  it("Should set multiple prices", async function() {
    let priceData = {
      symbols: ["ETH", "BTX", "AVAX"].map(ethers.utils.formatBytes32String),
      values: [1800, 50000, 30],
      timestamp: currentTime
    };

    const signedPriceData = priceSigner.signPriceData(priceData, signer.privateKey);
    await priceFeed.setPrices(signedPriceData.priceData, signedPriceData.signature);

    for(let i=0; i<3; i++) {
        expect(await priceFeed.getPrice(priceData.symbols[i])).to.be.equal(priceData.values[i]);
    }

  });


  it("Should clear multiple prices", async function() {
    let priceData = {
      symbols: ["ETH", "BTX", "AVAX"].map(ethers.utils.formatBytes32String),
      values: [1800, 50000, 30],
      timestamp: currentTime
    };

    await priceFeed.clearPrices(priceData);

    for(let i=0; i<3; i++) {
      await expect(priceFeed.getPrice(priceData.symbols[0]))
        .to.be.revertedWith('No pricing data for given symbol');
    }

  });

});
