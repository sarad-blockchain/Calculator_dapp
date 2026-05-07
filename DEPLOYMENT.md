# Deployment Guide

This guide covers two independent steps:

1. [Deploy the smart contract](#1-deploy-the-smart-contract) to the Sepolia testnet using Remix IDE
2. [Deploy the frontend](#2-deploy-the-frontend) to Vercel

---

## Prerequisites

- [MetaMask](https://metamask.io) installed in your browser
- Sepolia ETH in your wallet — get some for free from the [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

---

## 1. Deploy the smart contract

### 1.1 Open Remix IDE

Go to [remix.ethereum.org](https://remix.ethereum.org).

### 1.2 Create the contract file

In the File Explorer panel, create a new file called `Calculator.sol` and paste in the contents of `contracts/Calculator.sol` from this repo.

### 1.3 Compile

Go to the **Solidity Compiler** tab (the `<S>` icon on the left sidebar).

- Set the compiler version to `0.8.34` (or any `^0.8.34` compatible version)
- Click **Compile Calculator.sol**

If compilation succeeds you will see a green checkmark.

### 1.4 Deploy to Sepolia

Go to the **Deploy & Run Transactions** tab (the Ethereum icon).

- Under **Environment**, select **Injected Provider - MetaMask**
- MetaMask will ask you to connect — approve it
- Make sure the selected network in MetaMask is **Sepolia Testnet**. If not, switch to it before continuing
- Under **Contract**, select `Calculator`
- Click **Deploy** and confirm the transaction in MetaMask

Once the transaction is mined, the contract address will appear under **Deployed Contracts** at the bottom of the panel.

### 1.5 Copy the contract address

Click the copy icon next to the deployed contract address. You will need it in the next step.

You can verify the deployment on [Sepolia Etherscan](https://sepolia.etherscan.io) by pasting the address in the search bar.

---

## 2. Deploy the frontend

### 2.1 Set the contract address

Open `src/js/config.js` and replace the value of `CONTRACT_ADDRESS` with the address you copied in step 1.5:

```js
export const CONFIG = {
  CONTRACT_ADDRESS: '0xYourContractAddressHere',
  NETWORK_ID: 11155111,
};
```

### 2.2 Push to GitHub

Commit and push your changes to a GitHub repository.

### 2.3 Deploy on Vercel

Go to [vercel.com](https://vercel.com), sign in with your GitHub account, import your repository and click **Deploy**. Vercel detects it as a static site automatically — no build configuration needed.

---

## Redeploying the contract

If you redeploy the contract (e.g. after making changes to `Calculator.sol`), a new address will be generated. Update `CONTRACT_ADDRESS` in `config.js` and push again — Vercel will redeploy automatically.
