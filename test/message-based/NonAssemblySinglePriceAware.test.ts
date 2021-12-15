import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai from "chai";
import {solidity} from "ethereum-waffle";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {SampleNonAssemblySinglePriceAware} from "../../typechain";
import {syncTime, toBytes32} from "../_helpers";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../index";
import {DEFAULT_PRICE, MockableContract} from "../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";

chai.use(solidity);

describe("Non Assembly Single Price Aware - basic version (v1 version)", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: MockableContract<SampleNonAssemblySinglePriceAware>;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAware = await ethers.getContractFactory("SampleNonAssemblySinglePriceAware");
        sample = (await SamplePriceAware.deploy()) as MockableContract<SampleNonAssemblySinglePriceAware>;
        await sample.authorizeSigner(signer.address);
    });

    it("should get price", async function () {
        sample = WrapperBuilder
          .mock(sample)
          .using(DEFAULT_PRICE);
        await syncTime();
        await sample.executeWithPrice(toBytes32("ETH"));
    });
});
