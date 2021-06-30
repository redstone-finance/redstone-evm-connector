import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { PriceAware } from "../../typechain/PriceAware";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {PriceVerifier} from "../../typechain/PriceVerifier";
import {PriceFeed} from "../../typechain/PriceFeed";
const { wrapContract } = require("../../utils/contract-wrapper");

chai.use(solidity);
const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;

describe("Price Aware", function () {
    let owner:SignerWithAddress;

    let pa: PriceAware;
    let priceFeed: PriceFeed;
    let verifier: PriceVerifier;

    const REDSTONE_STOCKS_PROVIDER = "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc";
    const REDSTONE_STOCKS_PROVIDER_ADDRESS = "0x926E370fD53c23f8B71ad2B3217b227E41A92b12";


    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        const Verifier = await ethers.getContractFactory("PriceVerifier");

        verifier = (await Verifier.deploy()) as PriceVerifier;
        priceFeed = (await PriceFeed.deploy(verifier.address, 5 * 60)) as PriceFeed;
        await priceFeed.authorizeSigner(REDSTONE_STOCKS_PROVIDER_ADDRESS);
        console.log("Authorized: ", REDSTONE_STOCKS_PROVIDER_ADDRESS);

        const PriceAware = await ethers.getContractFactory("PriceAware");


        pa = (await PriceAware.deploy(priceFeed.address)) as PriceAware;
    });

    it("should get price", async function () {
        await pa.execute(1);
        
        await pa.execute(1);        
        expect(await pa.checkStorage()).to.be.equal(3);

        pa = wrapContract(pa, REDSTONE_STOCKS_PROVIDER, "IBM");
        await pa.executePriceAwareWithPrices(1);
        await pa.executePriceAwareWithPrices(1);
        expect(await pa.checkStorage()).to.be.equal(3);
    });




});
