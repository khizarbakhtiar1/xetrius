-include .env

.PHONY: build test deploy-local deploy-wirefluid coverage clean

build:
	forge build

test:
	forge test -vvv

deploy-local:
	forge script script/Deploy.s.sol:DeployXetrius --fork-url http://localhost:8545 --broadcast

# Broadcast only. Verify manually on https://wirefluidscan.com or add --verify and Blockscout flags to this line once you have explorer API details.
deploy-wirefluid:
	forge script script/Deploy.s.sol:DeployXetrius --rpc-url $(RPC_URL_WIREFLUID) --private-key $(PRIVATE_KEY) --broadcast

coverage:
	forge coverage --report lcov
	@echo "Coverage report written to lcov.info"

clean:
	forge clean
