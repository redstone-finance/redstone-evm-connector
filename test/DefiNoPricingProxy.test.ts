import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../typechain/MockDefi";
import { MockPriceFeed } from "../typechain/MockPriceFeed";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;


describe("MockDefi with Proxy contract but no pricing data", function() {


  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let defi: MockDefi;
  let priceFeed: MockPriceFeed;

  const toBytes32 = ethers.utils.formatBytes32String;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("RedstoneUpgradeableProxy");
    const PriceFeed = await ethers.getContractFactory("MockPriceFeed");


    priceFeed = (await PriceFeed.deploy()) as MockPriceFeed;
    defi = (await Defi.deploy(priceFeed.address)) as MockDefi;

    const proxy = await Proxy.deploy(defi.address, priceFeed.address, admin.address, []);

    defi = (await Defi.attach(proxy.address)) as MockDefi;
  });


  it("Should send a simple write transaction via proxy contract", async function() {

    await priceFeed.setPrice(toBytes32("ETH"), 10);
    await defi.deposit(toBytes32("ETH"),100);

  });


  it("Should send a simple read transaction via proxy contract", async function() {

    expect(await defi.balanceOf(owner.address, toBytes32("ETH"))).to.be.equal(100);
    expect(await defi.currentValueOf(owner.address, toBytes32("ETH"))).to.be.equal(1000);

  });


  it("Should send a reverted transaction via proxy contract", async function() {

    await expect(defi.deposit(toBytes32("ETH"), 0)).to.be.revertedWith('Amount must be greater than zero');

  });




});
