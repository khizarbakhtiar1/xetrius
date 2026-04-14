// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FanWars
/// @notice Tracks franchise-vs-franchise and individual fan scores for Xetrius.
/// @dev Only the QuestEngine may update scores.
contract FanWars is Ownable {
    uint8 public constant NUM_TEAMS = 8;

    /// @notice The QuestEngine address authorised to update scores.
    address public questEngine;

    /// @notice Cumulative points per team (indexed 0-7).
    mapping(uint8 => uint256) public teamScores;

    /// @notice Cumulative points per fan.
    mapping(address => uint256) public fanScores;

    /// @notice Which team a fan belongs to (set on first score update).
    mapping(address => uint8) public fanTeam;

    /// @notice All fans that belong to a specific team.
    mapping(uint8 => address[]) private _teamFans;

    /// @notice Whether we've already tracked a fan in a team's array.
    mapping(uint8 => mapping(address => bool)) private _isFanTracked;

    // ── Events ──────────────────────────────────────────────────────────

    event ScoreUpdated(address indexed user, uint8 teamId, uint256 points, uint256 newTotal);
    event QuestEngineSet(address indexed newEngine);
    event SeasonReset();

    // ── Errors ──────────────────────────────────────────────────────────

    error OnlyQuestEngine();

    // ── Constructor ─────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ── Admin ───────────────────────────────────────────────────────────

    /// @notice Set the QuestEngine address.
    /// @param _engine The QuestEngine contract address.
    function setQuestEngine(address _engine) external onlyOwner {
        questEngine = _engine;
        emit QuestEngineSet(_engine);
    }

    // ── Score Updates ───────────────────────────────────────────────────

    /// @notice Add points for a fan and their team. Only callable by QuestEngine.
    /// @param user The fan address.
    /// @param teamId The team id (0-7).
    /// @param points The points to add.
    function updateScore(address user, uint8 teamId, uint256 points) external {
        if (msg.sender != questEngine) revert OnlyQuestEngine();

        teamScores[teamId] += points;
        fanScores[user] += points;
        fanTeam[user] = teamId;

        if (!_isFanTracked[teamId][user]) {
            _teamFans[teamId].push(user);
            _isFanTracked[teamId][user] = true;
        }

        emit ScoreUpdated(user, teamId, points, fanScores[user]);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /// @notice Returns all 8 team scores in order (index 0-7).
    /// @return scores Array of 8 uint256 values.
    function getLeaderboard() external view returns (uint256[8] memory scores) {
        for (uint8 i = 0; i < NUM_TEAMS; i++) {
            scores[i] = teamScores[i];
        }
    }

    /// @notice Returns the top `count` fan addresses for a team, sorted by score descending.
    /// @param teamId The team to query (0-7).
    /// @param count Maximum number of fans to return.
    /// @return topFans Sorted array of fan addresses.
    /// @return topScores Corresponding scores.
    function getTopFans(uint8 teamId, uint256 count)
        external
        view
        returns (address[] memory topFans, uint256[] memory topScores)
    {
        address[] storage fans = _teamFans[teamId];
        uint256 total = fans.length;
        if (count > total) count = total;

        address[] memory addrs = new address[](total);
        uint256[] memory scores = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            addrs[i] = fans[i];
            scores[i] = fanScores[fans[i]];
        }

        // Selection sort for top `count`
        for (uint256 i = 0; i < count; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; j++) {
                if (scores[j] > scores[maxIdx]) maxIdx = j;
            }
            if (maxIdx != i) {
                (addrs[i], addrs[maxIdx]) = (addrs[maxIdx], addrs[i]);
                (scores[i], scores[maxIdx]) = (scores[maxIdx], scores[i]);
            }
        }

        topFans = new address[](count);
        topScores = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            topFans[i] = addrs[i];
            topScores[i] = scores[i];
        }
    }

    /// @notice Total number of tracked fans for a team.
    /// @param teamId The team to query.
    /// @return The count of fans.
    function teamFanCount(uint8 teamId) external view returns (uint256) {
        return _teamFans[teamId].length;
    }

    // ── Season Management ───────────────────────────────────────────────

    /// @notice Reset all scores for a new season. Only callable by owner.
    function seasonReset() external onlyOwner {
        for (uint8 i = 0; i < NUM_TEAMS; i++) {
            teamScores[i] = 0;
            address[] storage fans = _teamFans[i];
            for (uint256 j = 0; j < fans.length; j++) {
                fanScores[fans[j]] = 0;
            }
        }
        emit SeasonReset();
    }
}
