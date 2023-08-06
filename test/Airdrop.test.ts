import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import MerkleTree from "merkletreejs";

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

    async function fixtureWithAirdrops() {
        const { airdrop, utilityToken, owner, user1, user2 } = await fixture();
        const amount = ethers.parseEther('20');
        await utilityToken.approve(airdrop.getAddress(), ethers.parseEther('100000'));
        const start = Math.floor(new Date().getTime() / 1000) - 1;
        const end = start + 60;
        const amountPerUser = ethers.parseEther('10');
        const whitelisted = false;
        const merkleRoot = ethers.ZeroHash;
        // No whitelist - id: 0
        await airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot);

        const whitelist = [
            ethers.keccak256(await owner.getAddress()),
            ethers.keccak256(await user1.getAddress()),
        ]
        const tree = new MerkleTree(whitelist, ethers.keccak256, { sort: true })
        // With whitelist - id: 1
        await airdrop.createAirdrop(start, end, amount, amountPerUser, true, tree.getHexRoot().toString());

        // Not started yet - id: 2
        await airdrop.createAirdrop(start + 10000, end + 10000, amount, amountPerUser, whitelisted, merkleRoot);

        // End time equal 0
        await airdrop.createAirdrop(start, 0, amount, amountPerUser, whitelisted, merkleRoot);

        return { airdrop, utilityToken, owner, user1, user2, tree };
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
            expect(await airdrop.airdropsLength()).to.equal(1);
        })

        it('Create airdrop with invalid start time', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixture);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start - 60;
            const amountPerUser = ethers.parseEther('10');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Start must be before end');
        })

        it('Create airdrop with invalid amount per user', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixture);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('1001');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Amount per user must be less than or equal to amount');
        })

        it('Create airdrop with invalid amount', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixture);
            const amount = ethers.parseEther('0');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('0');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Amount must be greater than 0');
        })

        it('Create airdrop with amount per user equal 0', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixture);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('0');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.createAirdrop(start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Amount per user must be greater than 0');
        })
    })

    describe('Modify airdrop', () => {
        it('Modify airdrop as not owner', async () => {
            const { user1, airdrop } = await loadFixture(fixtureWithAirdrops);
            await expect(airdrop.connect(user1).modifyAirdrop(0, 0, 0, 0, 0, false, ethers.ZeroHash)).to.be.revertedWith('Ownable: caller is not the owner');
        })

        it('Modify not existed airdrop', async () => {
            const { owner, airdrop } = await loadFixture(fixtureWithAirdrops);
            await expect(airdrop.connect(owner).modifyAirdrop(5, 0, 0, 0, 0, false, ethers.ZeroHash)).to.be.revertedWith('Airdrop does not exist');
        });

        it('Modify airdrop with invalid start time', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start - 60;
            const amountPerUser = ethers.parseEther('10');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.modifyAirdrop(0, start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Start must be before end');
        })

        it('Modify airdrop with invalid amount', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const amount = ethers.parseEther('0');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('0');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await expect(airdrop.modifyAirdrop(0, start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Amount must be greater than 0');
        })

        // it('Modify airdrop with invalid amount per user', async () => {
        //     const { airdrop, utilityToken } = await loadFixture(fixtureWithAirdrops);
        //     const amount = ethers.parseEther('1000');
        //     await utilityToken.approve(airdrop.getAddress(), amount);
        //     const start = Math.floor(new Date().getTime() / 1000);
        //     const end = start + 60;
        //     const amountPerUser = ethers.parseEther('1001');
        //     const whitelisted = false;
        //     const merkleRoot = ethers.ZeroHash;
        //     await expect(airdrop.modifyAirdrop(0, start, end, amount, amountPerUser, whitelisted, merkleRoot)).to.be.revertedWith('Amount per user must be less than or equal to amount');
        // })

        it('Modify airdrop with amount geather than left tokens', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const amount = ethers.parseEther('1000');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('1000');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await airdrop.modifyAirdrop(0, start, end, amount, amountPerUser, whitelisted, merkleRoot);
        })

        it('Modify airdrop with amount less than left tokens', async () => {
            const { airdrop, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const amount = ethers.parseEther('5');
            await utilityToken.approve(airdrop.getAddress(), amount);
            const start = Math.floor(new Date().getTime() / 1000);
            const end = start + 60;
            const amountPerUser = ethers.parseEther('5');
            const whitelisted = false;
            const merkleRoot = ethers.ZeroHash;
            await airdrop.modifyAirdrop(0, start, end, amount, amountPerUser, whitelisted, merkleRoot);
        })
    })

    describe('Claim airdrop', () => {
        it('Claim airdrop', async () => {
            const { user1, utilityToken, airdrop } = await loadFixture(fixtureWithAirdrops);
            const balanceBefore = await utilityToken.balanceOf(user1.getAddress());
            await airdrop.connect(user1).claim(0, []);
            const balanceAfter = await utilityToken.balanceOf(user1.getAddress());
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther('10'));
        })

        it('Claim second time', async () => {
            const { user1, airdrop } = await loadFixture(fixtureWithAirdrops);
            await airdrop.connect(user1).claim(0, []);
            await expect(airdrop.connect(user1).claim(0, [])).to.be.revertedWith('User already claimed');
        })

        it('Claim not existed airdrop', async () => {
            const { user1, airdrop } = await loadFixture(fixtureWithAirdrops);
            await expect(airdrop.connect(user1).claim(5, [])).to.be.revertedWith('Airdrop does not exist');
        })

        it('Claim not started yet airdrop', async () => {
            const { user1, airdrop } = await loadFixture(fixtureWithAirdrops);
            await expect(airdrop.connect(user1).claim(2, [])).to.be.revertedWith('Airdrop not started yet');
        });

        it('Claim ended airdrop', async () => {
            const { user1, airdrop } = await loadFixture(fixtureWithAirdrops);
            await time.increase(61);
            await expect(airdrop.connect(user1).claim(0, [])).to.be.revertedWith('Airdrop ended');
        });

        it('Claim airdrop where no left tokens', async () => {
            const { owner, user1, user2, airdrop } = await loadFixture(fixtureWithAirdrops);
            await airdrop.connect(owner).claim(0, []);
            await airdrop.connect(user1).claim(0, []);
            await expect(airdrop.connect(user2).claim(0, [])).to.be.revertedWith('Airdrop has no tokens left');
        })

        it('Claim airdrop with whitelist (different proof with different user)', async () => {
            const { user1, user2, airdrop, tree } = await loadFixture(fixtureWithAirdrops);
            const proof = tree.getHexProof(ethers.keccak256(await user1.getAddress()));
            await expect(airdrop.connect(user2).claim(1, proof)).to.be.revertedWith('Invalid merkle proof');
        });

        it('Claim airdrop with whitelist', async () => {
            const { user1, airdrop, tree, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const leaf = ethers.keccak256(await user1.getAddress());
            let proof = tree.getHexProof(leaf);
            const balanceBefore = await utilityToken.balanceOf(user1.getAddress());
            await airdrop.connect(user1).claim(1, proof);
            const balanceAfter = await utilityToken.balanceOf(user1.getAddress());
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther('10'));
        })

        it('Claim airdrop with whitelist and end time equal 0', async () => {
            const { user1, airdrop, tree, utilityToken } = await loadFixture(fixtureWithAirdrops);
            const leaf = ethers.keccak256(await user1.getAddress());
            let proof = tree.getHexProof(leaf);
            const balanceBefore = await utilityToken.balanceOf(user1.getAddress());
            await airdrop.connect(user1).claim(3, proof);
            const balanceAfter = await utilityToken.balanceOf(user1.getAddress());
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther('10'));
        })
    })
})