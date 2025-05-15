const stringSimilarity = require("string-similarity");
const levenshtein = require("js-levenshtein");

/**
 * Analyzes transcript text against a command list for similarity matches
 * @param {string} transcript - The input text to analyze
 * @param {string} CMDlist - Command list to match against
 * @param {number} numberTry - Number of attempts made (affects output formatting)
 * @returns {Object} Result with analyzed segments and combined text
 */
function RegAnalyze(transcript, CMDlist) {
  if (!transcript || !CMDlist) {
    return {
      resultSt: [],
      CmdApartChat: "",
    };
  }
  let similaritySetCheckRs = [];
  // Parse input strings into objects with tracking properties
  const updatedResultSetsObj = transcript
    .toLowerCase()
    .split(" ")
    .map((text) => ({ stt: false, mark: 0, text }));

  const CMDlistSetObj = CMDlist.toLowerCase()
    .split(" ")
    .map((text) => ({ stt: false, text }));

  // Step 1: Match individual words
  updatedResultSetsObj.forEach((word) => {
    for (const cmd of CMDlistSetObj) {
      if (
        !cmd.stt &&
        stringSimilarity.compareTwoStrings(word.text, cmd.text) > 0.7
      ) {
        word.stt = cmd.stt = true;
        word.text = cmd.text;
        break;
      }
    }
  });

  // Step 2: Group words by match status
  const str1Set = groupByStt(updatedResultSetsObj);
  const str2set = groupBySttFalseOnly(CMDlistSetObj).map((text) => ({
    stt: false,
    text,
  }));

  // Step 3: Match word groups
  str1Set.forEach((item) => {
    str2set.forEach((cmd) => {
      if (cmd.stt) return;

      const sim = stringSimilarity.compareTwoStrings(item.text, cmd.text);
      const diff = levenshtein(item.text, cmd.text);
      const per = (item.text.length - diff) / item.text.length;
      const percent = Math.floor(Math.max(sim, per) * 100) + "%";

      if (sim > 0.3 || per > 0.2) {
        item.stt = "check";
        item.textuse = `~${cmd.text}`;
        //   numberTry > 2 && numberTry % 2 === 0
        //     ?
        //     : ;
        cmd.stt = true;
        similaritySetCheckRs.push(`${item.text} ~${cmd.text} ~${percent}`);
      }
    });
  });

  return {
    resultSt: str1Set,
    CmdApartChat: str1Set.map((e) => e.textuse || e.text).join(" "),
    similaritySetCheckRs: similaritySetCheckRs,
  };
}

/**
 * Groups consecutive array items with the same 'stt' value
 * @param {Array} array - Array of objects with text and stt properties
 * @returns {Array} Groups of items with same stt value
 */
function groupByStt(array) {
  if (!array || array.length === 0) return [];

  const result = [];
  let currentGroup = [];
  let currentStt = array[0].stt;

  for (const item of array) {
    if (item.stt === currentStt) {
      currentGroup.push(item.text);
    } else {
      result.push({
        stt: currentStt,
        text: currentGroup.join(" "),
        textuse: currentGroup.join(" "),
      });
      currentGroup = [item.text];
      currentStt = item.stt;
    }
  }

  // Add final group
  if (currentGroup.length > 0) {
    result.push({
      stt: currentStt,
      text: currentGroup.join(" "),
      textuse: currentGroup.join(" "),
    });
  }

  return result;
}

/**
 * Groups only unmatched items (stt === false)
 * @param {Array} array - Array of objects with text and stt properties
 * @returns {Array} Strings of grouped unmatched items
 */
function groupBySttFalseOnly(array) {
  if (!array || array.length === 0) return [];

  const result = [];
  let currentGroup = [];
  let currentStt = array[0].stt;

  for (const item of array) {
    if (item.stt === currentStt) {
      currentGroup.push(item.text);
    } else {
      if (currentStt === false && currentGroup.length > 0) {
        result.push(currentGroup.join(" "));
      }
      currentGroup = [item.text];
      currentStt = item.stt;
    }
  }

  // Add final group if unmatched
  if (currentStt === false && currentGroup.length > 0) {
    result.push(currentGroup.join(" "));
  }

  return result;
}

module.exports = { RegAnalyze };
