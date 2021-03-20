const { expect } = require("chai");
const {signPriceData} = require("./utils");

describe("Price data verification", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf1fa55c45add3";


  var owner, signer, verifier;

  it("Should deploy functions", async function() {
    [owner, admin] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);
    verifier = await Verifier.deploy();

  });


  it("Should sign and verify price data", async function() {
      let signerAddress = signer.address;
      console.log("Signer: " + signerAddress);


      let priceData = {
        symbols: ["ETH", "AR"].map(ethers.utils.formatBytes32String),
        prices: [1800, 15],
        timestamp: 1111,
        signer: signerAddress
      };

      let hashedOnChain = await verifier.hashPriceData(priceData);
      console.log("Hashed on-chain: " + hashedOnChain);

      let signature = signPriceData(priceData, signer.privateKey);
      console.log(signature);
      expect(await verifier.verifyPriceData(priceData, signature)).to.be.true;
  });






});









