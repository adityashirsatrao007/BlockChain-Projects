// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address voter);
    event ElectionEnded(uint256 indexed electionId);

    modifier onlyActiveElection(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election has not started");
        require(block.timestamp <= elections[_electionId].endTime, "Election has ended");
        _;
    }

    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) public returns (uint256) {
        require(_startTime < _endTime, "End time must be after start time");
        require(_startTime > block.timestamp, "Start time must be in the future");

        electionCount++;
        uint256 electionId = electionCount;

        Election storage newElection = elections[electionId];
        newElection.id = electionId;
        newElection.title = _title;
        newElection.description = _description;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        newElection.isActive = true;
        newElection.candidateCount = 0;

        emit ElectionCreated(electionId, _title, _startTime, _endTime);
        return electionId;
    }

    function addCandidate(uint256 _electionId, string memory _name) public {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp < elections[_electionId].startTime, "Cannot add candidates after election starts");

        uint256 candidateId = elections[_electionId].candidateCount;
        elections[_electionId].candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            voteCount: 0
        });
        elections[_electionId].candidateCount++;
    }

    function castVote(uint256 _electionId, uint256 _candidateId) public onlyActiveElection(_electionId) {
        require(!elections[_electionId].hasVoted[msg.sender], "Already voted");
        require(_candidateId < elections[_electionId].candidateCount, "Invalid candidate");

        elections[_electionId].hasVoted[msg.sender] = true;
        elections[_electionId].candidates[_candidateId].voteCount++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    function endElection(uint256 _electionId) public {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp > elections[_electionId].endTime, "Election has not ended");

        elections[_electionId].isActive = false;
        emit ElectionEnded(_electionId);
    }

    function getElectionDetails(uint256 _electionId) public view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 candidateCount
    ) {
        Election storage election = elections[_electionId];
        return (
            election.title,
            election.description,
            election.startTime,
            election.endTime,
            election.isActive,
            election.candidateCount
        );
    }

    function getCandidateDetails(uint256 _electionId, uint256 _candidateId) public view returns (
        string memory name,
        uint256 voteCount
    ) {
        require(_candidateId < elections[_electionId].candidateCount, "Invalid candidate");
        Candidate storage candidate = elections[_electionId].candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function hasVoted(uint256 _electionId, address _voter) public view returns (bool) {
        return elections[_electionId].hasVoted[_voter];
    }
} 