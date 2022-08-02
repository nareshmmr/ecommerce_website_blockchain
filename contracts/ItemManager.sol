//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import "./Item.sol";
import "./Ownable.sol";
contract ItemManager is Ownable{

    enum SupplyChainState{Created,Paid,Deleiverd}

    struct S_Item{
        Item _item;
        address _itemAddress;
        string _identifier;
        uint _itemPrice;
        uint _state;
    }
    mapping(uint => S_Item) public items;
    uint public itemIndex;
    event SupplyChainStep(uint itemIndex,uint state,address _itemAddress);

    function createItem(string memory _identifier,uint _itemPrice) public onlyOwner{
        itemIndex++;
        Item item = new Item(this,_itemPrice,itemIndex);
        items[itemIndex]._item = item;
        items[itemIndex]._itemAddress = address(items[itemIndex]._item);
        items[itemIndex]._identifier = _identifier;
        items[itemIndex]._itemPrice = _itemPrice;
        items[itemIndex]._state = uint(SupplyChainState.Created);
        emit SupplyChainStep(itemIndex,items[itemIndex]._state,address(item));
    }

    function triggerPayment(uint _itemIndex) public payable{
        require(items[_itemIndex]._itemPrice == msg.value,"Only full payments accepted");
        require(items[_itemIndex]._state == uint(SupplyChainState.Created), "Item is further in the chain");
        items[_itemIndex]._state = uint(SupplyChainState.Paid);
        emit SupplyChainStep(_itemIndex,items[_itemIndex]._state,address(items[_itemIndex]._item));
    }

    function triggerDelivery(uint _itemIndex) public onlyOwner{
        require(items[_itemIndex]._state == uint(SupplyChainState.Paid), "Item is further in the chain");
        items[_itemIndex]._state = uint(SupplyChainState.Deleiverd);
        emit SupplyChainStep(_itemIndex,items[_itemIndex]._state,address(items[_itemIndex]._item));
    }
}