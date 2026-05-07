/**
 * main.js
 *
 * UI controller — the only file that touches the DOM.
 *
 * Responsibilities:
 *   - Connecting the wallet via the "Connect Wallet" button.
 *   - Managing calculator input state (current number, token list, flags).
 *   - Routing button clicks (numbers, operators, actions) to state handlers.
 *   - Deciding which contract function to call based on expression complexity:
 *       · 2 operands, 1 operator  →  Calculate()
 *       · 3+ operands             →  CalculateWithPriority()
 *     The user interacts with a single unified interface — routing is invisible.
 *   - Updating the display, expression bar, and transaction log after each call.
 *
 * Architecture:
 *   - All business logic lives in web3.js (blockchain) and calculator.js (local sim).
 *   - A single delegated click listener on .btn-grid handles all button presses,
 *     using data-* attributes to identify each button's role. This avoids 19
 *     individual event listeners and makes the HTML the source of truth for layout.
 *
 * State model:
 *   tokens[]      — committed number and operator tokens in the current expression.
 *   currentNum    — the number currently being typed (not yet committed).
 *   expectNum     — true when the next valid input is a number (not an operator).
 *   justCalculated — true immediately after a result, to handle "start new expression"
 *                    vs "use result as first operand" correctly.
 */

import {
  initWeb3,
  isConnected,
  callCalculate,
  callCalculateWithPriority,
  watchNetworkChanges,
} from './web3.js';
import { TransactionLog } from './log.js';

// ─── Operator display symbols ─────────────────────────────────────────────────
const OP_SYM = {
  Addition:    '+',
  Subtraction: '−',
  Multiplier:  '×',
  Division:    '÷',
};

// ─── DOM references ───────────────────────────────────────────────────────────
// Resolved once at startup. All DOM access goes through these constants.
const elDisplay    = document.getElementById('js-display');
const elExpr       = document.getElementById('js-expr');
const elExprBar    = document.getElementById('js-expr-bar');
const elExprTokens = document.getElementById('js-expr-tokens');
const elExprPH     = document.getElementById('js-expr-placeholder');
const elLogList    = document.getElementById('js-log-list');
const elLogEmpty   = document.getElementById('js-log-empty');
const elClearLog   = document.getElementById('js-clear-log');
const elWalletBtn  = document.getElementById('js-wallet-btn');
const elStatusDot  = document.getElementById('js-status-dot');
const elStatusText = document.getElementById('js-status-text');

const log = new TransactionLog(elLogList, elLogEmpty, elClearLog);

// ─── Wallet connection ────────────────────────────────────────────────────────

elWalletBtn.addEventListener('click', async () => {
  try {
    elWalletBtn.textContent = 'Connecting…';
    elWalletBtn.disabled    = true;

    const account = await initWeb3();
    const short   = account.slice(0, 6) + '…' + account.slice(-4);

    // Update UI to reflect connected state.
    elWalletBtn.textContent = short;
    elWalletBtn.classList.add('wallet-btn--connected');
    elStatusDot.classList.add('nav-badge__dot--connected');
    elStatusText.textContent = 'Sepolia · Connected';
    elWalletBtn.disabled     = false;

    // Reload the page on network or account change — the simplest way to
    // guarantee a clean state without stale provider/signer/contract references.
    watchNetworkChanges(() => location.reload());

  } catch (err) {
    elWalletBtn.textContent = 'Connect Wallet';
    elWalletBtn.disabled    = false;
    _showToast(err.message, true);
  }
});

// ─── Calculator state ─────────────────────────────────────────────────────────

/**
 * @typedef  {object}  Token
 * @property {'num'|'op'} type  - Token kind.
 * @property {number|string} value - Numeric value or operator name.
 * @property {string} label        - Display string (e.g. '3.5' or '×').
 */

/** @type {{ tokens: Token[], currentNum: string, expectNum: boolean, justCalculated: boolean }} */
let state = _initialState();

