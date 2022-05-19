import { ethers } from "hardhat";
import { WrapperBuilder } from "../../index";
import { SampleWithEvents } from "../../typechain/SampleWithEvents";
import { expect } from "chai";
import { Event } from "ethers";

describe("Example with events", function () {
  let sampleContract: SampleWithEvents;

  beforeEach(async () => {
    const ExampleContractWithEvents = await ethers.getContractFactory("SampleWithEvents");
    sampleContract = await ExampleContractWithEvents.deploy() as SampleWithEvents;
  });

  it("Test events with contract wrapping", async function () {
    sampleContract = WrapperBuilder
      .wrapLite(sampleContract)
      .usingPriceFeed("redstone-avalanche-prod", { asset: "ETH" });

    const tx = await sampleContract.emitEventWithLatestEthPrice();
    const receipt = await tx.wait();

    expect(receipt.events!.length).to.be.equal(1);
    const event: any = receipt.events![0];
    expect(event.args._ethPrice.toNumber()).to.be.gt(0);
    expect(event.event).to.be.equal("priceUpdated");

  });
});
