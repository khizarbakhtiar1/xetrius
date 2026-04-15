import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL_WIREFLUID ?? "https://evm.wirefluid.com";
const TEAM_PASS_ADDRESS = process.env.NEXT_PUBLIC_TEAM_PASS_ADDRESS ?? "";

const TEAM_PASS_READ_ABI = [
  "function hasPass(address user) view returns (bool)",
  "function referralCount(address) view returns (uint256)",
];

let _provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

function getTeamPassContract(): ethers.Contract {
  return new ethers.Contract(TEAM_PASS_ADDRESS, TEAM_PASS_READ_ABI, getProvider());
}

export async function verifyHasPass(userAddress: string): Promise<boolean> {
  const contract = getTeamPassContract();
  return contract.hasPass(userAddress);
}

export async function getReferralCount(userAddress: string): Promise<number> {
  const contract = getTeamPassContract();
  const count: bigint = await contract.referralCount(userAddress);
  return Number(count);
}
