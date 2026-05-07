// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.34;

/// @title  Calculator
/// @author Sara Deleyto
/// @notice A smart contract that performs arithmetic operations on integers.
///         Exposes two public entry points:
///           - Calculate()             for single operations (e.g. 5 + 3)
///           - CalculateWithPriority() for multi-operand expressions with correct
///                                     mathematical precedence (× ÷ before + −)
contract Calculator {

    // ─── Enum ─────────────────────────────────────────────────────────────────

    /// @notice Represents the four supported arithmetic operators.
    ///         Values map to uint8 in the ABI: Addition=0, Subtraction=1,
    ///         Multiplier=2, Division=3.
    enum Operator { Addition, Subtraction, Multiplier, Division }

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted by the private Addition function on every addition.
    event Addition_event    (int256 num1, int256 num2, int256 result);

    /// @notice Emitted by the private Subtraction function on every subtraction.
    event Subtraction_event (int256 num1, int256 num2, int256 result);

    /// @notice Emitted by the private Multiplier function on every multiplication.
    event Multiplier_event  (int256 num1, int256 num2, int256 result);

    /// @notice Emitted by the private Division function on every division.
    event Division_event    (int256 num1, int256 num2, int256 result);

    /// @notice Emitted by CalculateWithPriority with the final result of the
    ///         full expression after all operations have been resolved.
    event Expression_event  (int256 result);

    // ─── External functions ───────────────────────────────────────────────────

    /// @notice Performs a single arithmetic operation between two integers.
    /// @dev    Acts as a dispatcher: routes to the appropriate private function
    ///         based on the operator enum value. Reverts if an unknown operator
    ///         is provided (defensive guard against ABI misuse).
    /// @param  num1_ First operand.
    /// @param  num2_ Second operand.
    /// @param  op_   Operator to apply (0=Addition, 1=Subtraction, 2=Multiplier, 3=Division).
    /// @return Result_ The result of the operation.
    function Calculate(
        int256   num1_,
        int256   num2_,
        Operator op_
    ) external returns (int256 Result_) {
        if (op_ == Operator.Addition)    return Addition(num1_, num2_);
        if (op_ == Operator.Subtraction) return Subtraction(num1_, num2_);
        if (op_ == Operator.Multiplier)  return Multiplier(num1_, num2_);
        if (op_ == Operator.Division)    return Division(num1_, num2_);
        revert("Invalid operator");
    }

    /// @notice Evaluates a multi-operand expression with correct mathematical
    ///         precedence: multiplication and division are resolved before
    ///         addition and subtraction.
    /// @dev    Uses a two-pass in-memory algorithm:
    ///           Pass 1 — scans operators left to right, resolves every × and ÷
    ///                    immediately and collapses the working arrays so the
    ///                    resolved value replaces the two original operands.
    ///           Pass 2 — resolves all remaining + and − left to right on the
    ///                    collapsed array.
    ///         Input arrays are copied from calldata to memory at the start so
    ///         they can be mutated without touching the original calldata.
    ///         Example: nums=[2,3,4], ops=[Addition, Multiplier]
    ///                  → 2 + (3 × 4) = 14
    /// @param  nums_ Array of integer operands. Must contain at least 2 elements.
    /// @param  ops_  Array of operators between operands.
    ///               Length must be exactly nums_.length - 1.
    /// @return Result_ The final result of the full expression.
    function CalculateWithPriority(
        int256[]   calldata nums_,
        Operator[] calldata ops_
    ) external returns (int256 Result_) {
        require(nums_.length >= 2,               "At least 2 numbers required");
        require(ops_.length == nums_.length - 1, "Invalid number of operators");

        // Copy calldata arrays to memory so they can be mutated during the algorithm.
        int256[]   memory numbers   = new int256[](nums_.length);
        Operator[] memory operators = new Operator[](ops_.length);

        for (uint256 i = 0; i < nums_.length; i++) numbers[i]   = nums_[i];
        for (uint256 i = 0; i < ops_.length;  i++) operators[i] = ops_[i];

        // `len` tracks the logical (not physical) length of the arrays as they
        // collapse. Solidity memory arrays cannot be resized, so we decrement
        // len instead to narrow the range that subsequent iterations examine.
        uint256 len = operators.length;

        // ── Pass 1: resolve × and ÷ ──────────────────────────────────────────
        for (uint256 i = 0; i < len; ) {
            if (operators[i] == Operator.Multiplier || operators[i] == Operator.Division) {

                // Operate and store result at position i (replacing the left operand).
                numbers[i] = operators[i] == Operator.Multiplier
                    ? Multiplier(numbers[i], numbers[i + 1])
                    : Division  (numbers[i], numbers[i + 1]);

                // Collapse: shift every element after i+1 one position to the left,
                // effectively removing numbers[i+1] and operators[i] from the working set.
                for (uint256 j = i + 1; j < len; j++) {
                    numbers[j]       = numbers[j + 1];
                    operators[j - 1] = operators[j];
                }
                len--;
                // Do not increment i — re-check the same position because a new
                // × or ÷ may now occupy it after the collapse (e.g. 2 × 3 × 4).
            } else {
                i++;
            }
        }

        // ── Pass 2: resolve + and − left to right ────────────────────────────
        Result_ = numbers[0];
        for (uint256 i = 0; i < len; i++) {
            Result_ = operators[i] == Operator.Addition
                ? Addition   (Result_, numbers[i + 1])
                : Subtraction(Result_, numbers[i + 1]);
        }

        emit Expression_event(Result_);
    }

    // ─── Private functions ────────────────────────────────────────────────────
    // Each function performs exactly one operation, emits its corresponding
    // event, and returns the result via a named return variable (no explicit
    // `return` statement needed when the variable is assigned directly).

    /// @dev Adds two integers and emits Addition_event.
    function Addition(int256 num1_, int256 num2_) private returns (int256 Result_) {
        Result_ = num1_ + num2_;
        emit Addition_event(num1_, num2_, Result_);
    }

    /// @dev Subtracts num2_ from num1_ and emits Subtraction_event.
    function Subtraction(int256 num1_, int256 num2_) private returns (int256 Result_) {
        Result_ = num1_ - num2_;
        emit Subtraction_event(num1_, num2_, Result_);
    }

    /// @dev Multiplies two integers and emits Multiplier_event.
    function Multiplier(int256 num1_, int256 num2_) private returns (int256 Result_) {
        Result_ = num1_ * num2_;
        emit Multiplier_event(num1_, num2_, Result_);
    }

    /// @dev Divides num1_ by num2_ and emits Division_event.
    ///      Reverts if num2_ is zero (integer division by zero is undefined).
    function Division(int256 num1_, int256 num2_) private returns (int256 Result_) {
        require(num2_ != 0, "Cannot divide by zero");
        Result_ = num1_ / num2_;
        emit Division_event(num1_, num2_, Result_);
    }
}
