# Airdrop Smart Contract

This is a Solidity smart contract that facilitates the distribution of tokens through airdrop campaigns. The contract allows the owner to create and manage airdrop campaigns, set specific conditions, and enables users to claim their allocated tokens based on a whitelist or merkle proof.

## Features

- Create and manage airdrop campaigns with specified parameters.
- Control start and end times for each airdrop.
- Specify the total amount of tokens to be distributed for each airdrop.
- Set the maximum amount of tokens each user can claim.
- Choose whether to use a whitelist for participants.
- Verify user eligibility using merkle proofs for whitelist-enabled airdrops.
- Secure ownership control using OpenZeppelin's Ownable contract.
- ERC20 token support for distribution.

## Prerequisites

- Solidity compiler version 0.8.21 or compatible.
- OpenZeppelin library with contracts such as `Ownable`, `IERC20`, and `MerkleProof`.
- Deployed ERC20 token contract to distribute.

## Getting Started

1. Install the required dependencies by running:

```bash
npm install
```
2. Compile smart contracts

```bash
npm run compile
```

3. Deploy the Airdrop contract using a compatible Solidity development environment.
4. Interact with the deployed contract to create, modify, and manage airdrop campaigns.
5. Users can claim their allocated tokens by providing a valid merkle proof (if whitelist-enabled).

## Usage
### Contract Deployment
Deploy the Airdrop contract by providing the address of the ERC20 token contract as a constructor argument.

### Creating Airdrops
Use the createAirdrop function to create new airdrop campaigns. Provide the following parameters:

- **_start**: Start timestamp for the airdrop.
- **_end**: End timestamp for the airdrop. Set to 0 if no end time.
- **_amount**: Total amount of tokens for the airdrop.
- **_amountPerUser**: Maximum amount of tokens each user can claim.
- **_whitelist**: Set to true to enable whitelist-based claims, false otherwise.
- **_merkleRoot**: The merkle root hash for whitelist verification.

### Modifying Airdrops
Existing airdrops can be modified using the modifyAirdrop function. Provide the airdrop ID and updated parameters similar to the createAirdrop function.

### Claiming Tokens
Users can claim tokens from an airdrop using the claim function. Provide the airdrop ID and a valid merkle proof (if whitelist-enabled).

## Events
- **AirdropCreated**: Emits when a new airdrop campaign is created.
- **AirdropModified**: Emits when an existing airdrop campaign is modified.
- **Claim**: Emits when user claim toens from existing airdrop campaign.

## License
This smart contract is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Disclaimer
This smart contract is provided as-is and has not been audited. Use it at your own risk. The authors and contributors are not responsible for any loss or damages caused by the use of this contract.