/**
 * config.js
 *
 * Runtime configuration for the Calculator.sol frontend.
 *
 *     This file is listed in .gitignore and must NOT be committed to version
 *     control — it contains the live contract address which, while public on
 *     the blockchain, should be kept out of source history to avoid confusion
 *     when the contract is redeployed.
 *
 * To set up a fresh clone:
 *   cp src/js/config.example.js src/js/config.js
 *   # then fill in CONTRACT_ADDRESS with your deployed address
 */

export const CONFIG = {
  /**
   * Address of the Calculator contract deployed on Sepolia.
   * Obtained from Remix IDE after a successful deployment.
   * Verifiable at: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
   */
  CONTRACT_ADDRESS: '0x890A839Fde6E9B3e887b3dF8eC1A8cE23AAbB313',

  /**
   * Sepolia testnet chain ID (decimal).
   * Used to verify that the user's wallet is on the correct network
   * before allowing any contract interaction.
   * Compared as a string to avoid BigInt / Number type mismatches
   * introduced by ethers.js v6 returning chainId as BigInt.
   */
  NETWORK_ID: 11155111,
};
