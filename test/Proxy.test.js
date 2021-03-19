const { expect } = require("chai");

describe("MockDefi with Proxy contract", function() {



  var owner, admin, defi;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

    defi = await Defi.deploy();


    console.log("Defi address: " + defi.address);
    const proxy = await Proxy.deploy(defi.address, admin.address, []);

    defi = await Defi.attach(proxy.address);

    expect(await defi.balanceOf(owner.address)).to.equal(0);
  });

  it("Should deposit", async function() {
    await defi.deposit(100);

    expect(await defi.balanceOf(owner.address)).to.equal(100);
  });

});
