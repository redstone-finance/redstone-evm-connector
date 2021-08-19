import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {PriceVerifier} from "../../typechain/PriceVerifier";
import redstone from 'redstone-api';

import {PriceFeedWithClearing} from "../../typechain/PriceFeedWithClearing";
import {EthersContractWrapper} from "../../utils/v2/impl/EthersContractWrapper";
chai.use(solidity);

const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;
const serialized = function (x: number): number {
    return x * 10**8;
};

describe("MockDefi with Proxy contract and pricing Data (with clearing)", function() {

    const REDSTONE_STOCKS_PROVIDER_ADDRESS = "0x926E370fD53c23f8B71ad2B3217b227E41A92b12";


    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let defi: MockDefi;
    let priceFeed: PriceFeedWithClearing;
    let verifier: PriceVerifier;
    let apiPrices: any;

    async function loadApiPrices() {
        apiPrices = await redstone.getAllPrices({
            provider: "redstone-stocks",
        });
    }

    it("Deployment should have zero balance", async function() {
        [owner, admin] = await ethers.getSigners();

        const Defi = await ethers.getContractFactory("MockDefi");
        const Proxy = await ethers.getContractFactory("RedstoneUpgradeableProxy");
        const PriceFeedWithClearing = await ethers.getContractFactory("PriceFeedWithClearing");

        priceFeed = (await PriceFeedWithClearing.deploy()) as PriceFeedWithClearing;
        await priceFeed.authorizeSigner(REDSTONE_STOCKS_PROVIDER_ADDRESS);

        defi = (await Defi.deploy()) as MockDefi;

        const proxy = await Proxy.deploy(defi.address, priceFeed.address, admin.address, []);

        defi = (await Defi.attach(proxy.address)) as MockDefi;
        await defi.initialize(priceFeed.address);

    });


    it("Should deposit - write no pricing info multi", async function() {

        defi = EthersContractWrapper
          .usingRedstoneApi(defi, "redstone-stocks")
          .wrap();

        await defi.deposit(toBytes32("GOOG"), 1);
        await defi.deposit(toBytes32("IBM"), 1);

    });


    it("Should inject correct prices from API multi", async function() {

        await loadApiPrices();

        expect(await defi.currentValueOf(owner.address, toBytes32("GOOG")))
            .to.be.equal(serialized(apiPrices['GOOG'].value).toFixed(0));
        expect(await defi.currentValueOf(owner.address, toBytes32("IBM")))
            .to.be.equal(serialized(apiPrices['IBM'].value).toFixed(0));

    });


    it("Should deposit - write no pricing info single", async function() {

        defi = EthersContractWrapper
          .usingRedstoneApi(defi, "redstone-stocks")
          .wrap("FB");

        await Promise.all([
            defi.deposit(toBytes32("FB"), 1),
            loadApiPrices(),
        ]);

    });


    it("Should inject correct prices from API single", async function() {
        expect(await defi.currentValueOf(owner.address, toBytes32("FB")))
            .to.be.equal(serialized(apiPrices['FB'].value).toFixed(0));
    });
   

});
