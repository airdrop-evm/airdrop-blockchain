import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe('Airdrop', () => {
    async function fixture() {
        const [owner, user1, user2] = await ethers.getSigners();
        const UtilityToken = await ethers.getContractFactory("UtilityToken");
        const utilityToken = await UtilityToken.deploy('UtilityToken', 'UT');
        await utilityToken.mint(owner.getAddress(), ethers.parseEther('1000000'));
        const Airdrop = await ethers.getContractFactory("Airdrop");
        const airdrop = await Airdrop.deploy(utilityToken.getAddress());
        return { airdrop, utilityToken, owner, user1, user2 };
    }

    describe('Create airdrop', () => {
        it('Should create airdrop', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixture);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('10');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot);
            expect(await airdrop.airdrops(0)).to.deep.equal([BigInt(start), BigInt(end), BigInt(amount), BigInt(0), BigInt(amountPerUser), whitelisted, merkleRoot]);

        })
    })
})