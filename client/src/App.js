import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { 
    cost:0,
    itemName:"Item",
    loaded:false
  };
  //nextItemId = 0;
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      this.itemManager = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[this.networkId] && ItemManagerContract.networks[this.networkId].address,
      );
      this.item = new this.web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[this.networkId] && ItemContract.networks[this.networkId].address,
      );
      
      this.listenToPaymentEvent();
           
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ loaded:true });
      this.addExistingItemsToMenu();
      this.addExistingBoxesToContainer();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  listenToPaymentEvent = () => {
    let self = this;

    this.itemManager.events.SupplyChainStep().on("data", async function(evt) {
    if(evt.returnValues.state == 1) {
      let item = await self.itemManager.methods.items(evt.returnValues.itemIndex).call();
      console.log(item);
      alert("Item " + item._identifier + " was paid, deliver it now!");
    }
    if(evt.returnValues.state == 2)
    {
      let item = await self.itemManager.methods.items(evt.returnValues.itemIndex).call();
      console.log(item);
      alert("Item " + item._identifier + " delivered successfully");
    }
    console.log(evt);
    });
} 

  handleInputChange = (event) =>{
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked: target.value;
    const name = target.name;
    this.setState({
      [name]:value
    })
  }

  handleSubmit = async() =>{
    const {cost, itemName} = this.state;
    console.log(itemName, cost, this.itemManager);
    let result = await this.itemManager.methods.createItem(itemName,cost).send({from: this.accounts[0]});
    console.log(result);
    alert("Send "+cost+" Wei to "+result.events.SupplyChainStep.returnValues._itemAddress);
    this.updateItemsMenu();
    this.updateItemBBoxes();
  }

getCurrentItemIndex  = async() =>{
  return await this.itemManager.methods.itemIndex().call();
}

  updateItemsMenu = async() =>{
    var select = document.getElementById('ItemsInStore');
    var opt = document.createElement('option');
    let currentItemIndex = await this.getCurrentItemIndex();
    let numberOfExistingElements = select.options.length;
    if(currentItemIndex > numberOfExistingElements)
    {
      let item = await this.itemManager.methods.items(currentItemIndex).call();
      opt.value = item._identifier;
      opt.innerHTML = currentItemIndex;
      opt.text = item._identifier;
      select.appendChild(opt);
    }
  }

  addExistingItemsToMenu = async() =>{
    this.removeAllItemsFromMenu();
    let currentItemIndex = await this.getCurrentItemIndex();
    var select = document.getElementById('ItemsInStore');
    for(let i = 1 ;i<= currentItemIndex;i++)
    {
      var opt = document.createElement('option');
      let item = await this.itemManager.methods.items(i).call();
      opt.value = item._identifier;
      opt.innerHTML = i;
      opt.text = item._identifier;
      select.appendChild(opt);
    }
  }

  removeAllItemsFromMenu =async() =>{
    let numberOfItemsInList = await this.getCurrentItemIndex() - 1;
    var select = document.getElementById('ItemsInStore');
    for(var i = 0; i<=numberOfItemsInList; i++){
      select.remove(i);
    }
  }

  createLabel(_BoxElement,_Price){
    var label = document.createElement('LABEL');
    label.innerText = "price : "+ _Price +" wei";
    label.style.display = 'block';
    _BoxElement.appendChild(label);
  }

  handleonClickDeliver = async(event) =>{
    const target = event.target;
    let item = await this.itemManager.methods.items(target.parentNode.dataset.id).call();
    target.parentNode.dataset.state = item._state;
    if(target.parentNode.dataset.state != 1)
    {
      alert("payment has to be made first");
      return;
    }
    target.disabled = true;
    this.itemManager.methods.triggerDelivery(target.parentNode.dataset.id).send({from: this.accounts[0]});

  }

  createDeliverButton(_BoxElement)
  {

    let btn = document.createElement("button");
    btn.innerHTML = "Deliver";
    btn.style.display='block';
    btn.style.margin='0 auto'
    btn.onclick = this.handleonClickDeliver;
    if(_BoxElement.dataset.state > 1)
    {
      btn.disabled = true;
    }
    _BoxElement.appendChild(btn);
  }

  handleonClickPay =async(event) =>{
    const target = event.target;
    let item = await this.itemManager.methods.items(target.parentNode.dataset.id).call();
    target.parentNode.dataset.state = item._state;
    if(target.parentNode.dataset.state > 0)
    {
      alert("already paid!!");
      return;
    }
    target.disabled = true;

    this.web3.eth.sendTransaction({to: target.parentNode.dataset.addressForPayment, value: target.parentNode.dataset.price, from: this.accounts[0], gas: 2000000});
  }

  createPayButton(_BoxElement){
    let btn = document.createElement("button");
    btn.innerHTML = "Pay";
    btn.style.display='block';
    btn.style.margin='0 auto';
    if(_BoxElement.dataset.state > 0)
    {
      btn.disabled = true;
    }
    btn.onclick = this.handleonClickPay;
    _BoxElement.appendChild(btn);
    this.createDeliverButton(_BoxElement);
  }

