# ⚡️ Flash storage

Putting data directly into storage is the easiest to make information accessible to smart contracts. However, the convenience comes at a high price, as the storage access is the most costly operation in [EVM](https://ethereum.github.io/yellowpaper/paper.pdf) (20k gas for 256bit word ~ $160k for 1Mb checked 30/08/2021) making it prohibitively expensive to use.

Flash storage implements an alternative design of providing data to smart contracts. Instead of constantly persisting data on EVM storage, the information is brought on-chain only when needed (**on-demand fetching**). Until that moment, the data remains available in the [Arweave](https://www.arweave.org/) blockchain where data providers are incentivised to keep information accurate and up to date. Data is transferred to EVM via a mechanism based on a [meta-transaction pattern](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84) and the information integrity is verified on-chain through signature checking. 

## 💡 How it works

At a top level, transferring data to an EVM environment requires packing an extra payload to a user's transaction and processing the message on-chain.

[![image.png](https://i.postimg.cc/5NZSqtFT/image.png)](https://postimg.cc/xc3m9n53)

### Data packing (off-chain data encoding)

1. Relevant data needs to be fetched from the RedStone api
2. Data is packed into a message according to the following structure

[![image.png](https://i.postimg.cc/SRgRHHF1/image.png)](https://postimg.cc/jnJR7gjy)

3. The package is appended to the original transaction message, signed and submitted to the network

*All of the steps are executed automatically by the ContractWrapper and transparent to the end-user*

### Data unpacking (on-chain data verification)

1. The appended data package is extracted from the `msg.data`
2. The data signature is verified by checking if the signer is one of the approved providers
3. The timestamp is also verified checking if the information is not obsolete
4. The value that matches a given symbol is extracted from the data package

*This logic is executed in the on-chain environment and we optimised the execution using a low-level assembly code to reduce gas consumption to the absolute minimum*

### Benchmarks

We work hard to optimise the code using solidity assembly and reduce the gas costs of our contracts. Below there is a comparison of the read operation gas costs using the most popular Chainlink Reference Data, the standard version of Redstone PriceAware contract and the optimised version where provider address is inlined at the compilation time. The [scripts](https://github.com/redstone-finance/redstone-flash-storage/tree/price-aware/scripts) which generated the data together with [results](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/benchmarks.txt) and transactions details could be found in our repository.

[![Screenshot-2021-09-05-at-17-18-25.png](https://i.postimg.cc/CK14BQTC/Screenshot-2021-09-05-at-17-18-25.png)](https://postimg.cc/NK3XZb0L)

## 📦 Installation
```bash
# Using yarn
yarn add redstone-flash-storage

# Using NPM
npm install redstone-flash-storage
```

## 🔥 Getting started

### 1. Modifying your contracts

You need to apply a minium change to the source code to enable smart contract to access data. Your contract needs to extend the [PriceAware](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAware.sol) contract :

```js
import "redstone-flash-storage/lib/contracts/message-based/PriceAware.sol";

contract YourContractName is PriceAware {
```

After applying the mentioned change you will be able to access the data calling the local [getPriceFromMsg](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAware.sol#L29) function:

```js
uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
```

### 2. Updating the interface

You should also update the code responsible for submitting transactions. If you're using [ethers.js](https://github.com/ethers-io/ethers.js/), we've prepared a dedicated library to make the transition seamless. First, you need to import the wrapper code to your project:

```ts
// Typescript
import WrapperBuilder from "redstone-flash-storage/lib/utils/v2/impl/builder/WrapperBuilder";

// Javascript
const { default: WrapperBuilder } = require("redstone-flash-storage/lib/utils/v2/impl/builder/WrapperBuilder");
```

Then you can wrap your ethers contract pointing to the selected Redstone data provider:

```js
let yourEthersContract = new ethers.Contract(addres, abi, provider);

yourEthersContract = WrapperBuilder
                      .wrapLite(yourEthersContract)
                      .usingPriceFeed("redstone", "ETH");
```

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```js
yourEthersContract.executeYourMethod();
```

💡 Note! If you're the owner of the contract, you should authorise a data provider after the contract deployment. You should do it before users will interact with your contract. Because the provider authenticity will be checked via signature verification whenever a user submits a transaction accessing the data. There are 2 ways od provider authorisation:
#### 1. Simple authorisation
```js
await yourEthersContract.authorizeProvider();
```
#### 2. Authorization by ethereum address
```js
await yourEthersContract.authorizeSigner("REAPLCE_WITH_DATA_PROVIDER_ETHEREUM_ADDRESS")
```

We recommend to use the first option, which will automatically authorise the correct public address based on your configured price feed.

```js
yourEthersContract.authorizeProvider();
```

If you'd like to use the wrapper in a test context, we recommend using a mock provider when you can easily override the price to test different scenarios:


```js
yourEthersContract = WrapperBuilder
                     .mockLite(yourEthersContract)
                     .using(DEFAULT_PRICE);
```

We're also working on a wrapper for the truffle/web3 contracts. Please [let us know](https://redstone.finance/discord) if you need a solution for other frameworks as well. 

### Alternative solutions

If you don't want to modify even a single line of your contract, it's possible to use an alternative solution based on the [Proxy pattern](https://blog.openzeppelin.com/proxy-patterns/). This approach intercepts a transaction at a proxy stage, extracts the price data and delegates the original transaction to your contract. Another advantage of the solution is allowing any contract (including 3rd party ones) to access the data. However, these benefits come at the cost of higher gas consumption. If you're interested in using this approach take a look at the contracts located in the [storage-based](https://github.com/redstone-finance/redstone-flash-storage/tree/price-aware/contracts/storage-based) folder and [reach out to us](https://redstone.finance/discord) if you need help setting up your environment.  

## 👨‍💻 Development and contributions

The codebase consists of a wrapper written in typescript which is responsible for packing the data and solidity smart contracts that extract the information. We encourage anyone to build and test the code and we welcome any issues with suggestions and pull requests. 

#### Installing the dependencies

```
yarn install 
```

### Compiling and running the tests

```
yarn test 
```
