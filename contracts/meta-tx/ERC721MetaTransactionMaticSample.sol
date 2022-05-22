// SPDX-License-Identifier: Unlicense

// TODO: remove this file

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "./ContextMixin.sol";
// import "./NativeMetaTransaction.sol";
import "../vrf/RedStoneVRFConsumerBase.sol";

contract ERC721MetaTransactionMaticSample is ERC721, RedStoneVRFConsumerBase {

    string contractPublicName;

    constructor (string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _initializeEIP712(name_);
        contractPublicName = name_;
    }

    function getContractPublicName() override external view returns(string memory) {
        return contractPublicName;
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender()
        internal
        override
        view
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }

    /**
    * As another option for supporting trading without requiring meta transactions, override isApprovedForAll to whitelist OpenSea proxy accounts on Matic
    */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }
        
        return ERC721.isApprovedForAll(_owner, _operator);
    }
}
