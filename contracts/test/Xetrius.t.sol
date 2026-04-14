// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TeamPass.sol";
import "../src/MissionStamps.sol";
import "../src/QuestEngine.sol";
import "../src/FanWars.sol";

contract XetriusTest is Test {
    TeamPass teamPass;
    MissionStamps stamps;
    QuestEngine engine;
    FanWars fanWars;

    uint256 signerKey = 0xBEEF;
    address signer;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address dave = makeAddr("dave");

    // Cache quest IDs so staticcalls don't eat vm.prank
    uint256 Q_TEAM_PASS;
    uint256 Q_TOSS;
    uint256 Q_CHECKIN;
    uint256 Q_VOTE;
    uint256 Q_REFERRAL;

    function setUp() public {
        signer = vm.addr(signerKey);

        teamPass = new TeamPass();
        stamps = new MissionStamps();
        fanWars = new FanWars();
        engine = new QuestEngine(address(teamPass), address(stamps), address(fanWars));

        stamps.setQuestEngine(address(engine));
        fanWars.setQuestEngine(address(engine));
        engine.setTrustedSigner(signer);

        Q_TEAM_PASS = engine.QUEST_TEAM_PASS();
        Q_TOSS = engine.QUEST_TOSS_PREDICT();
        Q_CHECKIN = engine.QUEST_MATCH_CHECKIN();
        Q_VOTE = engine.QUEST_FAN_VOTE();
        Q_REFERRAL = engine.QUEST_REFERRAL();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════

    function _mintPass(address user, uint8 teamId) internal {
        vm.prank(user);
        teamPass.mint(teamId, address(0));
    }

    function _signProof(address user, uint256 questId, uint256 matchId) internal view returns (bytes memory) {
        bytes32 hash = keccak256(abi.encodePacked(user, questId, matchId));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(hash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function _complete(address user, uint256 questId, uint256 matchId) internal {
        vm.prank(user);
        engine.completeQuest(questId, matchId, "");
    }

    function _completeWithProof(address user, uint256 questId, uint256 matchId) internal {
        bytes memory proof = _signProof(user, questId, matchId);
        vm.prank(user);
        engine.completeQuest(questId, matchId, proof);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TEAM PASS
    // ═══════════════════════════════════════════════════════════════════

    function test_mintTeamPass() public {
        _mintPass(alice, 0);
        assertTrue(teamPass.hasPass(alice));
        assertEq(teamPass.getTeam(alice), 0);
        assertEq(teamPass.teamFanCount(0), 1);
        assertEq(teamPass.totalMinted(), 1);
    }

    function test_mintTeamPass_maxTeamId() public {
        _mintPass(alice, 7);
        assertEq(teamPass.getTeam(alice), 7);
    }

    function test_cannotMintTwice() public {
        _mintPass(alice, 0);
        vm.prank(alice);
        vm.expectRevert(TeamPass.AlreadyHasPass.selector);
        teamPass.mint(1, address(0));
    }

    function test_invalidTeamReverts() public {
        vm.prank(alice);
        vm.expectRevert(TeamPass.InvalidTeam.selector);
        teamPass.mint(8, address(0));
    }

    function test_referralTracking() public {
        _mintPass(alice, 0);
        vm.prank(bob);
        teamPass.mint(1, alice);
        assertEq(teamPass.referralCount(alice), 1);
    }

    function test_getTeam_noPass_reverts() public {
        vm.expectRevert(TeamPass.NoPass.selector);
        teamPass.getTeam(alice);
    }

    function test_soulbound_transferReverts() public {
        _mintPass(alice, 0);
        uint256 tokenId = teamPass.passOf(alice);
        vm.prank(alice);
        vm.expectRevert(TeamPass.Soulbound.selector);
        teamPass.transferFrom(alice, bob, tokenId);
    }

    function test_tokenURI_onchain() public {
        _mintPass(alice, 3);
        uint256 tokenId = teamPass.passOf(alice);
        string memory uri = teamPass.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
        bytes memory prefix = bytes("data:application/json;base64,");
        bytes memory uriBytes = bytes(uri);
        for (uint256 i = 0; i < prefix.length; i++) {
            assertEq(uriBytes[i], prefix[i]);
        }
    }

    function test_changeTeam_after_cooldown() public {
        _mintPass(alice, 0);
        assertEq(teamPass.getTeam(alice), 0);
        vm.warp(block.timestamp + 91 days);
        vm.prank(alice);
        teamPass.changeTeam(3);
        assertEq(teamPass.getTeam(alice), 3);
    }

    function test_changeTeam_tooEarly_reverts() public {
        _mintPass(alice, 0);
        vm.warp(block.timestamp + 89 days);
        vm.prank(alice);
        vm.expectRevert(TeamPass.NotReady.selector);
        teamPass.changeTeam(3);
    }

    function test_changeTeam_noPass_reverts() public {
        vm.prank(alice);
        vm.expectRevert(TeamPass.NoPass.selector);
        teamPass.changeTeam(1);
    }

    function test_changeTeam_invalidTeam_reverts() public {
        _mintPass(alice, 0);
        vm.warp(block.timestamp + 91 days);
        vm.prank(alice);
        vm.expectRevert(TeamPass.InvalidTeam.selector);
        teamPass.changeTeam(8);
    }

    function test_pause_blocks_minting() public {
        teamPass.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        teamPass.mint(0, address(0));

        teamPass.unpause();
        _mintPass(alice, 0);
        assertTrue(teamPass.hasPass(alice));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  QUEST ENGINE — without proof
    // ═══════════════════════════════════════════════════════════════════

    function test_completeQuest_teamPass() public {
        _mintPass(alice, 2);
        _complete(alice, Q_TEAM_PASS, 0);

        assertTrue(engine.completed(alice, Q_TEAM_PASS, 0));
        assertEq(stamps.balanceOf(alice, Q_TEAM_PASS), 1);
        assertEq(fanWars.fanScores(alice), 10);
        assertEq(fanWars.teamScores(2), 10);
    }

    function test_completeQuest_checkin() public {
        _mintPass(alice, 0);
        _complete(alice, Q_CHECKIN, 1);
        assertEq(stamps.balanceOf(alice, Q_CHECKIN), 1);
        assertEq(fanWars.fanScores(alice), 15);
    }

    function test_completeQuest_duplicate_reverts() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);

        vm.prank(alice);
        vm.expectRevert(QuestEngine.AlreadyCompleted.selector);
        engine.completeQuest(Q_TEAM_PASS, 0, "");
    }

    function test_completeQuest_noPass_reverts() public {
        vm.prank(alice);
        vm.expectRevert(QuestEngine.NoPass.selector);
        engine.completeQuest(Q_TEAM_PASS, 0, "");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  QUEST ENGINE — with ECDSA proof
    // ═══════════════════════════════════════════════════════════════════

    function test_completeQuest_withValidProof() public {
        _mintPass(alice, 1);
        _completeWithProof(alice, Q_TOSS, 42);

        assertEq(stamps.balanceOf(alice, Q_TOSS), 1);
        assertEq(fanWars.fanScores(alice), 25);
    }

    function test_completeQuest_invalidProof_reverts() public {
        _mintPass(alice, 1);
        bytes memory badProof = _signProof(bob, Q_TOSS, 42);

        vm.prank(alice);
        vm.expectRevert(QuestEngine.InvalidProof.selector);
        engine.completeQuest(Q_TOSS, 42, badProof);
    }

    function test_completeQuest_emptyProofForProofQuest_reverts() public {
        _mintPass(alice, 1);
        vm.prank(alice);
        vm.expectRevert(); // ECDSA will revert on empty bytes
        engine.completeQuest(Q_TOSS, 42, "");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  QUEST ENGINE — pause / inactive
    // ═══════════════════════════════════════════════════════════════════

    function test_questEngine_pause_blocks_completion() public {
        _mintPass(alice, 0);
        engine.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        engine.completeQuest(Q_TEAM_PASS, 0, "");

        engine.unpause();
        _complete(alice, Q_TEAM_PASS, 0);
        assertTrue(engine.completed(alice, Q_TEAM_PASS, 0));
    }

    function test_inactiveQuest_reverts() public {
        _mintPass(alice, 0);
        engine.updateQuest(Q_TEAM_PASS, 10, false, false);

        vm.prank(alice);
        vm.expectRevert(QuestEngine.QuestInactive.selector);
        engine.completeQuest(Q_TEAM_PASS, 0, "");
    }

    function test_getUserProgress() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);
        _complete(alice, Q_CHECKIN, 0);

        bool[5] memory progress = engine.getUserProgress(alice, 0);
        assertTrue(progress[0]);  // team pass
        assertFalse(progress[1]); // toss predict
        assertTrue(progress[2]);  // checkin
        assertFalse(progress[3]); // vote
        assertFalse(progress[4]); // referral
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MISSION STAMPS — soulbound
    // ═══════════════════════════════════════════════════════════════════

    function test_stamps_soulbound_transferReverts() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);
        assertEq(stamps.balanceOf(alice, Q_TEAM_PASS), 1);

        vm.prank(alice);
        vm.expectRevert(MissionStamps.Soulbound.selector);
        stamps.safeTransferFrom(alice, bob, Q_TEAM_PASS, 1, "");
    }

    function test_stamps_soulbound_batchTransferReverts() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);

        uint256[] memory ids = new uint256[](1);
        ids[0] = Q_TEAM_PASS;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1;

        vm.prank(alice);
        vm.expectRevert(MissionStamps.Soulbound.selector);
        stamps.safeBatchTransferFrom(alice, bob, ids, amounts, "");
    }

    function test_stamps_alreadyEarned_reverts() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);

        vm.prank(alice);
        vm.expectRevert(QuestEngine.AlreadyCompleted.selector);
        engine.completeQuest(Q_TEAM_PASS, 0, "");
    }

    function test_stampCount() public {
        _mintPass(alice, 0);
        assertEq(stamps.stampCount(alice), 0);

        _complete(alice, Q_TEAM_PASS, 0);
        assertEq(stamps.stampCount(alice), 1);

        _complete(alice, Q_CHECKIN, 1);
        assertEq(stamps.stampCount(alice), 2);
    }

    function test_stamps_uri() public view {
        string memory u = stamps.uri(1);
        assertEq(u, "https://xetrius.io/stamps/1");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  FAN WARS — leaderboard
    // ═══════════════════════════════════════════════════════════════════

    function test_leaderboard_updates() public {
        _mintPass(alice, 0);
        _mintPass(bob, 1);
        _mintPass(charlie, 0);

        _complete(alice, Q_TEAM_PASS, 0);   // team 0: +10
        _complete(bob, Q_TEAM_PASS, 0);     // team 1: +10
        _complete(charlie, Q_TEAM_PASS, 0); // team 0: +10

        uint256[8] memory board = fanWars.getLeaderboard();
        assertEq(board[0], 20); // team 0
        assertEq(board[1], 10); // team 1
        assertEq(board[2], 0);  // team 2
    }

    function test_getTopFans() public {
        _mintPass(alice, 0);
        _mintPass(bob, 0);
        _mintPass(charlie, 0);

        // alice: 10 + 15 = 25
        _complete(alice, Q_TEAM_PASS, 0);
        _complete(alice, Q_CHECKIN, 1);

        // bob: 10
        _complete(bob, Q_TEAM_PASS, 0);

        // charlie: 10 + 15 + 15 = 40
        _complete(charlie, Q_TEAM_PASS, 0);
        _complete(charlie, Q_CHECKIN, 1);
        _complete(charlie, Q_VOTE, 0);

        (address[] memory fans, uint256[] memory scores) = fanWars.getTopFans(0, 3);
        assertEq(fans[0], charlie);
        assertEq(scores[0], 40);
        assertEq(fans[1], alice);
        assertEq(scores[1], 25);
        assertEq(fans[2], bob);
        assertEq(scores[2], 10);
    }

    function test_seasonReset() public {
        _mintPass(alice, 0);
        _complete(alice, Q_TEAM_PASS, 0);
        assertEq(fanWars.teamScores(0), 10);
        assertEq(fanWars.fanScores(alice), 10);

        fanWars.seasonReset();
        assertEq(fanWars.teamScores(0), 0);
        assertEq(fanWars.fanScores(alice), 0);
    }

    function test_fanWars_onlyEngine_reverts() public {
        vm.prank(alice);
        vm.expectRevert(FanWars.OnlyQuestEngine.selector);
        fanWars.updateScore(alice, 0, 100);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  INTEGRATION — multi-user full flow
    // ═══════════════════════════════════════════════════════════════════

    function test_fullFlow_multipleUsers_leaderboard() public {
        _mintPass(alice, 0);
        _mintPass(bob, 1);
        _mintPass(charlie, 0);
        _mintPass(dave, 2);

        // Everyone claims team pass stamp (+10)
        _complete(alice, Q_TEAM_PASS, 0);
        _complete(bob, Q_TEAM_PASS, 0);
        _complete(charlie, Q_TEAM_PASS, 0);
        _complete(dave, Q_TEAM_PASS, 0);

        // alice: toss prediction (+25)
        _completeWithProof(alice, Q_TOSS, 1);

        // team 0: alice(35) + charlie(10) = 45
        // team 1: bob(10)
        // team 2: dave(10)
        uint256[8] memory board = fanWars.getLeaderboard();
        assertEq(board[0], 45);
        assertEq(board[1], 10);
        assertEq(board[2], 10);

        assertEq(fanWars.fanScores(alice), 35);
        assertEq(fanWars.fanScores(bob), 10);
        assertEq(fanWars.fanScores(charlie), 10);

        // Top fans for team 0
        (address[] memory fans, uint256[] memory scores) = fanWars.getTopFans(0, 2);
        assertEq(fans[0], alice);
        assertEq(scores[0], 35);
        assertEq(fans[1], charlie);
        assertEq(scores[1], 10);
    }

    function test_addQuest_and_complete() public {
        engine.addQuest(10, 50, false);
        _mintPass(alice, 0);

        _complete(alice, 10, 0);
        assertEq(fanWars.fanScores(alice), 50);
    }

    function test_questNotFound_reverts() public {
        _mintPass(alice, 0);
        vm.prank(alice);
        vm.expectRevert(QuestEngine.QuestNotFound.selector);
        engine.completeQuest(99, 0, "");
    }

    function test_setTrustedSigner() public {
        address newSigner = makeAddr("newSigner");
        engine.setTrustedSigner(newSigner);
        assertEq(engine.trustedSigner(), newSigner);
    }
}
