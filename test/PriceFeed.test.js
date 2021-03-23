const { expect } = require("chai");
const {signPriceData} = require("../utils/price-signer");

describe("Price feed", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  var owner, signer, verifier, priceFeed, PriceFeed, currentTime;

  it("Should deploy functions", async function() {
    [owner, admin] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("PriceVerifier");
    PriceFeed = await ethers.getContractFactory("PriceFeed");

    signer = new ethers.Wallet(PRIV, owner.provider);
    verifier = await Verifier.deploy();

    priceFeed = await PriceFeed.deploy(verifier.address, 5 * 60);
  });


  it("Should not allow creating price feed with an empty verifier", async function() {
    [owner, admin] = await ethers.getSigners();

    await expect(PriceFeed.deploy(ethers.constants.AddressZero, 5 * 60))
      .to.be.revertedWith('Cannot set an empty verifier');
  });


  it("Should not allow creating price feed with a delay shorter than 15s", async function() {
    [owner, admin] = await ethers.getSigners();

    await expect(PriceFeed.deploy(verifier.address, 14))
      .to.be.revertedWith('Maximum price delay must be greater or equal to 15 seconds');
  });


  it("Should deploy a price feed", async function() {
    [owner, admin] = await ethers.getSigners();

    priceFeed = await PriceFeed.deploy(verifier.address, 5 * 60);
    expect(priceFeed.address).not.to.equal(ethers.constants.AddressZero);
  });



  it("Should not allow setting a price after delay", async function() {
    const Mock = await ethers.getContractFactory("MockDefi");
    let mock = await Mock.deploy(priceFeed.address);
    currentTime = await mock.getCurrentTime();


    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: currentTime - 301,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    await expect(priceFeed.setPrices(priceData, signature))
      .to.be.revertedWith('Price data timestamp too old');
  });


  it("Should set a single price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    await priceFeed.setPrices(priceData, signature);

    let contractPrice = await priceFeed.getPrice(priceData.symbols[0]);

    expect(contractPrice).to.be.equal(priceData.prices[0]);
  });


  it("Should throw for querying unavailable price", async function() {
    await expect(priceFeed.getPrice(ethers.utils.formatBytes32String("ETH2")))
      .to.be.revertedWith('No pricing data for given symbol');
  });


  it("Should not allow overwriting the price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1900],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    await expect(priceFeed.setPrices(priceData, signature))
      .to.be.revertedWith('Cannot overwrite existing price');
  });


  it("Should clear the single price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1900],
      timestamp: currentTime,
      signer: signer.address
    };

    await priceFeed.clearPrices(priceData);

    await expect(priceFeed.getPrice(priceData.symbols[0]))
      .to.be.revertedWith('No pricing data for given symbol');
  });


  //TODO: Add scenarios for multiple prices

});









