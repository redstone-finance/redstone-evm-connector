const {signPriceData} = require("../utils/price-signer");

function wrapContract(contract, priceFeed) {
  let signer = contract.signer;

  let currentTime = parseInt(new Date().getTime()/1000);

  let priceData = {
    symbols: ["ETH"].map(ethers.utils.formatBytes32String),
    prices: [1800],
    timestamp: currentTime,
    signer: signer.address
  };

  let signature = signPriceData(priceData, signer.privateKey);


  contract.depositWithPrices = async function(arg) {
    let setPriceTx = await priceFeed.connect(signer).populateTransaction.setPrices(priceData, signature);
    let setPriceData = setPriceTx.data.substr(2);

    let clearPriceTx = await priceFeed.connect(signer).populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data.substr(2,8);

    let tx = await contract.populateTransaction.deposit(arg);


    //Add priceDataLen info
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);
    tx.data = tx.data + clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");


    console.log("PREFIX: " + clearPricePrefix);


    //Add Limestone marker
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    console.log("Marker: " + marker);
    tx.data += marker.substr(2);


    console.log("Tx data: " + tx.data);
    console.log("Tx data len: " + tx.data.length);

    await signer.sendTransaction(tx);
  };

  // Object.keys(contract.functions).forEach(f => {
  //   console.log(contract.functions[f]);
  // });
  return contract;
}

module.exports.wrapContract = wrapContract;
