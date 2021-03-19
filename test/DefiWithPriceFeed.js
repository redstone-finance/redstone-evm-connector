const { expect } = require("chai");
const {signPriceData} = require("./utils");

describe("MockDefi with Proxy contract", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf1fa55c45add3";


  var owner, admin, defi, signer, priceFeed, verifier;

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
  });


  // it("Should revert on zero deposit, no pricing data", async function() {
  //   await expect(defi.deposit(0)).to.be.revertedWith("Amount must be greater than zero");
  // });
  //
  //
  // it("Should revert on zero deposit, no pricing data", async function() {
  //   await expect(defi.deposit(0)).to.be.revertedWith("Amount must be greater than zero");
  // });

  // it("Should test with price data", async function() {
  //   let priceData = {
  //     price: 7,
  //     timestamp: 1111,
  //     signer: signer.address
  //   };
  //
  //   let signature = signPriceData(priceData, signer.privateKey);
  //
  //
  //   //let setPriceTx = await priceFeed.connect(signer).setPrice(priceData, signature);
  //   let setPriceTx = await priceFeed.connect(signer).populateTransaction.test(7);
  //   console.log(setPriceTx.data);
  //
  //   let tx = await defi.connect(signer).populateTransaction.deposit(100);
  //   tx.data = tx.data + setPriceTx.data.substr(2);
  //   await signer.sendTransaction(tx);
  //
  // });

  it("Should deposit with price data", async function() {
    let priceData = {
      price: 13,
      timestamp: 1111,
      signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);


    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrice(priceData, signature);
    console.log(setPriceTx.data);

    let tx = await defi.connect(signer).populateTransaction.deposit(100);
    tx.data = tx.data + setPriceTx.data.substr(2);
    await signer.sendTransaction(tx, {gasLimit:1000000});

  });

  // it("Should deposit", async function() {
  //
  //   let tx = await defi.connect(signer).populateTransaction.deposit(100);
  //   tx.data = tx.data+"03";
  //
  //   await signer.sendTransaction(tx);
  //
  //   //console.log(txs);
  //
  //   //await defi.connect(signer).deposit(100);
  //
  //   expect(await defi.balanceOf(signer.address)).to.equal(300);
  // });

});
