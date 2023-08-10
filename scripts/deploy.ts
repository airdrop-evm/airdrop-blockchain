import { ethers } from "hardhat";

async function main() {
  const utilityToken = await ethers.deployContract("UtilityToken", ['UtilityToken', 'UT']);

  await utilityToken.waitForDeployment();

  console.log('UtilityToken deployed to:', utilityToken.target);

  const airdrop = await ethers.deployContract('Airdrop', [utilityToken.target]);

  await airdrop.waitForDeployment();

  console.log('Airdrop deployed to:', airdrop.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
