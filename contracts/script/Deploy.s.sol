// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TeamPass.sol";
import "../src/MissionStamps.sol";
import "../src/QuestEngine.sol";
import "../src/FanWars.sol";

/// @title DeployXetrius
/// @notice Deploys all 4 Xetrius contracts in dependency order and wires them together.
contract DeployXetrius is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address verifier = vm.envOr("VERIFIER_ADDRESS", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);

        // 1. Deploy standalone contracts first
        TeamPass teamPass = new TeamPass();
        MissionStamps stamps = new MissionStamps();
        FanWars fanWars = new FanWars();

        // 2. Deploy QuestEngine with references to the above
        QuestEngine engine = new QuestEngine(
            address(teamPass),
            address(stamps),
            address(fanWars)
        );

        // 3. Wire QuestEngine into stamps and fanWars
        stamps.setQuestEngine(address(engine));
        fanWars.setQuestEngine(address(engine));

        // 4. Set the trusted signer for proof-based quests
        engine.setTrustedSigner(verifier);

        vm.stopBroadcast();

        // Log all deployed addresses
        console.log("=== Xetrius Deployed ===");
        console.log("TeamPass:      ", address(teamPass));
        console.log("MissionStamps: ", address(stamps));
        console.log("FanWars:       ", address(fanWars));
        console.log("QuestEngine:   ", address(engine));
        console.log("TrustedSigner: ", verifier);
    }
}
