import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-typechain";

export default {
    solidity: "0.8.2",
    networks: {
        hardhat: {
            chainId: 7
        },
        kovan: {
            url: `https://eth-kovan.alchemyapi.io/v2/ET4VByJfAKxqeIn6Trsw-lcWEsA1yzB1`,
            //0xDd662cDCCdcfBA01519d6f5c9882e28EB3412745
            accounts: [`0x8d2857bed31910481bd01c4a6ca3209c0a28063607688784bf57298e4e1846c2`],
        },
    },
    paths: {
        tests: "./test/contracts"
    }
};

