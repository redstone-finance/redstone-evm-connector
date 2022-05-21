import { ethers } from "hardhat";
import { WrapperBuilder } from "../../index";
import { SampleWithEvents } from "../../typechain/SampleWithEvents";
import { expect } from "chai";
import { Event } from "ethers";

describe("Sample with events", function () {
  let sampleContract: SampleWithEvents;

  beforeEach(async () => {
    const SampleWithEvents = await ethers.getContractFactory("SampleWithEvents");
    sampleContract = await SampleWithEvents.deploy() as SampleWithEvents;
  });

  it("Test events with contract wrapping", async function () {
    // Wrapping the contract instnace
    sampleContract = WrapperBuilder
      .wrapLite(sampleContract)
      .usingPriceFeed("redstone-avalanche-prod", { asset: "ETH" });

    // Sending tx
    const tx = await sampleContract.emitEventWithLatestEthPrice();
    const receipt = await tx.wait();
    const event: Event = receipt.events![0];

    // Receipt should have parsed events
    expect(receipt.events!.length).to.be.equal(1);
    expect(event.args!._ethPrice!.toNumber()).to.be.gt(0);
    expect(event.event).to.be.equal("PriceUpdated");
  });
});
