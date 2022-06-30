import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai from "chai";
import {solidity} from "ethereum-waffle";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {
    SampleSinglePriceAware,
    SamplePriceAware,
    SampleInlinedSinglePriceAware,
    SampleInlinedPriceAware,
    SampleSinglePriceAwareUpgradeable,
    SamplePriceAwareUpgradeable
} from "../../../typechain";
import {syncTime, toBytes32} from "../../_helpers";
import {MockPriceFeed} from "../../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../../index";
import {MockableContract} from "../../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";

chai.use(solidity);

describe("Benchmark - price aware contracts", function () {
    let owner: SignerWithAddress;
    let signer: Wallet;

    let singlePriceAware: MockableContract<SampleSinglePriceAware>;
    let priceAware: MockableContract<SamplePriceAware>;
    let inlinedSinglePriceAware: MockableContract<SampleInlinedSinglePriceAware>;
    let inlinedPriceAware: MockableContract<SampleInlinedPriceAware>;
    let singlePriceAwareUpgradeable: MockableContract<SampleSinglePriceAwareUpgradeable>;
    let priceAwareUpgradeable: MockableContract<SamplePriceAwareUpgradeable>;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        await syncTime(); // recommended for hardhat test

        const SampleSinglePriceAware = await ethers.getContractFactory("SampleSinglePriceAware");
        singlePriceAware = (await SampleSinglePriceAware.deploy()) as MockableContract<SampleSinglePriceAware>;
        singlePriceAware = authorizeAndWrapContract(singlePriceAware);

        // current version
        const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
        priceAware = (await SamplePriceAware.deploy()) as MockableContract<SamplePriceAware>;
        priceAware = authorizeAndWrapContract(priceAware);

        const SampleInlinedSinglePriceAware = await ethers.getContractFactory("SampleInlinedSinglePriceAware");
        inlinedSinglePriceAware = (await SampleInlinedSinglePriceAware.deploy()) as MockableContract<SampleInlinedSinglePriceAware>;
        inlinedSinglePriceAware = wrapContract(inlinedSinglePriceAware);

        // current version
        const SampleInlinedPriceAware = await ethers.getContractFactory("SampleInlinedPriceAware");
        inlinedPriceAware = (await SampleInlinedPriceAware.deploy()) as MockableContract<SampleInlinedPriceAware>;
        inlinedPriceAware = wrapContract(inlinedPriceAware);

        const SampleSinglePriceAwareUpgradeable = await ethers.getContractFactory("SampleSinglePriceAwareUpgradeable");
        singlePriceAwareUpgradeable = (await SampleSinglePriceAwareUpgradeable.deploy()) as MockableContract<SampleSinglePriceAwareUpgradeable>;
        singlePriceAwareUpgradeable = authorizeAndWrapContract(singlePriceAwareUpgradeable);
        await singlePriceAwareUpgradeable.initialize();

        // current version
        const SamplePriceAwareUpgradeable = await ethers.getContractFactory("SamplePriceAwareUpgradeable");
        priceAwareUpgradeable = (await SamplePriceAwareUpgradeable.deploy()) as MockableContract<SamplePriceAwareUpgradeable>;
        priceAwareUpgradeable = authorizeAndWrapContract(priceAwareUpgradeable);
        await priceAwareUpgradeable.initialize();
    });

    function authorizeAndWrapContract(contract: any) {
        const wrapped = wrapContract(contract);

        wrapped.authorizeSigner(signer.address);

        return wrapped;
    }

    function wrapContract(contract: any) {

        return WrapperBuilder
            .mockLite(contract)
            .using(assetPrices);
    }

    it("should benchmark costs for 3rd asset", async function () {
        await singlePriceAware.executeWithPrice(toBytes32("BTC"));
        await priceAware.executeWithPrice(toBytes32("BTC"));
        await inlinedSinglePriceAware.executeWithPrice(toBytes32("BTC"));
        await inlinedPriceAware.executeWithPrice(toBytes32("BTC"));
        await singlePriceAwareUpgradeable.executeWithPrice(toBytes32("BTC"));
        await priceAwareUpgradeable.executeWithPrice(toBytes32("BTC"));
    });
});

const assetPrices = (forTime: number) => ({
    prices: [
        {symbol: "ETH", value: 10},
        {symbol: "AVAX", value: 5},
        {symbol: "BTC", value: 30}
    ],
    timestamp: forTime - 1000
});