import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe('UtitlityToken', () => {
    async function fixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const UtilityToken = await ethers.getContractFactory("UtilityToken");
        const utilityToken = await UtilityToken.deploy('UtilityToken', 'UT');
        return { owner, addr1, addr2, utilityToken };
    }

    it('Check params after deploy', async () => {
        const { owner, addr1, addr2, utilityToken } = await loadFixture(fixture);
        expect(await utilityToken.name()).to.equal('UtilityToken');
        expect(await utilityToken.symbol()).to.equal('UT');
        expect(await utilityToken.decimals()).to.equal(18);
        expect(await utilityToken.totalSupply()).to.equal(0);
        expect(await utilityToken.balanceOf(owner.address)).to.equal(0);
    })

    it('Try mint as not owner', async () => {
        const { addr1, utilityToken } = await loadFixture(fixture);
        await expect(utilityToken.connect(addr1).mint(addr1.address, 100)).to.be.revertedWith('Ownable: caller is not the owner');
    })

    it('Mint as owner', async () => {
        const { owner, addr1, utilityToken } = await loadFixture(fixture);
        await utilityToken.mint(addr1.address, 100);
        expect(await utilityToken.balanceOf(addr1.address)).to.equal(100);
    })
});