function _initialState() {
  return { tokens: [], currentNum: '', expectNum: true, justCalculated: false };
}

function _resetState() {
  state = _initialState();
  _setDisplay('0');
  _setExpr('');
  _renderExprBar();
}

// ─── Single delegated button listener ────────────────────────────────────────
// All 19 buttons share one listener. Button roles are declared in HTML via
// data-num, data-op, and data-action attributes.

document.querySelector('.btn-grid').addEventListener('click', ev => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  if (btn.dataset.num    !== undefined) _handleNum(btn.dataset.num);
  if (btn.dataset.op     !== undefined) _handleOp(btn.dataset.op);
  if (btn.dataset.action !== undefined) _handleAction(btn.dataset.action);
});

// ─── Input handlers ───────────────────────────────────────────────────────────

/**
 * Appends a digit to the number currently being typed.
 * If the previous action was = the expression is cleared first (fresh start).
 *
 * @param {string} n - Digit character ('0'–'9').
 */
function _handleNum(n) {
  if (state.justCalculated) {
    // User pressed a digit right after a result — start a new expression.
    state = { ..._initialState(), currentNum: n };
  } else {
    if (!state.expectNum) return; // guard: operators and numbers must alternate
    state.currentNum += n;
  }
  _setDisplay(state.currentNum);
  _renderExprBar();
}

/**
 * Commits the current number to the token list and appends an operator token.
 * Ignored if no number has been entered yet (prevents leading operators).
 *
 * @param {string} op - Operator name.
 */
function _handleOp(op) {
  if (state.currentNum !== '') {
    state.tokens.push({
      type:  'num',
      value: parseFloat(state.currentNum),
      label: state.currentNum,
    });
    state.currentNum = '';
    state.expectNum  = false;
  }

  if (state.expectNum) return; // no operator without a preceding number

  state.tokens.push({ type: 'op', value: op, label: OP_SYM[op] });
  state.expectNum      = true;
  state.justCalculated = false;

  _setDisplay('_'); // underscore signals "waiting for next operand"
  _renderExprBar();
}

/**
 * Handles action buttons: AC, +/−, ⌫, . and =.
 *
 * @param {string} action - Action identifier from data-action attribute.
 */
function _handleAction(action) {
  switch (action) {

    case 'clear':
      _resetState();
      break;

    case 'sign':
      // Toggle sign of the number currently being typed.
      if (!state.currentNum || state.currentNum === '0') return;
      state.currentNum = state.currentNum.startsWith('-')
        ? state.currentNum.slice(1)
        : '-' + state.currentNum;
      _setDisplay(state.currentNum);
      _renderExprBar();
      break;

    case 'backspace':
      if (state.currentNum !== '') {
        // Remove the last character from the number being typed.
        state.currentNum = state.currentNum.slice(0, -1);
        _setDisplay(state.currentNum || '0');
      } else if (state.tokens.length > 0) {
        // No current number — undo the last committed token.
        const last = state.tokens.pop();
        if (last.type === 'num') {
          state.currentNum = String(last.value);
          state.expectNum  = true;
          _setDisplay(state.currentNum);
        } else {
          // Last token was an operator — now expecting an operator again.
          state.expectNum = false;
        }
      }
      _renderExprBar();
      break;

    case 'dot':
      // Append a decimal point to the current number.
      if (!state.expectNum || state.currentNum.includes('.')) return;
      state.currentNum = state.currentNum === '' ? '0.' : state.currentNum + '.';
      _setDisplay(state.currentNum);
      _renderExprBar();
      break;

    case 'equals':
      _runCalculation();
      break;
  }
}

// ─── Contract call dispatch ───────────────────────────────────────────────────

/**
 * Commits any pending number, validates the expression, then dispatches to the
 * correct contract function:
 *   - 2 operands → Calculate()             (one on-chain event)
 *   - 3+ operands → CalculateWithPriority() (multiple events + Expression_event)
 *
 * Disables all buttons while awaiting the transaction to prevent double-sends.
 */
