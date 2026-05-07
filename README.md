# Calculator Dapp

A smart contract calculator deployed on the Ethereum Sepolia testnet, with a matching browser frontend that connects to it via MetaMask and ethers.js.

Every arithmetic operation is executed as a real blockchain transaction. Results are read from the emitted Solidity events, and each transaction links directly to Sepolia Etherscan.

**[→ Live demo](https://calculator-dapp-delta.vercel.app/)** &nbsp;·&nbsp; **[→ Contract on Etherscan](https://sepolia.etherscan.io/address/0x890A839Fde6E9B3e887b3dF8eC1A8cE23AAbB313)**

---

## How it works

```
User presses =
      ↓
main.js decides which function to call
      ↓
2 numbers → Calculate(num1, num2, op)
3+ numbers → CalculateWithPriority(nums[], ops[])
      ↓
ethers.js encodes the call and sends it to MetaMask
      ↓
MetaMask asks the user to sign and pay gas (Sepolia ETH, free)
      ↓
The EVM executes Calculator.sol on-chain
      ↓
Solidity events are emitted (Addition_event, Expression_event…)
      ↓
ethers.js decodes the receipt and extracts the result
      ↓
The result and transaction log update in the UI
```

---

## Project structure

```
calculator-dapp/
│
├── index.html                  # App shell — loads fonts, CSS, ethers.js CDN, main.js
│
├── contracts/
│   └── Calculator.sol          # The Solidity smart contract
│
├── src/
│   ├── css/
│   │   └── style.css           # All styles in one file (reset, tokens, layout, components)
│   │
│   └── js/
│       ├── config.js           # CONTRACT_ADDRESS and NETWORK_ID — see note below
│       ├── config.example.js   # Template for config.js — safe to commit
│       ├── web3.js             # Blockchain layer: wallet connection, contract calls, event parsing
│       ├── log.js              # TransactionLog class — renders transaction cards in the UI
│       └── main.js             # UI controller — DOM wiring, state management, call dispatch
│
├── .gitignore
├── DEPLOYMENT.md               # Step-by-step deployment guide
└── README.md
```

> **Note on `config.js`:** this file is committed intentionally — it contains only the public Sepolia contract address, which is visible on-chain anyway. In a production environment this would be handled via environment variables.

---

## The smart contract

`Calculator.sol` exposes two external functions and four private operation helpers.

### `Calculate(num1, num2, op)`

Performs a single arithmetic operation between two integers.

```solidity
function Calculate(
    int256   num1_,
    int256   num2_,
    Operator op_        // 0=Addition  1=Subtraction  2=Multiplier  3=Division
) external returns (int256 Result_)
```

Emits one event matching the operation: `Addition_event`, `Subtraction_event`, `Multiplier_event`, or `Division_event`.

### `CalculateWithPriority(nums[], ops[])`

Evaluates a multi-operand expression with correct mathematical precedence.

```solidity
function CalculateWithPriority(
    int256[]   calldata nums_,   // e.g. [2, 3, 4]
    Operator[] calldata ops_     // e.g. [Addition, Multiplier]
) external returns (int256 Result_)
// 2 + 3 × 4 = 14  ✓
```

Uses a two-pass in-memory algorithm:
- **Pass 1** — resolves all `×` and `÷` left to right, collapsing the working arrays after each operation.
- **Pass 2** — resolves remaining `+` and `−` left to right.

Emits one event per sub-operation, then `Expression_event(finalResult)`.

### Events

| Event | Emitted by | Arguments |
|---|---|---|
| `Addition_event` | `Addition()` | num1, num2, result |
| `Subtraction_event` | `Subtraction()` | num1, num2, result |
| `Multiplier_event` | `Multiplier()` | num1, num2, result |
| `Division_event` | `Division()` | num1, num2, result |
| `Expression_event` | `CalculateWithPriority()` | result |

---

## Frontend architecture

### One grid, automatic routing

There is a single set of calculator buttons in the HTML. The JavaScript decides which contract function to call based on expression complexity — the user interacts with a standard calculator interface.

```
2 + 3      →  Calculate(2, 3, Addition)
2 + 3 × 4  →  CalculateWithPriority([2,3,4], [Addition, Multiplier])
```

### Module responsibilities

| File | Role |
|---|---|
| `main.js` | DOM access, input state machine, call dispatch |
| `web3.js` | MetaMask connection, transaction encoding/sending, event parsing |
| `log.js` | Renders transaction cards with events and Etherscan links |
| `config.js` | Contract address and network ID |

### State model (`main.js`)

```js
state = {
  tokens:         [],    // committed expression tokens: [{ type, value, label }]
  currentNum:     '',    // number currently being typed
  expectNum:      true,  // true = next valid input is a number
  justCalculated: false, // true = last action was =, allows chaining
}
```

---

## Solidity concepts demonstrated

| Concept | Where |
|---|---|
| `enum` | `Operator` type for clean function dispatch |
| `event` + `emit` | One event per operation, `Expression_event` for full expressions |
| Function visibility (`external`, `private`) | Public entry points vs internal helpers |
| `calldata` | Read-only array parameters passed in from the caller |
| `memory` | Mutable working copies for the two-pass algorithm |
| `require` | Input validation and division-by-zero guard |
| `revert` | Fallback for invalid operator values |
| Named return variables | `Result_` assigned directly, no explicit `return` needed |
| Two-pass precedence algorithm | `CalculateWithPriority` — mirrors standard expression parsing |

---

## Getting started

### Prerequisites

- [MetaMask](https://metamask.io) browser extension
- Sepolia ETH (free from [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

### Run locally

```bash
git clone https://github.com/your-username/calculator-dapp.git
cd calculator-dapp
```

Then open `index.html` in a browser — no build step or local server required.

> **Note:** Browsers block ES modules loaded from `file://`. Use a simple static server:
> ```bash
> npx serve .
> # or
> python3 -m http.server 8080
> ```

### Deploy your own contract

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions using Remix IDE and the Sepolia testnet.

---

## Deploy the frontend to Vercel

```bash
npm i -g vercel
vercel
```

Vercel will give you a public URL. Update the live demo link at the top of this README.

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity `^0.8.34` |
| Blockchain | Ethereum Sepolia testnet |
| Wallet | MetaMask |
| Web3 library | ethers.js v6 (CDN, no bundler) |
| Frontend | Vanilla HTML / CSS / JS (ES modules) |
| Fonts | Space Grotesk + Space Mono (Google Fonts) |
| Hosting | Vercel |

---

## Author

**Sara Deleyto** — Solidity learning project.
