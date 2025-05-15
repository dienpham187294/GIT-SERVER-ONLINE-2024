const stringSimilarity = require("string-similarity");

/**
 * Analyzes transcript text against a command list for similarity matches.
 * @param {string} inputText - The input text to analyze.
 * @param {Array} cmdList - Command list to match against (array of objects with `qs` array).
 * @param {number} similarityThreshold - Similarity threshold (0-1).
 * @returns {Object|null} Most similar matched command object or null.
 */
function RegAnalyzeInPrac(inputText, cmdList, similarityThreshold) {
  const cleanedInput = removeDuplicates(inputText);

  const result1 = findMostSimilarQuestion(
    inputText,
    cmdList,
    similarityThreshold
  );
  const result2 = findMostSimilarQuestion(
    cleanedInput,
    cmdList,
    similarityThreshold
  );

  return result1 || result2 || null;
}

/**
 * Finds the most similar command object to a given statement.
 * @param {string} statement - Text to compare.
 * @param {Array} questions - Command list.
 * @param {number} similarityThreshold - Minimum similarity required.
 * @returns {Object|null} Best matching command object or null.
 */
function findMostSimilarQuestion(statement, questions, similarityThreshold) {
  const normalizedStatement = removeAccentsAndLowercase(statement);

  let maxSimilarity = -1;
  let bestMatch = null;

  questions.forEach((questionObj) => {
    questionObj.qs.forEach((q) => {
      const normalizedQuestion = removeAccentsAndLowercase(q);
      const similarity = stringSimilarity.compareTwoStrings(
        normalizedStatement,
        normalizedQuestion
      );

      if (similarity >= similarityThreshold && similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = questionObj;
      }
    });
  });

  return bestMatch;
}

/**
 * Removes duplicate words from a sentence.
 * @param {string} sentence - Input sentence.
 * @returns {string} Cleaned sentence with unique words.
 */
function removeDuplicates(sentence) {
  const words = sentence.split(" ");
  const seen = new Set();
  const uniqueWords = [];

  for (const word of words) {
    if (!seen.has(word)) {
      uniqueWords.push(word);
      seen.add(word);
    }
  }

  return uniqueWords.join(" ");
}

/**
 * Normalize text: remove accents and convert to lowercase.
 * @param {string} text - Input text.
 * @returns {string} Normalized text.
 */
function removeAccentsAndLowercase(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

module.exports = { RegAnalyzeInPrac };
