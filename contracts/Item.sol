//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;
import "./ItemManager.sol";
contract Item{
    uint public priceInWei;
    uint public pricePaid;
    uint public itemIndex;

    ItemManager parentContract;
    constructor(ItemManager _parentContract,uint _priceInWei,uint _itemIndex){
        parentContract =_parentContract;
        priceInWei = _priceInWei;
        itemIndex = _itemIndex;
    }

    receive() external payable{
        require(pricePaid == 0, "Item is paid already");
        require(priceInWei == msg.value,"Only full payments allowed");
        pricePaid += msg.value; 
        (bool success, ) = address(parentContract).call{value:msg.value}(abi.encodeWithSignature("triggerPayment(uint256)",itemIndex));  
        require(success,"transaction was not successful");
    }
    fallback () external{

    }
}