import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { MockPriceFeed } from "../../typechain/MockPriceFeed";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;

describe("Mock Defi", function () {
    let owner:SignerWithAddress;
    let defi: MockDefi;
    let priceFeed: MockPriceFeed;


    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        const MockDefi = await ethers.getContractFactory("MockDefi");
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");

        priceFeed = (await MockPriceFeed.deploy()) as MockPriceFeed;
        defi = (await MockDefi.deploy()) as MockDefi;
        await defi.initialize(priceFeed.address);
    });


    it("should deposit ETH", async function () {
        await priceFeed.setPrice(toBytes32("ETH"), 10);
        await defi.deposit(toBytes32("ETH"), 100);

        expect(await defi.balanceOf(owner.address, toBytes32("ETH"))).to.be.equal(100);
    });


    it("should check ETH value with prices", async function () {
        expect(await defi.currentValueOf(owner.address, toBytes32("ETH"))).to.be.equal(1000);
    });


    it("should deposit AVAX", async function () {
        await priceFeed.setPrice(toBytes32("AVAX"), 5);
        await defi.deposit(toBytes32("AVAX"), 50);

        expect(await defi.balanceOf(owner.address, toBytes32("AVAX"))).to.be.equal(50);
    });


    it("should check AVAX value with prices", async function () {
        expect(await defi.currentValueOf(owner.address, toBytes32("AVAX"))).to.be.equal(250);
    });


    it("should swap ETH to AVAX", async function () {
        await defi.swap(toBytes32("ETH"), toBytes32("AVAX"), 10);

        expect(await defi.balanceOf(owner.address, toBytes32("ETH"))).to.be.equal(90);
        expect(await defi.balanceOf(owner.address, toBytes32("AVAX"))).to.be.equal(70);

        expect(await defi.currentValueOf(owner.address, toBytes32("ETH"))).to.be.equal(900);
        expect(await defi.currentValueOf(owner.address, toBytes32("AVAX"))).to.be.equal(350);
    });

});
