const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.deployed();
  });

  describe("Election Creation", function () {
    it("Should create a new election", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const endTime = startTime + 86400; // 24 hours later

      const tx = await voting.createElection(
        "Test Election",
        "Test Description",
        startTime,
        endTime
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ElectionCreated');
      
      expect(event.args.electionId).to.equal(1);
      expect(event.args.title).to.equal("Test Election");
    });

    it("Should not create election with invalid times", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const endTime = startTime + 86400;

      await expect(
        voting.createElection(
          "Test Election",
          "Test Description",
          startTime,
          endTime
        )
      ).to.be.revertedWith("Start time must be in the future");
    });
  });

  describe("Candidate Management", function () {
    let electionId;

    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 86400;
      const tx = await voting.createElection(
        "Test Election",
        "Test Description",
        startTime,
        endTime
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ElectionCreated');
      electionId = event.args.electionId;
    });

    it("Should add a candidate", async function () {
      await voting.addCandidate(electionId, "Candidate 1");
      const [name, voteCount] = await voting.getCandidateDetails(electionId, 0);
      expect(name).to.equal("Candidate 1");
      expect(voteCount).to.equal(0);
    });

    it("Should not add candidate after election starts", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        voting.addCandidate(electionId, "Candidate 1")
      ).to.be.revertedWith("Cannot add candidates after election starts");
    });
  });

  describe("Voting", function () {
    let electionId;

    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 86400;
      const tx = await voting.createElection(
        "Test Election",
        "Test Description",
        startTime,
        endTime
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ElectionCreated');
      electionId = event.args.electionId;

      await voting.addCandidate(electionId, "Candidate 1");
      await voting.addCandidate(electionId, "Candidate 2");

      // Fast forward to election start
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
    });

    it("Should allow a voter to cast a vote", async function () {
      await voting.connect(voter1).castVote(electionId, 0);
      const [name, voteCount] = await voting.getCandidateDetails(electionId, 0);
      expect(voteCount).to.equal(1);
    });

    it("Should not allow double voting", async function () {
      await voting.connect(voter1).castVote(electionId, 0);
      await expect(
        voting.connect(voter1).castVote(electionId, 1)
      ).to.be.revertedWith("Already voted");
    });

    it("Should not allow voting for invalid candidate", async function () {
      await expect(
        voting.connect(voter1).castVote(electionId, 2)
      ).to.be.revertedWith("Invalid candidate");
    });
  });

  describe("Election End", function () {
    let electionId;

    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 86400;
      const tx = await voting.createElection(
        "Test Election",
        "Test Description",
        startTime,
        endTime
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ElectionCreated');
      electionId = event.args.electionId;
    });

    it("Should end election after end time", async function () {
      // Fast forward past end time
      await ethers.provider.send("evm_increaseTime", [86400 + 3600]);
      await ethers.provider.send("evm_mine");

      const tx = await voting.endElection(electionId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ElectionEnded');
      
      expect(event.args.electionId).to.equal(electionId);
    });

    it("Should not end election before end time", async function () {
      await expect(
        voting.endElection(electionId)
      ).to.be.revertedWith("Election has not ended");
    });
  });
}); 