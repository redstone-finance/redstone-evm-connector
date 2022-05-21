import { Contract } from "ethers";
import { addContractWait } from "../add-contract-wait";
import { prepareMetaTx } from "../MetaTxService";
// import axios from "axios";

interface VRFNodeOpts {
  url: string;
}

export class VRFEthersContractWrapperBuilder<T extends Contract> {
  constructor(private readonly baseContract: T) {}

  usingVRFNode(opts: VRFNodeOpts): T {
    const contract = this.baseContract;
    const contractPrototype = Object.getPrototypeOf(contract);
    const wrappedContract = Object.assign(
      Object.create(contractPrototype),
      contract);

    const functionNames: string[] = Object.keys(contract.functions);
    functionNames.forEach(functionName => {
      if (functionName.indexOf("(") == -1) {
        const isCall = contract.interface.getFunction(functionName).constant;

        if (!isCall) {
          (wrappedContract[functionName] as any) = async function (...args: any[]) {

            const tx = await contract.populateTransaction[functionName](...args);
            const abi = contract.interface;
            const functionAbi = abi.functions[functionName + "()"]; // Quick hack here

            // console.log({functionAbi, fabi: abi.functions, functionName});

            const metaTxDetails = await prepareMetaTx(contract.signer, contract, functionAbi, args);
            console.log({metaTxDetails});

            console.log("Function ABI:", functionAbi);
  
            const sentTx = await contract.signer.sendTransaction(tx);
  
            // Tweak the tx.wait so the receipt has extra properties
            addContractWait(contract, sentTx);
  
            return sentTx;
          }; 
        }
      }
    });

    return wrappedContract;
  }
}
