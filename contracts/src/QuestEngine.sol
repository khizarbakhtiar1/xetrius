// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./TeamPass.sol";
import "./MissionStamps.sol";
import "./FanWars.sol";

/// @title QuestEngine
/// @notice Core quest orchestrator for Xetrius. Validates completions, mints stamps, updates scores.
/// @dev Uses checks-effects-interactions. State is always updated before external calls.
contract QuestEngine is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ── External Contracts ──────────────────────────────────────────────

    TeamPass public immutable teamPass;
    MissionStamps public immutable missionStamps;
    FanWars public immutable fanWars;

    // ── Quest Definitions ───────────────────────────────────────────────

    struct Quest {
        uint256 questId;
        uint256 points;
        bool requiresProof;
        bool active;
    }

    /// @notice Quest id → Quest config.
    mapping(uint256 => Quest) public quests;

    /// @notice Per-user, per-quest, per-match completion tracking.
    /// @dev completed[user][questId][matchId] => bool
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public completed;

    /// @notice Backend signer for proof-based quests.
    address public trustedSigner;

    // ── Quest ID Constants ──────────────────────────────────────────────

    uint256 public constant QUEST_TEAM_PASS = 1;
    uint256 public constant QUEST_TOSS_PREDICT = 2;
    uint256 public constant QUEST_MATCH_CHECKIN = 3;
    uint256 public constant QUEST_FAN_VOTE = 4;
    uint256 public constant QUEST_REFERRAL = 5;

    // ── Events ──────────────────────────────────────────────────────────

    event QuestCompleted(
        address indexed user, uint256 questId, uint256 matchId, uint8 teamId, uint256 points
    );
    event QuestAdded(uint256 indexed questId, uint256 points, bool requiresProof);
    event QuestUpdated(uint256 indexed questId, uint256 points, bool requiresProof, bool active);
    event TrustedSignerSet(address indexed signer);

    // ── Errors ──────────────────────────────────────────────────────────

    error NoPass();
    error QuestInactive();
    error AlreadyCompleted();
    error InvalidProof();
    error QuestNotFound();

    // ── Constructor ─────────────────────────────────────────────────────

    /// @param _teamPass Address of the TeamPass contract.
    /// @param _missionStamps Address of the MissionStamps contract.
    /// @param _fanWars Address of the FanWars contract.
    constructor(address _teamPass, address _missionStamps, address _fanWars) Ownable(msg.sender) {
        teamPass = TeamPass(_teamPass);
        missionStamps = MissionStamps(_missionStamps);
        fanWars = FanWars(_fanWars);

        // Seed the 5 default quests
        quests[QUEST_TEAM_PASS] = Quest(QUEST_TEAM_PASS, 10, false, true);
        quests[QUEST_TOSS_PREDICT] = Quest(QUEST_TOSS_PREDICT, 25, true, true);
        quests[QUEST_MATCH_CHECKIN] = Quest(QUEST_MATCH_CHECKIN, 15, false, true);
        quests[QUEST_FAN_VOTE] = Quest(QUEST_FAN_VOTE, 15, false, true);
        quests[QUEST_REFERRAL] = Quest(QUEST_REFERRAL, 30, false, true);
    }

    // ── Core Quest Completion ───────────────────────────────────────────

    /// @notice Complete a quest for a specific match. Mints a stamp and updates score.
    /// @param questId The quest to complete (1-5).
    /// @param matchId The match context (0 for non-match quests).
    /// @param proof ECDSA signature from trustedSigner (empty bytes for non-proof quests).
    function completeQuest(uint256 questId, uint256 matchId, bytes calldata proof)
        external
        nonReentrant
        whenNotPaused
    {
        // ── Checks ──────────────────────────────────────────────────
        if (!teamPass.hasPass(msg.sender)) revert NoPass();

        Quest storage quest = quests[questId];
        if (quest.questId == 0) revert QuestNotFound();
        if (!quest.active) revert QuestInactive();
        if (completed[msg.sender][questId][matchId]) revert AlreadyCompleted();

        if (quest.requiresProof) {
            bytes32 msgHash = keccak256(abi.encodePacked(msg.sender, questId, matchId));
            bytes32 ethHash = msgHash.toEthSignedMessageHash();
            if (ethHash.recover(proof) != trustedSigner) revert InvalidProof();
        }

        // ── Effects ─────────────────────────────────────────────────
        completed[msg.sender][questId][matchId] = true;

        uint8 teamId = teamPass.getTeam(msg.sender);
        uint256 points = quest.points;

        // ── Interactions ────────────────────────────────────────────
        missionStamps.mintStamp(msg.sender, questId, matchId);
        fanWars.updateScore(msg.sender, teamId, points);

        emit QuestCompleted(msg.sender, questId, matchId, teamId, points);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /// @notice Returns completion status for all 5 default quests for a user/match.
    /// @param user The fan address.
    /// @param matchId The match context.
    /// @return status Array of 5 booleans (index 0 = quest 1, etc.).
    function getUserProgress(address user, uint256 matchId)
        external
        view
        returns (bool[5] memory status)
    {
        status[0] = completed[user][QUEST_TEAM_PASS][matchId];
        status[1] = completed[user][QUEST_TOSS_PREDICT][matchId];
        status[2] = completed[user][QUEST_MATCH_CHECKIN][matchId];
        status[3] = completed[user][QUEST_FAN_VOTE][matchId];
        status[4] = completed[user][QUEST_REFERRAL][matchId];
    }

    // ── Admin Functions ─────────────────────────────────────────────────

    /// @notice Add or overwrite a quest definition.
    /// @param questId The quest id.
    /// @param points Points awarded on completion.
    /// @param requiresProof Whether ECDSA proof is required.
    function addQuest(uint256 questId, uint256 points, bool requiresProof) external onlyOwner {
        quests[questId] = Quest(questId, points, requiresProof, true);
        emit QuestAdded(questId, points, requiresProof);
    }

    /// @notice Update an existing quest's configuration.
    /// @param questId The quest id to update.
    /// @param points New points value.
    /// @param requiresProof New proof requirement.
    /// @param active Whether the quest is active.
    function updateQuest(uint256 questId, uint256 points, bool requiresProof, bool active)
        external
        onlyOwner
    {
        quests[questId] = Quest(questId, points, requiresProof, active);
        emit QuestUpdated(questId, points, requiresProof, active);
    }

    /// @notice Set the trusted backend signer for proof-based quests.
    /// @param signer The signer address.
    function setTrustedSigner(address signer) external onlyOwner {
        trustedSigner = signer;
        emit TrustedSignerSet(signer);
    }

    /// @notice Pause the engine. No quests can be completed while paused.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the engine.
    function unpause() external onlyOwner {
        _unpause();
    }
}