updateItemBBoxes = async() =>{
  var ItemsContainer = document.getElementById('ItemsContainer');
  var box = document.createElement('div');
  let currentItemIndex = await this.getCurrentItemIndex();
  let numberOfExistingElements = ItemsContainer.getElementsByTagName('div').length;
  if(currentItemIndex > numberOfExistingElements)
  {
    box.className = "Box"; 
    let item = await this.itemManager.methods.items(currentItemIndex).call();
    box.innerText=item._identifier;
    box.id =  currentItemIndex;
    box.dataset.id = currentItemIndex;
    box.dataset.price = item._itemPrice
    box.dataset.identifier = item._identifier;
    box.dataset.addressForPayment = item._itemAddress;
    box.dataset.state = item._state;
    ItemsContainer.appendChild(box);
    
    var BoxElement = document.getElementById(currentItemIndex);
    this.createLabel(BoxElement,item._itemPrice);
    this.createPayButton(BoxElement);
 
  }
}

addExistingBoxesToContainer = async() =>{
  this.removeAllBoxesFromContainer();
  let currentItemIndex = await  this.getCurrentItemIndex();
  var ItemsContainer = document.getElementById('ItemsContainer');
  for(let i = 1 ;i<= currentItemIndex;i++)
  {
    //adding box for items
    var box = document.createElement('div');
    let item = await this.itemManager.methods.items(i).call();
    box.className = "Box";
    box.innerText=item._identifier;
    box.id =  i;
    box.dataset.id = currentItemIndex;
    box.dataset.price = item._itemPrice
    box.dataset.identifier = item._identifier;
    box.dataset.addressForPayment = item._itemAddress;
    box.dataset.state = item._state;
    ItemsContainer.appendChild(box);

    var BoxElement = document.getElementById(i);
    this.createLabel(BoxElement,item._itemPrice);
    this.createPayButton(BoxElement);
  
  }
}

removeAllBoxesFromContainer =async() =>{
  const ItemsContainer = document.getElementById("ItemsContainer");
  while (ItemsContainer.firstChild) {
    ItemsContainer.firstChild.innerText = "";
    ItemsContainer.removeChild(ItemsContainer.lastChild);
  }
}

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>E-COMMERCE WEBSITE</h1>
        <h2>ADD ITEMS TO STORE</h2>
        <p>Item Name : <input type="text" name="itemName" value={this.state.itemName} onChange={this.handleInputChange}/></p>
        <p>Set Item Price : <input type="text" name="cost" value={this.state.cost} onChange={this.handleInputChange}/></p>
        <button  type="button" onClick={this.handleSubmit}>Create New Item </button>
        <h2>ITEMS IN STORE</h2>
        <label htmlFor="ItemsInStore">Items_In_StoreHouse</label>
        <select id="ItemsInStore"></select>
        <div className="ItemsContainer" id="ItemsContainer"> </div>
      </div>
    );  
  }
}

export default App;
