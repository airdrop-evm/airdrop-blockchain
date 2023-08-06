// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Airdrop is Ownable {
    // Structs
    struct AirdropInfo {
        uint256 start;
        uint256 end;
        uint256 amount;
        uint256 claimed;
        uint256 amountPerUser;
        bool whitelist;
        bytes32 merkleRoot;
        mapping (address=>bool) claimedUsers;
    }

    // Constants
    IERC20 public tokenAddress;

    // Variables
    uint256 public airdropsLength;
    mapping(uint256 => AirdropInfo) public airdrops;

    // Events
    event AirdropCreated(uint256 indexed airdropId, uint256 start, uint256 end, uint256 amount, uint256 amountPerUser, bool whitelist, bytes32 merkleRoot);
    event AirdropModified(uint256 indexed airdropId, uint256 start, uint256 end, uint256 amount, uint256 amountPerUser, bool whitelist, bytes32 merkleRoot);

    // Errors

    // Constructor
    constructor(address _tokenAddress) {
        tokenAddress = IERC20(_tokenAddress);
    }

    // Public functions
    // function airdropsLength() public view returns (uint256) {
    //     return airdrops.length;
    // }

    function createAirdrop(uint256 _start, uint256 _end, uint256 _amount, uint256 _amountPerUser, bool _whitelist, bytes32 _merkleRoot) public onlyOwner {
        if(_end > 0)
            require(_start < _end, "Start must be before end");
        require(_amount > 0, "Amount must be greater than 0");
        require(_amountPerUser > 0, "Amount per user must be greater than 0");
        require (_amountPerUser <= _amount, "Amount per user must be less than or equal to amount");

        tokenAddress.transferFrom(msg.sender, address(this), _amount);

        AirdropInfo storage airdrop = airdrops[airdropsLength];
        airdrop.start = _start;
        airdrop.end = _end;
        airdrop.amount = _amount;
        airdrop.amountPerUser = _amountPerUser;
        airdrop.whitelist = _whitelist;
        airdrop.merkleRoot = _merkleRoot;
        emit AirdropCreated(airdropsLength, _start, _end, _amount, _amountPerUser, _whitelist, _merkleRoot);
        airdropsLength++;
    }

    function modifyAirdrop(uint256 airdropId, uint256 _start, uint256 _end, uint256 _amount, uint256 _amountPerUser, bool _whitelist, bytes32 _merkleRoot) public onlyOwner {
        require(airdropId < airdropsLength, "Airdrop does not exist");
        if(_end > 0)
            require(_start < _end, "Start must be before end");
        require(_amount > 0, "Amount must be greater than 0");
        require(_amountPerUser > 0, "Amount per user must be greater than 0");

        AirdropInfo storage airdrop = airdrops[airdropId];

        require(airdrop.claimed <= _amount, "New amount must be greater than or equal to claimed amount");

        if(airdrop.amount > _amount) {
            tokenAddress.transfer(msg.sender, airdrop.amount - _amount);
        } else if(airdrop.amount < _amount) {
            tokenAddress.transferFrom(msg.sender, address(this), _amount - airdrop.amount);
        }

        airdrop.start = _start;
        airdrop.end = _end;
        airdrop.amount = _amount;
        airdrop.amountPerUser = _amountPerUser;
        airdrop.whitelist = _whitelist;
        airdrop.merkleRoot = _merkleRoot;
        emit AirdropModified(airdropId, _start, _end, _amount, _amountPerUser, _whitelist, _merkleRoot);
    }

    function claim(uint256 airdropId, bytes32[] memory merkleProof) public {
        require(airdropId < airdropsLength, "Airdrop does not exist");
        AirdropInfo storage airdrop = airdrops[airdropId];
        require(block.timestamp >= airdrop.start, "Airdrop not started yet");
        require(airdrop.end == 0 || block.timestamp <= airdrop.end, "Airdrop ended");
        require(airdrop.claimed < airdrop.amount, "Airdrop has no tokens left");
        require(!airdrop.claimedUsers[msg.sender], "User already claimed");

        if(airdrop.whitelist) {
            bytes32 node = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(merkleProof, airdrop.merkleRoot, node), "Invalid merkle proof");
        }

        airdrop.claimedUsers[msg.sender] = true;
        airdrop.claimed += airdrop.amountPerUser;
        tokenAddress.transfer(msg.sender, airdrop.amountPerUser);
    }
}