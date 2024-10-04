// class definition and implementation
const fs = require("fs");

class SparseMatrix {
  /**
   * Constructor for our SparseMatrix class.
   * @param {Object|string} input
   */
  constructor(input) {
    this.elements = new Map();

    if (typeof input === "string") {
      this.loadFromFile(input);
    } else if (typeof input === "object" && input.rows && input.cols) {
      this.rows = input.rows;
      this.cols = input.cols;
    } else {
      throw new Error("Invalid input");
    }
  }

  /**
   * Loads matrix data from a file.
   * @param {string} filePath - Path to the file containing matrix data.
   */
  loadFromFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8").split("\n");

    if (!content[0].startsWith("rows=") || !content[1].startsWith("cols=")) {
      throw new Error("Invalid file format");
    }

    this.rows = parseInt(content[0].split("=")[1]);
    this.cols = parseInt(content[1].split("=")[1]);

    for (let i = 2; i < content.length; i++) {
      const line = content[i].trim();
      if (line) {
        if (line.startsWith("(") && line.endsWith(")")) {
          const trimmedLine = line.slice(1, -1); // Remove parentheses
          const parts = trimmedLine.split(",").map((part) => part.trim());
          if (parts.length !== 3) {
            throw new Error("Invalid element format");
          }

          const row = parseInt(parts[0]);
          const col = parseInt(parts[1]);
          const value = parseInt(parts[2]);

          if (isNaN(row) || isNaN(col) || isNaN(value)) {
            throw new Error("Invalid numbers in element");
          }

          this.setElement(row, col, value);
        } else {
          throw new Error("Invalid element format");
        }
      }
    }
  }

  /**
   * Retrieves the value of an element at the specified position.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @returns {number} The value at the specified position, or 0 if not set.
   */
  getElement(row, col) {
    return this.elements.get(`${row},${col}`) || 0;
  }

  /**
   * Sets the value of an element at the specified position.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {number} value - The value to set.
   */
  setElement(row, col, value) {
    if (value !== 0) {
      this.elements.set(`${row},${col}`, value);
    } else {
      this.elements.delete(`${row},${col}`);
    }
  }

  /**
   * Adds another SparseMatrix to this one.
   * @param {SparseMatrix} other - The matrix to add.
   * @returns {SparseMatrix} A new SparseMatrix representing the sum.
   */
  add(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix dimensions do not match for addition");
    }

    const result = new SparseMatrix({ rows: this.rows, cols: this.cols });

    for (let row = 0; row <= this.rows; row++) {
      for (let col = 0; col <= this.cols; col++) {
        const sum = this.getElement(row, col) + other.getElement(row, col);
        if (sum !== 0) {
          result.setElement(row, col, sum);
        }
      }
    }

    return result;
  }

  /**
   * Subtracts another SparseMatrix from this one.
   * @param {SparseMatrix} other - The matrix to subtract.
   * @returns {SparseMatrix} A new SparseMatrix representing the difference.
   */
  subtract(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix dimensions do not match for subtraction");
    }

    const result = new SparseMatrix({ rows: this.rows, cols: this.cols });

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const diff = this.getElement(row, col) - other.getElement(row, col);
        if (diff !== 0) {
          result.setElement(row, col, diff);
        }
      }
    }

    return result;
  }

  /**
   * Multiplies this SparseMatrix with another.
   * @param {SparseMatrix} other - The matrix to multiply with.
   * @param {Function} progressCallback - A callback function to report progress.
   * @returns {SparseMatrix} A new SparseMatrix representing the product.
   */
  multiply(other, progressCallback) {
    if (this.cols !== other.rows) {
      throw new Error(
        "Matrix dimensions are not compatible for multiplication"
      );
    }

    const result = new SparseMatrix({ rows: this.rows, cols: other.cols });

    // Create a column-indexed version of the other matrix for efficient access
    const columnIndexedOther = new Map();
    for (const [key, value] of other.elements) {
      const [row, col] = key.split(",").map(Number);
      if (!columnIndexedOther.has(col)) {
        columnIndexedOther.set(col, new Map());
      }
      columnIndexedOther.get(col).set(row, value);
    }

    let operationsPerformed = 0;
    const totalOperations = this.elements.size * other.cols;

    for (const [key1, value1] of this.elements) {
      const [row1, col1] = key1.split(",").map(Number);

      for (let col2 = 0; col2 < other.cols; col2++) {
        if (columnIndexedOther.has(col2)) {
          const column = columnIndexedOther.get(col2);
          if (column.has(col1)) {
            const value2 = column.get(col1);
            const currentValue = result.getElement(row1, col2);
            const newValue = currentValue + value1 * value2;
            if (newValue !== 0) {
              result.setElement(row1, col2, newValue);
            }
          }
        }

        operationsPerformed++;
        if (progressCallback && operationsPerformed % 1000000 === 0) {
          progressCallback(operationsPerformed / totalOperations);
        }
      }
    }

    return result;
  }

  /**
   * Converts the SparseMatrix to a string representation.
   * @returns {string} A string representation of the matrix.
   */
  toString() {
    let result = `rows=${this.rows}\ncols=${this.cols}\n`;
    for (const [key, value] of this.elements) {
      const [row, col] = key.split(",");
      result += `(${row}, ${col}, ${value})\n`;
    }
    return result.trim();
  }
}

module.exports = SparseMatrix;
