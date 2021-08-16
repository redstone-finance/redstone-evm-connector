import { ethers } from "hardhat";
import { Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

import { MockPriceAware } from "../../typechain/MockPriceAware";
import { MockPriceAwareAsm } from "../../typechain/MockPriceAwareAsm";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { syncTime } from "../_helpers";
const { wrapContract, wrapContractLite } = require("../../utils/contract-wrapper");

chai.use(solidity);
const { expect } = chai;

describe("Price Aware - basic version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let mockPriceAware: MockPriceAware;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const MockPriceAware = await ethers.getContractFactory("MockPriceAware");
        mockPriceAware = (await MockPriceAware.deploy()) as MockPriceAware;
        await mockPriceAware.authorizeSigner(signer.address);
    });

    it("should get price", async function () {
        await mockPriceAware.execute(1);

        mockPriceAware = wrapContract(mockPriceAware);
        await syncTime();
        await mockPriceAware.executeWithPrice(7);
    });
});


describe("Price Aware - assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let mockPriceAwareAsm: MockPriceAwareAsm;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const MockPriceAware = await ethers.getContractFactory("MockPriceAwareAsm");
        mockPriceAwareAsm = (await MockPriceAware.deploy()) as MockPriceAware;
        
        //The more efficient version has inlined signer
        //await mockPriceAwareAsm.authorizeSigner(signer.address);
        console.log("MockPriceAware deployed: " + mockPriceAwareAsm.address);
    });

    it("should get price", async function () {

        mockPriceAwareAsm = wrapContractLite(mockPriceAwareAsm);
        //await syncTime(); // recommended for hardhat test
        let tx = await mockPriceAwareAsm.executeWithPrice(7);
        console.log("Executed with RedStone price: " + tx.hash);
    });
});
