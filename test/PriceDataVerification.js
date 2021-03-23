const { expect } = require("chai");
const {signPriceData} = require("../utils/price-signer");

describe("Price data verification", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  var owner, signer, verifier;

  it("Should deploy functions", async function() {
    [owner, admin] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);
    verifier = await Verifier.deploy();
  });


  //The verifier shouldn't validate the content - just the signature logic

  it("Should sign and verify empty price data", async function() {
    let priceData = {
      symbols: [].map(ethers.utils.formatBytes32String),
      prices: [],
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.true;
  });


  it("Should not verify price data with a signature for a different price", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: signer.address
    };

    let differentPriceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1799],
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(differentPriceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.false;
  });


  it("Should not verify price data with a signature for a different symbol", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: signer.address
    };

    let differentPriceData = {
      symbols: ["ETH2"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(differentPriceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.false;
  });


  it("Should not verify price data with a signature for a different timestamp", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: signer.address
    };

    let differentPriceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1112,
      signer: signer.address
    };

    let signature = signPriceData(differentPriceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.false;
  });


  it("Should not verify price data with a signature for a different signer", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: signer.address
    };

    let differentPriceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: 1111,
      signer: owner.address
    };

    let signature = signPriceData(differentPriceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.false;
  });


  it("Should sign and verify single price data", async function() {
      let priceData = {
        symbols: ["ETH"].map(ethers.utils.formatBytes32String),
        prices: [1800],
        timestamp: 1111,
        signer: signer.address
      };

      let signature = signPriceData(priceData, signer.privateKey);
      expect(await verifier.verifyPriceData(priceData, signature)).to.be.true;
  });


  it("Should sign and verify double price data", async function() {
    let priceData = {
      symbols: ["ETH", "AR"].map(ethers.utils.formatBytes32String),
      prices: [1800, 15],
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.true;
  });


  it("Should sign and verify 10 price data", async function() {
    let priceData = {
      symbols: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"].map(ethers.utils.formatBytes32String),
      prices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);
    expect(await verifier.verifyPriceData(priceData, signature)).to.be.true;
  });






});









