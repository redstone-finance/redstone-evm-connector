import { ethers } from "hardhat";
import { Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

import { MockPriceAware } from "../../typechain/MockPriceAware";
import { SampleInlinedPriceAwareAsm } from "../../typechain/SampleInlinedPriceAwareAsm";
import { SamplePriceAwareAsm } from "../../typechain/SamplePriceAwareAsm";
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


describe("Price Aware - inlined assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SampleInlinedPriceAwareAsm;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const SampleInlinedPriceAwareAsm = await ethers.getContractFactory("SampleInlinedPriceAwareAsm");
        sample = (await SampleInlinedPriceAwareAsm.deploy()) as SampleInlinedPriceAwareAsm;

        console.log("MockPriceAware deployed: " + sample.address);
    });

    it("should get price", async function () {

        sample = wrapContractLite(sample);
        //await syncTime(); // recommended for hardhat test
        let tx = await sample.executeWithPrice(7);
        console.log("Executed with RedStone price: " + tx.hash);
    });
});


describe("Price Aware - editable assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SamplePriceAwareAsm;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const SamplePriceAwareAsm = await ethers.getContractFactory("SamplePriceAwareAsm");
        sample = (await SamplePriceAwareAsm.deploy()) as SamplePriceAwareAsm;

        //TODO: move authorization to wrapper (to avoid passing signer address)
        await sample.authorizeSigner(signer.address);
        console.log("MockPriceAware deployed: " + sample.address);
    });

    it("should get price", async function () {

        sample = wrapContractLite(sample);
        //await syncTime(); // recommended for hardhat test
        let tx = await sample.executeWithPrice(7);
        console.log("Executed with RedStone price: " + tx.hash);
    });
});
