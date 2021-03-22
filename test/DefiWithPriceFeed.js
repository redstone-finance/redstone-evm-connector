const { expect } = require("chai");
const {signPriceData} = require("./utils");

describe("MockDefi with Proxy contract", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf1fa55c45add3";


  var owner, admin, defi, signer, priceFeed, verifier, currentTime;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const ModProxy = await ethers.getContractFactory("ModTransparentUpgradeableProxy");
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);

    verifier = await Verifier.deploy();
    priceFeed = await PriceFeed.deploy(verifier.address);

    defi = await Defi.deploy(priceFeed.address);

    console.log("Defi address: " + defi.address);
    const proxy1 = await Proxy.deploy(defi.address, admin.address, []);
    const proxy2 = await ModProxy.deploy(defi.address, admin.address, [], priceFeed.address);

    defi = await Defi.attach(proxy2.address);

    await owner.sendTransaction({to: signer.address, value: ethers.utils.parseEther("1")});

    currentTime = await defi.getCurrentTime();
    console.log("Current time: " + currentTime);
  });


  it("Should deposit with 1 price data", async function() {

    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);


    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrices(priceData, signature);
    let setPriceData = setPriceTx.data.substr(2);

    let clearPriceTx = await priceFeed.connect(signer).populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data.substr(2,8);

    let tx = await defi.connect(signer).populateTransaction.deposit(100);

    //Add priceDataLen info
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);
    tx.data = tx.data + clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");


    console.log("PREFIX: " + clearPricePrefix);


    //Add Limestone marker
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    console.log("Marker: " + marker);
    tx.data += marker.substr(2);


    console.log("Tx data: " + tx.data);
    console.log("Tx data len: " + tx.data.length);

    await signer.sendTransaction(tx);

  });


  it("Should deposit with 2 prices data", async function() {
    let priceData = {
      symbols: ["ETH", "AR"].map(ethers.utils.formatBytes32String),
      prices: [1800, 15],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);


    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrices(priceData, signature);
    let setPriceData = setPriceTx.data.substr(2);

    let clearPriceTx = await priceFeed.connect(signer).populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data.substr(2,8);

    let tx = await defi.connect(signer).populateTransaction.deposit(100);

    //Add priceDataLen infor
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);
    tx.data = tx.data + clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");


    console.log("PREFIX: " + clearPricePrefix);


    //Add Limestone marker
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    console.log("Marker: " + marker);
    tx.data += marker.substr(2);


    console.log("Tx data: " + tx.data);
    console.log("Tx data len: " + tx.data.length);

    await signer.sendTransaction(tx);

  });


  it("Should deposit with 1 price data - second call", async function() {
    let priceData = {
      symbols: ["ETH"].map(ethers.utils.formatBytes32String),
      prices: [1800],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);


    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrices(priceData, signature);
    let setPriceData = setPriceTx.data.substr(2);

    let clearPriceTx = await priceFeed.connect(signer).populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data.substr(2,8);

    let tx = await defi.connect(signer).populateTransaction.deposit(100);

    //Add priceDataLen infor
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);
    tx.data = tx.data + clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");


    console.log("PREFIX: " + clearPricePrefix);


    //Add Limestone marker
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    console.log("Marker: " + marker);
    tx.data += marker.substr(2);


    console.log("Tx data: " + tx.data);
    console.log("Tx data len: " + tx.data.length);

    await signer.sendTransaction(tx);

  });

  it("Should deposit with 10 prices data - second call", async function() {
    let priceData = {
      symbols: ["ETH", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"].map(ethers.utils.formatBytes32String),
      prices: [1800, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      timestamp: currentTime,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);


    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrices(priceData, signature);
    let setPriceData = setPriceTx.data.substr(2);

    let clearPriceTx = await priceFeed.connect(signer).populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data.substr(2,8);

    let tx = await defi.connect(signer).populateTransaction.deposit(100);

    //Add priceDataLen infor
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);
    tx.data = tx.data + clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");


    console.log("PREFIX: " + clearPricePrefix);


    //Add Limestone marker
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    console.log("Marker: " + marker);
    tx.data += marker.substr(2);


    console.log("Tx data: " + tx.data);
    console.log("Tx data len: " + tx.data.length);

    await signer.sendTransaction(tx);

  });

});
