/**
 * log.js
 *
 * Transaction log panel — renders a live feed of blockchain interactions.
 *
 * Each entry displays:
 *   - The contract function that was called (Calculate or CalculateWithPriority).
 *   - The expression and its result (or error message on revert).
 *   - Every Solidity event emitted during the transaction, mirroring what
 *     Remix IDE shows in its terminal after a contract call.
 *   - A direct link to the transaction on Sepolia Etherscan.
 *
 * Design decisions:
 *   - New entries are prepended (most recent first) so the user always sees
 *     the latest result without scrolling.
 *   - The empty-state element is toggled with the `hidden` attribute rather
 *     than CSS display changes, keeping style concerns out of JS.
 *   - innerHTML is used intentionally for performance; inputs are internally
 *     generated strings, not user-supplied data, so XSS is not a concern.
 */
export class TransactionLog {

  /**
   * @param {HTMLElement} listEl  - Scrollable container for log entries.
   * @param {HTMLElement} emptyEl - Empty-state element shown when the log is clear.
   * @param {HTMLElement} clearEl - "Clear" button that wipes all entries.
   */
  constructor(listEl, emptyEl, clearEl) {
    this._list  = listEl;
    this._empty = emptyEl;
    clearEl.addEventListener('click', () => this.clear());
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Prepends a new transaction card to the log.
   *
   * @param {object}   tx             - Transaction data.
   * @param {string}   tx.fnName      - Contract function name ('Calculate' | 'CalculateWithPriority').
   * @param {string}   tx.exprStr     - Human-readable expression (e.g. '2 + 3 × 4').
   * @param {string}   tx.result      - Result value or error message.
   * @param {string[]} tx.events      - Array of emitted event strings (e.g. 'Addition_event(2, 3, 5)').
   * @param {boolean}  tx.isError     - True if the transaction reverted.
   * @param {string}   [tx.txHash]    - On-chain transaction hash (undefined for local simulation).
   * @param {number}   [tx.blockNumber] - Block number the transaction was mined in.
   */
  push(tx) {
    this._empty.hidden = true;

    const el = document.createElement('div');
    el.className = 'log-entry';
    el.setAttribute('role', 'listitem');
    el.innerHTML = this._buildHTML(tx);

    this._list.insertBefore(el, this._list.firstChild);
  }

  /** Removes all log entries and restores the empty state. */
  clear() {
    [...this._list.children].forEach(child => {
      if (child !== this._empty) child.remove();
    });
    this._empty.hidden = false;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  /**
   * Builds the inner HTML string for a single log entry card.
   *
   * @param   {object} tx - See push() for shape.
   * @returns {string} HTML string.
   */
  _buildHTML(tx) {
    const time   = new Date().toLocaleTimeString();
    const resCls = tx.isError ? 'r-err' : 'r-ok';
    const resVal = tx.isError ? `revert: ${tx.result}` : `= ${tx.result}`;

    // Render each Solidity event as a styled line, e.g.:
    //   emit Addition_event(2, 3, 5)
    const eventsHTML = (tx.events || [])
      .map(e => {
        const name = e.split('(')[0];
        const args = e.slice(name.length);
        return `<div class="log-entry__event">` +
               `emit <span class="ev-name">${name}</span>${args}` +
               `</div>`;
      })
      .join('');

    // Link to Sepolia Etherscan only available for real on-chain transactions.
    const txLink = tx.txHash
      ? `<a class="log-entry__tx"
            href="https://sepolia.etherscan.io/tx/${tx.txHash}"
            target="_blank"
            rel="noopener noreferrer">
           ↗ Block #${tx.blockNumber}
         </a>`
      : '';

    return `
      <div class="log-entry__top">
        <span class="log-entry__fn">${tx.fnName}()</span>
        <span class="log-entry__time">${time}</span>
      </div>
      <div class="log-entry__expr">
        ${tx.exprStr} <span class="${resCls}">${resVal}</span>
      </div>
      ${eventsHTML ? `<div class="log-entry__events">${eventsHTML}</div>` : ''}
      ${txLink}
    `;
  }
}
