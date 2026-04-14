-include .env

.PHONY: build test deploy-local deploy-wirefluid coverage clean

build:
	forge build

test:
	forge test -vvv

deploy-local:
	forge script script/Deploy.s.sol:DeployXetrius --fork-url http://localhost:8545 --broadcast

deploy-wirefluid:
	forge script script/Deploy.s.sol:DeployXetrius --rpc-url $(RPC_URL_WIREFLUID) --private-key $(PRIVATE_KEY) --broadcast --verify

coverage:
	forge coverage --report lcov
	@echo "Coverage report written to lcov.info"

clean:
	forge clean