async function _runCalculation() {
  if (!isConnected()) {
    _showToast('Connect your wallet first!', true);
    return;
  }

  // Commit any number still being typed.
  if (state.currentNum !== '') {
    state.tokens.push({
      type:  'num',
      value: parseFloat(state.currentNum),
      label: state.currentNum,
    });
    state.currentNum = '';
  }

  const nums = state.tokens.filter(t => t.type === 'num').map(t => t.value);
  const ops  = state.tokens.filter(t => t.type === 'op').map(t => t.value);

  if (nums.length < 2) {
    _showToast('Enter at least 2 numbers.', true);
    return;
  }

  const exprStr = state.tokens
    .map(t => t.type === 'op' ? ` ${t.label} ` : t.label)
    .join('');

  _setDisplay('Processing…');
  _disableButtons(true);

  try {
    let tx;
    let fnName;

    if (nums.length === 2 && ops.length === 1) {
      // Simple expression — use the cheaper Calculate() function.
      fnName = 'Calculate';
      tx     = await callCalculate(nums[0], nums[1], ops[0]);
    } else {
      // Complex expression — CalculateWithPriority() handles precedence on-chain.
      fnName = 'CalculateWithPriority';
      tx     = await callCalculateWithPriority(nums, ops);
    }

    const resultStr    = String(tx.result);
    const eventStrings = tx.events.map(e => `${e.name}(${e.args.join(', ')})`);

    _setDisplay(resultStr);
    _setExpr(`${exprStr} =`);

    log.push({
      fnName,
      exprStr,
      result:      resultStr,
      events:      eventStrings,
      isError:     false,
      txHash:      tx.txHash,
      blockNumber: tx.blockNumber,
    });

    // Keep the result available as a potential left operand for the next expression.
    state = {
      tokens:         [],
      currentNum:     resultStr,
      expectNum:      false,
      justCalculated: true,
    };
    _renderExprBar();

  } catch (err) {
    const msg = err.reason || err.message || 'Transaction failed';
    log.push({
      fnName:  nums.length === 2 ? 'Calculate' : 'CalculateWithPriority',
      exprStr,
      result:  msg,
      events:  [],
      isError: true,
    });
    _setDisplayError(msg);
    _resetState();

  } finally {
    _disableButtons(false);
  }
}

// ─── Expression bar renderer ──────────────────────────────────────────────────

/**
 * Keeps the expression bar (the token preview above the buttons) in sync with
 * the current state. The bar is only shown while there are committed tokens,
 * i.e. once the expression has more than one part (number + operator + ...).
 */
function _renderExprBar() {
  const hasCommittedTokens = state.tokens.length > 0;

  elExprBar.hidden = !hasCommittedTokens;

  if (!hasCommittedTokens) {
    elExprTokens.innerHTML = '';
    elExprPH.hidden        = false;
    return;
  }

  elExprPH.hidden        = true;
  elExprTokens.innerHTML = state.tokens
    .map(t => `<span class="t-${t.type}">${t.label}</span>`)
    .join(' ');
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function _setDisplay(v) {
  elDisplay.textContent = v;
  elDisplay.classList.remove('screen__result--error');
}

function _setDisplayError(msg) {
  elDisplay.textContent = msg;
  elDisplay.classList.add('screen__result--error');
}

function _setExpr(v) {
  elExpr.textContent = v;
}

/** Enables or disables all calculator buttons (used during async tx execution). */
function _disableButtons(disabled) {
  document.querySelectorAll('.calc-btn').forEach(b => { b.disabled = disabled; });
}

/**
 * Shows a temporary toast notification at the bottom of the screen.
 *
 * @param {string}  msg     - Message to display.
 * @param {boolean} isError - If true, applies error styling.
 */
function _showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className   = 'toast' + (isError ? ' toast--error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
