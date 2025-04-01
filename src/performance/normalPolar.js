/**
 * Generate random values using normal distribution (Box-Muller transform)
 * @param {number} mean - Mean value
 * @param {number} sd - Standard deviation
 * @returns {Array} - Array of two normally distributed random values
 */
export function normalPolar(mean, sd) {
    let u1, u2, s;
    do {
        u1 = Math.random() * 2 - 1;
        u2 = Math.random() * 2 - 1;
        s = u1 * u1 + u2 * u2;
    } while (s >= 1 || s === 0);
    
    const factor = Math.sqrt(-2.0 * Math.log(s) / s);
    return [mean + u1 * factor * sd, mean + u2 * factor * sd];
}