//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

contract  Ownable{

    address payable Owner;

    constructor()
    {
        Owner = payable(msg.sender);
    }

    modifier onlyOwner  {
        
        require(isOwner(),"you are not the owner");
        _;
    }
    function isOwner() public view returns(bool){
        return (Owner == msg.sender);
    }



}