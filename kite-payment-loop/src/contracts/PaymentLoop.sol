// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentLoop {
    address public agentA;
    address public agentB;
    mapping(address => uint256) public balances;

    event PaymentInitiated(address indexed from, address indexed to, uint256 amount);
    event PaymentConfirmed(address indexed from, address indexed to, uint256 amount);

    constructor(address _agentA, address _agentB) {
        agentA = _agentA;
        agentB = _agentB;
    }

    function initiatePayment(address _to) external payable {
        require(msg.sender == agentA, "Only Agent A can initiate payment");
        require(msg.value > 0, "Payment must be greater than zero");
        balances[_to] += msg.value;
        emit PaymentInitiated(msg.sender, _to, msg.value);
    }

    function confirmPayment() external {
        require(msg.sender == agentB, "Only Agent B can confirm payment");
        uint256 amount = balances[agentB];
        require(amount > 0, "No payment to confirm");
        
        balances[agentB] = 0;
        payable(agentB).transfer(amount);
        emit PaymentConfirmed(agentA, agentB, amount);
    }
}