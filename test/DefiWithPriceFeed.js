const { expect } = require("chai");
const {wrapContract} = require("../utils/contract-wrapper");

describe("MockDefi with Proxy contract but no pricing data", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00f00000000000000000000";


  var owner, admin, defi, signer, priceFeed, verifier, currentTime;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("ModTransparentUpgradeableProxy");
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);

    verifier = await Verifier.deploy();
    priceFeed = await PriceFeed.deploy(verifier.address, 5 * 60);

    defi = await Defi.deploy(priceFeed.address);

    console.log("Defi address: " + defi.address);
    const proxy = await Proxy.deploy(defi.address, admin.address, [], priceFeed.address);

    defi = await Defi.attach(proxy.address);
    defi = defi.connect(signer);

    await owner.sendTransaction({to: signer.address, value: ethers.utils.parseEther("1")});

  });


  it("Should deposit with 1 price data", async function() {

    defi = wrapContract(defi, priceFeed);
    await defi.depositWithPrices(10);

    expect(await defi.balanceOf(signer.address)).to.be.equal(18000);

  });

});
