const stringSimilarity = require("string-similarity");

/**
 * Analyzes transcript text against a command list for similarity matches.
 * @param {string} inputText - The input text to analyze.
 * @param {Array} cmdList - Command list to match against (array of objects with `qs` array).
 * @param {number} similarityThreshold - Similarity threshold (0-1).
 * @returns {Object|null} Most similar matched command object or null.
 */
function GetDataPracInCustom(
  data_all,
  index_sets_t_get_pracData,
  filerSets,
  upCode,
  random,
  fsp
) {
  const numberGetPerOne = Math.floor(200 / index_sets_t_get_pracData.length);

  // Chọn ngẫu nhiên một trong ba giá trị: Math.floor(numberGetPerOne / 2), numberGetPerOne, hoặc 0
  const randomIndex = Math.floor(Math.random() * 3);
  const numberCut = [Math.floor(numberGetPerOne / 2), numberGetPerOne, 0][
    randomIndex
  ];
  let arrRes_gd_1 = [];

  index_sets_t_get_pracData.forEach((e) => {
    let getUpCode = "charactor";
    if (upCode && data_all[e]["charactor" + upCode]) {
      getUpCode = "charactor" + upCode;
    }
    let resTemp = getArrayElements(
      filer_type_o_charactor(data_all[e][getUpCode], filerSets, fsp),
      numberCut,
      numberGetPerOne
    );

    arrRes_gd_1.push(resTemp);
  });

  let arrRes = [];

  for (let i = 0; i < numberGetPerOne; i++) {
    arrRes_gd_1.forEach((e) => {
      if (e[i]) {
        arrRes.push(e[i]);
      }
    });
  }
  console.log(arrRes.length, "Số phần tử bài học");
  let getdata_indexSet = [];
  if (random === "true") {
    getdata_indexSet = generateRandomArray(arrRes.length, true);
  } else {
    getdata_indexSet = generateRandomArray(arrRes.length, false);
  }
  return { interleaveCharacters_DATA: arrRes, indexSet_DATA: getdata_indexSet };
}

module.exports = { GetDataPracInCustom };

function filer_type_o_charactor(charactorSets, filerTypeSetsStringValue, fsp) {
  try {
    // Check if inputs are valid
    if (!filerTypeSetsStringValue || !Array.isArray(charactorSets)) {
      return charactorSets;
    }

    // Split the filter string into an array using "zz" as separator
    let filerTypeSetsArrayValue = filerTypeSetsStringValue.split("zz");
    console.log(filerTypeSetsArrayValue, "filerTypeSetsArrayValue");

    let res_after_filer = [];
    let filerTypeSetsArrayValueAll = [];
    let filerTypeSetsArrayValueSpecific = [];
    let rangeFilters = [];

    // Process each filter part
    filerTypeSetsArrayValue.forEach((e) => {
      if (e.includes("*")) {
        // Store the prefix (string before the "*") for wildcard matching
        filerTypeSetsArrayValueAll.push(e.replace("*", ""));
      } else if (e.includes("-")) {
        // Handle range filter like A1-5 or A9-10
        rangeFilters.push(e);
      } else {
        filerTypeSetsArrayValueSpecific.push(e);
      }
    });

    charactorSets.forEach((e) => {
      let isTypeMatch = false;

      // Check if the type exactly matches any specific filter
      if (filerTypeSetsArrayValueSpecific.includes(e?.type)) {
        isTypeMatch = true;
      } else {
        // Check if the type starts with any wildcard filter prefix
        for (let prefix of filerTypeSetsArrayValueAll) {
          if (e?.type && e.type.startsWith(prefix)) {
            isTypeMatch = true;
            break;
          }
        }

        // Check if the type falls within any range filter
        if (!isTypeMatch && e?.type) {
          for (let rangeFilter of rangeFilters) {
            // Parse the range filter (e.g., "A1-5" → prefix="A", start=1, end=5)
            const matches = rangeFilter.match(/([A-Za-z]*)(\d+)-(\d+)/);
            if (matches) {
              const prefix = matches[1];
              const start = parseInt(matches[2]);
              const end = parseInt(matches[3]);

              // Check if the type has the same prefix and a number in the range
              const typeMatches = e.type.match(new RegExp(`^${prefix}(\\d+)$`));
              if (typeMatches) {
                const typeNumber = parseInt(typeMatches[1]);
                if (typeNumber >= start && typeNumber <= end) {
                  isTypeMatch = true;
                  break;
                }
              }
            }
          }
        }
      }

      // Check if FSP matches (if FSP filter is provided)
      const eFspStr = (e?.fsp || "").toLowerCase();
      const fspStr = (fsp || "").toLowerCase();
      const isFspMatch = fsp ? eFspStr.includes(fspStr) : true;

      if (isTypeMatch && isFspMatch) {
        res_after_filer.push(e);
      }
    });

    return res_after_filer.length > 0 ? res_after_filer : [];
  } catch (error) {
    console.error("Lỗi trong filer_type_o_charactor:", error);
    return charactorSets;
  }
}

function splitAndConcatArray(array, m) {
  const n = array.length;
  const splitIndex = Math.floor((n * m) / 10);

  const arr1 = array.slice(0, splitIndex);
  const arr2 = array.slice(splitIndex);

  const resultArray = arr2.concat(arr1);

  return resultArray;
}

function generateRandomArray(m, stt_random) {
  let randomArray = [];
  for (let i = 0; i < m; i++) {
    randomArray.push(i);
  }
  if (stt_random) {
    return shuffleArray(randomArray);
  }
  return randomArray;
}

const fetchTitle = async () => {
  try {
    // Load local JSON file based on fileName
    const fileName = roomInfo.fileName;
    const isSEO = fileName?.charAt(1) === "z";
    const localPath = isSEO
      ? `/jsonData/forseo/${fileName}.json`
      : `/jsonData/${fileName}.json`;

    const localResponse = await fetch(localPath);

    if (!localResponse.ok) {
      throw new Error("Failed to load local JSON data");
    }

    const localData = await localResponse.json();
    setDataPracticingOverRoll(localData);

    // Prepare firstList from query param or default to [currentIndex]
    let firstList = [currentIndex || 0];
    const paramA = params.get("a");
    if (paramA) {
      try {
        const parsedList = parseStringToNumbers(paramA);
        if (parsedList) firstList = parsedList;
      } catch (err) {
        console.warn("Failed to parse 'a' param:", err);
      }
    }

    // Prepare request body for API
    const requestBody = {
      data_all: localData,
      index_sets_t_get_pracData: firstList,
      filerSets: params.get("b"),
      upCode: params.get("up"),
      random: params.get("random"),
      fsp: params.get("fsp"),
    };

    const apiResponse = await fetch(LinkAPI + "get_data_prac_in_custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const json = await apiResponse.json();

    if (json.success) {
      setDataPracticingCharactor(json.data.interleaveCharacters_DATA);
      setIndexSets(json.data.indexSet_DATA);
    }
  } catch (error) {
    console.error("Error in fetchTitle():", error);
  }
};
