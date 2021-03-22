require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.0",
  networks: {
    hardhat: {
      chainId: 7
    }
  }
};

