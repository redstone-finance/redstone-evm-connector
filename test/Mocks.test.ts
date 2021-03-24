import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../typechain/MockDefi";
import { MockPriceFeed } from "../typechain/MockPriceFeed";

chai.use(solidity);
const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;

describe("Mock Defi", function () {
    let owner:any;
    let defi: MockDefi;
    let priceFeed: MockPriceFeed;


    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        const MockDefi = await ethers.getContractFactory("MockDefi");
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");

        priceFeed = (await MockPriceFeed.deploy()) as MockPriceFeed;
        defi = (await MockDefi.deploy(priceFeed.address)) as MockDefi;
    });


    it("should deposit with provided price", async function () {
        await priceFeed.setPrice(toBytes32("ETH"), 10);
        await defi.deposit(100);

        expect(await defi.balanceOf(owner.address)).to.be.equal(1000);
    });
});
