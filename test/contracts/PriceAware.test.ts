import { ethers } from "hardhat";
import { Wallet } from "ethers";
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
    let signer:Wallet;

    let pa: PriceAware;
    let priceFeed: PriceFeed;
    let verifier: PriceVerifier;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        const Verifier = await ethers.getContractFactory("PriceVerifier");

        verifier = (await Verifier.deploy()) as PriceVerifier;
        priceFeed = (await PriceFeed.deploy(verifier.address, 5 * 60)) as PriceFeed;
        signer = new ethers.Wallet(PRIV, owner.provider);
        
        await priceFeed.authorizeSigner(signer.address);
        console.log("Authorized signer: ", signer.address);

        const PriceAware = await ethers.getContractFactory("PriceAware");


        pa = (await PriceAware.deploy(priceFeed.address)) as PriceAware;
    });

    it("should get price", async function () {
        await pa.execute(1);

        await pa.execute(1);        
        expect(await pa.checkStorage()).to.be.equal(3);

        pa = wrapContract(pa);
        await pa.executePriceAwareWithPrices(1);
        await pa.executePriceAwareWithPrices(1);
        expect(await pa.checkStorage()).to.be.equal(1000000001);
    });




});
