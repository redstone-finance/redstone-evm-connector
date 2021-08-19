import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai from "chai";
import {solidity} from "ethereum-waffle";

import {MockPriceAware} from "../../typechain/MockPriceAware";
import {MockPriceAwareAsm} from "../../typechain/MockPriceAwareAsm";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime} from "../_helpers";
import {EthersContractWrapper} from "../../utils/v2/impl/EthersContractWrapper";
import {EthersContractWrapperLite} from "../../utils/v2/impl/EthersContractWrapperLite";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import {mock} from "sinon";

chai.use(solidity);

describe("Price Aware - basic version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let mockPriceAware: MockPriceAware;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const MockPriceAware = await ethers.getContractFactory("MockPriceAware");
        mockPriceAware = (await MockPriceAware.deploy()) as MockPriceAware;
        await mockPriceAware.authorizeSigner(signer.address);
    });

    it("should get price", async function () {
        await mockPriceAware.execute(1);

        mockPriceAware = EthersContractWrapper
          .wrap(mockPriceAware)
          .usingMockPriceFeed();
        await syncTime();
        await mockPriceAware.executeWithPrice(7);
    });
});


describe("Price Aware - assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let mockPriceAwareAsm: MockPriceAwareAsm;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const MockPriceAware = await ethers.getContractFactory("MockPriceAwareAsm");
        mockPriceAwareAsm = (await MockPriceAware.deploy()) as MockPriceAware;
        
        //The more efficient version has inlined signer
        //await mockPriceAwareAsm.authorizeSigner(signer.address);
        console.log("MockPriceAware deployed: " + mockPriceAwareAsm.address);
    });

    it("should get price", async function () {

        mockPriceAwareAsm = EthersContractWrapperLite
          .wrapLite(mockPriceAwareAsm)
          .usingMockPriceFeed();

        //await syncTime(); // recommended for hardhat test
        let tx = await mockPriceAwareAsm.executeWithPrice(7);
        console.log("Executed with RedStone price: " + tx.hash);
    });
});
