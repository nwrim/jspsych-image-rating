/*
 * Functions used for creating the image rating tasks
 */

/**
 * Shuffle array in-place using Durstenfeld shuffle algorithm.
 * This function modifies the array in place.
 * Based on https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @param {Array} array - The array to be shuffled.
 */
function shuffleArray(array) {
  if (!Array.isArray(array)) {
      throw new Error("Invalid input: Expected an array.");
  }

  // Durstenfeld shuffle
  for (var i = array.length - 1; i >= 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

/**
 * Reshape a 1D array into a 2D array with given rows and columns.
 * Based on https://stackoverflow.com/questions/22464605/convert-a-1d-array-to-2d-array
 * 
 * @param {Array} array - The 1D array to reshape.
 * @param {Number} rows - The number of rows.
 * @param {Number} cols - The number of columns.
 * @returns {Array[]} - A reshaped 2D array.
 */
function reshapeArray(array, rows, cols) {
    const result = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            if (i < array.length) {
                row.push(array[i]);
            }
        }
        result.push(row);
    }
    return result;
}

/**
 * Throws an Error if the given condition is not met.
 * Based on https://stackoverflow.com/questions/15313418/what-is-assert-in-javascript
 * 
 * @param {boolean} condition - The condition to check.
 * @param {string} message - The message to display if the condition is not met.
 * @throws {Error} Throws an error with the given message if the assertion fails.
 */
function assert(condition, message) {
    if (typeof condition !== 'boolean') {
        throw new Error("Assert condition must be a boolean.");
    }
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Samples random elements from an array without replacement.
 * @param {Array} array - The source array to sample from.
 * @param {number[]} nums - An array of counts specifying how many elements to sample for each group (e.g., [3, 4]).
 * @returns {Array[]} An array of arrays containing the sampled elements (e.g., [[...3 items], [...4 items]]).
 */
function sampleArray(array, nums) {
    assert(Array.isArray(nums), "'nums' must be an array.");
    assert(nums.every(n => Number.isInteger(n) && n >= 0), "'nums' must be an array of non-negative integers.");

    // check if there are enough elements in the array
    // reduce snippet from https://stackoverflow.com/questions/1230233/how-to-find-the-sum-of-an-array-of-numbers
    const totalRequested = nums.reduce((sum, n) => sum + n, 0);
    assert(array.length >= totalRequested, "Not enough elements in array");

    // copy the array and shuffle it
    const copy = [...array];
    shuffleArray(copy);

    const results = [];
    for (let i = 0; i < nums.length; i++) {
        const count = nums[i];
        results.push(copy.slice(0, count));
        copy.splice(0, count);
    }
    return results;
}

/**
 * The configuration specifies how many *stimulus* images and how many
 * attention check images (for attention-check trials) are displayed per trial
 * in each paradigm.
*/
const RATING_FACTORS = {
  likert: {
    stimPerTrial : 1,   // filenames in a regular trial
    attnPerTrial : 0,   // filenames in a placeholder attn trial (before we insert the attn image)
    grid         : [1, 1]  // rows, cols for reshaping
  },
  slider: {
    stimPerTrial : 1,
    attnPerTrial : 0,
    grid         : [1, 1]
  },
  pairwise: {
    stimPerTrial : 2,
    attnPerTrial : 1,
    grid         : [1, 2]
  },
  fire: {
    stimPerTrial : 12,
    attnPerTrial : 11,
    grid         : [3, 4]
  }
};
Object.freeze(RATING_FACTORS);

/**
 * The formatters specify how to convert the data object into a string
 */
const RATING_FORMATTERS = {
  likert: (d) => `${d.image} ${d.response}`,

  slider: (d) => `${d.image} ${d.slider_start} ${d.response}`,

  pairwise: (d) => {
    // Flatten the image array and create a click string
    const flat = d.image_array.flat();
    const click = flat.map((el) => (d.clicked.includes(el) ? '1' : '0')).join('');
    return `${flat.join(' ')} ${click}`;
  },

  fire: (d) => {
    // Flatten the image array and create click and trash strings
    const flat = d.image_array.flat();
    const click = flat.map((el) => (d.clicked.includes(el) ? '1' : '0')).join('');
    const trash = flat.map((el) => (d.trashed.includes(el) ? '1' : '0')).join('');
    return `${flat.join(' ')} ${click} ${trash}`;
  }
};
Object.freeze(RATING_FORMATTERS);

/* ------------------------------------------------------------------
 *  • plugin: jsPsych plugin name
 *  • buildExtra(trial,opts) returns an object with fields
 *    unique to that rating type.
 * ------------------------------------------------------------------ */
const TRIAL_DEFS = {
  likert: {
    plugin: 'image-rating-likert',
    buildExtra: (trial, opts) => ({
      image_with_src: trial.image_array_with_src[0][0],
      image: trial.image_array[0][0],
      labels: opts.labels,
      image_size: opts.image_size,
      attention_check_index: Math.floor(Math.random() * 7),
      minimum_trial_duration: opts.minimum_trial_duration
    }),
    instrPlugin: 'image-rating-likert-instr',
    buildInstrExtra: (grid, opts, attnImg) => ({
      image_with_src         : grid[0][0],
      labels                 : opts.labels,
      image_size             : opts.image_size,
      attn_img_with_src      : attnImg,
      attention_check_index  : Math.floor(Math.random() * 7),
      minimum_trial_duration : opts.minimum_trial_duration
    })
  },

  slider: {
    plugin: 'image-rating-slider',
    buildExtra: (trial, opts) => ({
      image_with_src: trial.image_array_with_src[0][0],
      image: trial.image_array[0][0],
      labels: opts.labels,
      require_movement: true,
      image_size: opts.image_size,
      attention_check_index: Math.round(Math.random()),
      slider_start: Math.floor(Math.random() * 101)
    }),
    instrPlugin: 'image-rating-slider-instr',
    buildInstrExtra: (grid, opts, attnImg) => ({
      image_with_src        : grid[0][0],
      labels                : opts.labels,
      require_movement      : true,
      image_size            : opts.image_size,
      slider_start          : Math.floor(Math.random() * 101),
      attn_img_with_src     : attnImg,
      attention_check_index : Math.round(Math.random()),      
    })
  },

  pairwise: {
    plugin: 'image-rating-pairwise',
    buildExtra: (trial, opts) => ({
      image_array: trial.image_array,
      image_array_with_src: trial.image_array_with_src,
      attention_check_index: Math.round(Math.random()),
      image_size: opts.image_size,
      minimum_trial_duration: opts.minimum_trial_duration
    }),
    instrPlugin: 'image-rating-pairwise-instr',
    buildInstrExtra: (grid, opts, attnImg) => ({
      image_array_with_src: grid,
      attn_img_with_src   : attnImg,
      attention_check_index: Math.round(Math.random()),
      required_clicks     : opts.required_clicks,
      minimum_trial_duration: opts.minimum_trial_duration,
      trash_can           : opts.trash_can,
      image_size          : opts.image_size
    })
  },

  fire: {
    plugin: 'image-rating-fire',
    buildExtra: (trial, opts) => ({
      image_array: trial.image_array,
      image_array_with_src: trial.image_array_with_src,
      required_clicks: opts.required_clicks,
      image_size: opts.image_size,
      minimum_trial_duration: opts.minimum_trial_duration,
      trash_can: opts.trash_can
    }),
    instrPlugin: 'image-rating-fire-instr',
    buildInstrExtra: (grid, opts, attnImg) => ({
      image_array_with_src: grid,
      attn_img_with_src   : attnImg,
      required_clicks     : opts.required_clicks,
      minimum_trial_duration: opts.minimum_trial_duration,
      trash_can           : opts.trash_can,
      image_size          : opts.image_size
    })
  }
};
Object.freeze(TRIAL_DEFS);

/** 
 * Initial result string for the ratings.
 * This is used to build the result string before the main trial starts.
 */
INITIAL_RESULT_STRINGS = {
    likert: 'exp_stage image response attn attn_index attn_fail rt;',
    slider: 'exp_stage image slider_start response attn attn_index attn_fail rt;',
    pairwise: 'exp_stage image11 image12 click attn attn_index attn_fail rt;',
    fire: 'exp_stage image11 image12 image13 image14 image21 image22 image23 image24 image31 image32 image33 image34 click trash attn attn_fail rt;'
};

/**
 * Return the factor object for a given rating type.
 * Throws a descriptive error if the key is invalid.
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @returns {{stimPerTrial: number, attnPerTrial: number, grid: [number, number]}}
 */
function getRatingFactors(ratingType) {
  const factors = RATING_FACTORS[ratingType];
  if (!factors) {
    throw new Error(
      `ratingType must be one of ${Object.keys(RATING_FACTORS).join(', ')}`
    );
  }
  return factors;
}

/**
 * Shuffle array in-place using Durstenfeld shuffle algorithm.
 * This function modifies the array in place.
 * Based on https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @param {Array} array - The array to be shuffled.
 */
function shuffleArray(array) {
  if (!Array.isArray(array)) {
      throw new Error("Invalid input: Expected an array.");
  }

  // Durstenfeld shuffle
  for (var i = array.length - 1; i >= 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}


/**
 * Reshape a 1D array into a 2D array with given rows and columns.
 * Based on https://stackoverflow.com/questions/22464605/convert-a-1d-array-to-2d-array
 * 
 * @param {Array} array - The 1D array to reshape.
 * @param {Number} rows - The number of rows.
 * @param {Number} cols - The number of columns.
 * @returns {Array[]} - A reshaped 2D array.
 */
function reshapeArray(array, rows, cols) {
    const result = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            if (i < array.length) {
                row.push(array[i]);
            }
        }
        result.push(row);
    }
    return result;
}

/**
 * Throws an Error if the given condition is not met.
 * Based on https://stackoverflow.com/questions/15313418/what-is-assert-in-javascript
 * 
 * @param {boolean} condition - The condition to check.
 * @param {string} message - The message to display if the condition is not met.
 * @throws {Error} Throws an error with the given message if the assertion fails.
 */
function assert(condition, message) {
    if (typeof condition !== 'boolean') {
        throw new Error("Assert condition must be a boolean.");
    }
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Samples random elements from an array without replacement.
 * @param {Array} array - The source array to sample from.
 * @param {number[]} nums - An array of counts specifying how many elements to sample for each group (e.g., [3, 4]).
 * @returns {Array[]} An array of arrays containing the sampled elements (e.g., [[...3 items], [...4 items]]).
 */
function sampleArray(array, nums) {
    assert(Array.isArray(nums), "'nums' must be an array.");
    assert(nums.every(n => Number.isInteger(n) && n >= 0), "'nums' must be an array of non-negative integers.");

    // check if there are enough elements in the array
    // reduce snippet from https://stackoverflow.com/questions/1230233/how-to-find-the-sum-of-an-array-of-numbers
    const totalRequested = nums.reduce((sum, n) => sum + n, 0);
    assert(array.length >= totalRequested, "Not enough elements in array");

    // copy the array and shuffle it
    const copy = [...array];
    shuffleArray(copy);

    const results = [];
    for (let i = 0; i < nums.length; i++) {
        const count = nums[i];
        results.push(copy.slice(0, count));
        copy.splice(0, count);
    }
    return results;
}

/**
 * sample from filenames for image names to be used for practice and main trials
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @param {string[]} filenames                 – stimulus pool for main blocks
 * @param {string[]} attn_filenames            – attention-check pool for main blocks
 * @param {number}   num_trial_prac            - number of practice trials (including attention check trials)
 * @param {number}   num_attn_trial_prac       - number of attention check trials for practice trials
 * @param {number}   num_trial_main            - number of main trials (including attention check trials)
 * @param {number}   num_attn_trial_main       - number of attention check trials for main trials
 * @param {string[]} prac_filenames            [optional] – stimulus pool for practice blocks
 * @param {string[]} prac_attn_filenames       [optional] – attention-check pool for practice blocks
 *
 * @returns {[string[], string[], string[], string[]]}
 *          [filenames_prac, attn_filenames_prac, filenames_main, attn_filenames_main]
 *
 * Notes
 * -----
 * • If *no* practice array is supplied (`prac_filenames.length === 0`),
 *   practice and main are sampled from the **same shuffled pool**
 *   so they cannot contain duplicates.
 * • If a practice array **is** supplied, practice and main are
 *   sampled **independently**, so duplication across blocks is possible if
 *   the arrays contain the same elements.
 */
function sampleFilenames(
  ratingType, filenames, attn_filenames,
  num_trial_prac, num_attn_trial_prac, num_trial_main, num_attn_trial_main,
  prac_filenames = [], prac_attn_filenames = []
) {

  // check if the user supplied separate practice pools
  const userSuppliedStimPrac =
    Array.isArray(prac_filenames)      && prac_filenames.length      > 0;
  const userSuppliedAttnPrac =
    Array.isArray(prac_attn_filenames) && prac_attn_filenames.length > 0;

  // compute how many *stimulus* images are needed, given total & attn trials
  const { stimPerTrial, attnPerTrial } = getRatingFactors(ratingType);

  // helper
  const samplesNeeded = (trials, attnTrials) =>
    (trials - attnTrials) * stimPerTrial + attnTrials * attnPerTrial;

  const needStimPrac = samplesNeeded(num_trial_prac,  num_attn_trial_prac);
  const needStimMain = samplesNeeded(num_trial_main,  num_attn_trial_main);

  // check if the pool size is sufficient for number of stimuli needed
  if (!userSuppliedStimPrac) {
    assert(
      filenames.length >= needStimPrac + needStimMain,
      `Not enough stimulus images: need ${needStimPrac + needStimMain}, have ${filenames.length}`
    );
  } else {
    assert(
      prac_filenames.length >= needStimPrac,
      `Not enough practice stimulus images: need ${needStimPrac}, have ${prac_filenames.length}`
    );
    assert(
      filenames.length >= needStimMain,
      `Not enough main stimulus images: need ${needStimMain}, have ${filenames.length}`
    );
  }

  if (!userSuppliedAttnPrac) {
    assert(
      attn_filenames.length >= num_attn_trial_prac + num_attn_trial_main,
      `Not enough attention images: need ${num_attn_trial_prac + num_attn_trial_main}, have ${attn_filenames.length}`
    );
  } else {
    assert(
      prac_attn_filenames.length >= num_attn_trial_prac,
      `Not enough practice attention images: need ${num_attn_trial_prac}, have ${prac_attn_filenames.length}`
    );
    assert(
      attn_filenames.length >= num_attn_trial_main,
      `Not enough main attention images: need ${num_attn_trial_main}, have ${attn_filenames.length}`
    );
  }

  // sample stimulus filenames
  let filenames_prac, filenames_main;

  if (!userSuppliedStimPrac) {
    // shared pool → one shuffle, two disjoint slices
    [filenames_prac, filenames_main] = sampleArray(filenames, [needStimPrac, needStimMain]);
  } else {
    // separate pools
    [filenames_prac] = sampleArray(prac_filenames, [needStimPrac]);
    [filenames_main] = sampleArray(filenames,      [needStimMain]);
  }

  // sample attention-check filenames
  let attn_filenames_prac, attn_filenames_main;

  if (!userSuppliedAttnPrac) {
    [attn_filenames_prac, attn_filenames_main] =
      sampleArray(attn_filenames, [num_attn_trial_prac, num_attn_trial_main]);
  } else {
    [attn_filenames_prac] = sampleArray(prac_attn_filenames, [num_attn_trial_prac]);
    [attn_filenames_main] = sampleArray(attn_filenames,      [num_attn_trial_main]);
  }

  return [
    filenames_prac,
    attn_filenames_prac,
    filenames_main,
    attn_filenames_main
  ];
}

/**
 * Prefix each filename with its appropriate image-source path.
 * If `attnImg` and `imgSrcAttn` are BOTH provided, that filename will be
 * prefixed with `imgSrcAttn`; otherwise everything is prefixed with `imgSrc`.
 *
 * @param {string[]} filenames       List of bare filenames (e.g., ["A.jpg", "B.jpg"])
 * @param {string}   imgSrc          Prefix for regular stimuli  (e.g., "/main/")
 * @param {string}   [attnImg=null]  Filename that marks an attention-check image
 * @param {string}   [imgSrcAttn=null] Prefix for attention-check images
 * @returns {string[]} New array with sources prepended
 *
 * Notes
 * -----------------
 * • If either `attnImg` **or** `imgSrcAttn` is omitted/empty, the function
 *   assumes *no special attention images* and simply prepends `imgSrc`
 *   to every filename.
 */
function appendSrcToFilename(
  filenames,
  imgSrc,
  attnImg = null,
  imgSrcAttn = null
) {
  assert(Array.isArray(filenames), '`filenames` must be an array');
  assert(typeof imgSrc === 'string', '`imgSrc` must be a string');

  // Helper to decide which prefix to use
  const prefixFor = (name) =>
    attnImg && imgSrcAttn && name === attnImg ? imgSrcAttn : imgSrc;

  return filenames.map((name) => prefixFor(name) + name);
}

/**
 * Split a flat filename list into per-trial filename arrays.
 * Attention-check trials are created without the attention images; they can be
 * filled later when attention images are inserted.
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @param {string[]} filenames          Flat array of filenames (no attn images)
 * @param {number}   numTrial           Total trials *including* attention checks
 * @param {number}   numAttnTrial       Number of attention-check trials
 * @returns {string[][]}  Array of length `numTrial`; each element is
 *                        the list of filenames shown in that trial.
 */
function splitFilenamesToTrials(ratingType, filenames, numTrial, numAttnTrial) {

  const { stimPerTrial, attnPerTrial } = getRatingFactors(ratingType);

  // -------- expected filename count --------
  const expected =
    (numTrial - numAttnTrial) * stimPerTrial + numAttnTrial * attnPerTrial;

  assert(
    filenames.length === expected,
    `For ${ratingType} expect ${expected} filenames, got ${filenames.length}`
  );

  // -------- build the trial list --------
  const trials = [];
  let index = 0;

  // 1) non-attention trials
  const numNonAttn = numTrial - numAttnTrial;
  for (let t = 0; t < numNonAttn; t++) {
    trials.push(filenames.slice(index, index + stimPerTrial));
    index += stimPerTrial;
  }

  // 2) attention trials (placeholders)
  for (let t = 0; t < numAttnTrial; t++) {
    trials.push(filenames.slice(index, index + attnPerTrial));
    index += attnPerTrial;
  }

  return trials;
}

/**
 * Shuffle trials, insert attention-check images, add source prefixes,
 * reshape into the required grid, and tag each trial.
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @param {string[][]} trials          Output of splitFilenamesToTrials (placeholders present)
 * @param {string[]}   attnFilenames   Pool of attention-check filenames
 * @param {string}     imgSrc          Prefix for regular images
 * @param {string}     imgSrcAttn      Prefix for attention-check images
 * @returns {{
 *   image_array: string[][],          // bare filenames (per trial)
 *   image_array_with_src: string[][], // prefixed filenames (per trial)
 *   attention_check: string | ''      // the attn image used, or ''
 * }[]}
 */
function organizeTrials(ratingType, trials, attnFilenames, imgSrc, imgSrcAttn) {
  const { stimPerTrial, attnPerTrial, grid } = getRatingFactors(ratingType);
  const [numRows, numCols] = grid;

  // Shuffle the whole subsetted stimuli pool
  shuffleArray(trials);
  shuffleArray(attnFilenames);

  const organized = [];

  for (let i = 0; i < trials.length; i++) {
    const trial = trials[i];

    // append attention check image if this is an attention trial
    if (trial.length === attnPerTrial) {
      const attnImg = attnFilenames.shift(); // remove first attn filename
      trial.push(attnImg);
      shuffleArray(trial);                   // mix the attn image in

      const trialWithSrc = appendSrcToFilename(
        trial,
        imgSrc,
        attnImg,
        imgSrcAttn
      );

      organized.push({
        image_array:        reshapeArray(trial,         numRows, numCols),
        image_array_with_src: reshapeArray(trialWithSrc, numRows, numCols),
        attention_check:    attnImg
      });

    } else if (trial.length === stimPerTrial) {
      shuffleArray(trial); // randomise order within trial

      const trialWithSrc = appendSrcToFilename(trial, imgSrc);

      organized.push({
        image_array:        reshapeArray(trial,         numRows, numCols),
        image_array_with_src: reshapeArray(trialWithSrc, numRows, numCols),
        attention_check:    ''
      });
    } else {
      throw new Error(
        `Unexpected trial length ${trial.length} for ratingType "${ratingType}"`
      );
    }
  }

  return organized;
}

/**
 * build the result string for the ratings after the trial is finished
 * Note that the result string is built prior
 * @param {*} data trial data
 */
function onFinishRatings(data) {

  // Skip practice trials
  if (data.practice) return;

  const fail_attention = data.pass_attention ? '0' : '1';
  const attention      = data.attention_check !== '' ? '1' : '0';

  // Validate rating type
  const formatter = RATING_FORMATTERS[data.rating_type];
  assert(
    typeof formatter === 'function',
    `No formatter defined for rating_type "${data.rating_type}"`
  );

  // Build the line
  result_string += [
    data.exp_stage,                        // trial number / phase
    formatter(data),                       // type-specific fields
    attention,
    data.attention_check_index ?? '',      // may be undefined for non-attn trials
    fail_attention,
    Math.round(data.rt).toString()
  ].join(' ') + ';';
}

/**
 * Build jsPsych trial objects for **every trial block** in `organizedTrials`
 * and append them to an existing `timeline`.
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @param {Array<Object>} timeline         - The jsPsych timeline array
 * @param {Object[]} organizedTrials       - Output from `organizeTrials`.
 * @param {string}  prompt_header          - HTML shown above the stimulus/grid.
 * @param {string}  prompt_footer          - HTML shown below; trial counter is appended.
 * @param {number}  minimum_trial_duration - ms before the trial may advance.
 * @param {boolean} practice               - if true, the trial is considered a practice and the data not stored.
 * @param {string}  trial_prefix           - Prefix for the `exp_stage` data tag.
 * @param {string}  trash_can              - trash can image file for FIRE.
 * @param {[number, number]} image_size    - `[width, height]` in pixels for each image.
 * @param {Object}  [advanced={}]
 * @param {number}  [advanced.required_clicks=4] - Minimum images the participant must click in the FIRE paradigm.
 * @param {string[]} [advanced.labels=['','']]   - label array for Likert / Slider scales.
 * @returns {Array<Object>} The timeline array with the new trials.
 *
 * Notes
 * --------------------
 * • Type-specific fields are produced by `TRIAL_DEFS[ratingType].buildExtra()`.
 *   That helper receives `(trial, opts)` and should return an object whose
 *   keys are merged into the core `base` trial descriptor.
 *
 */
function createTrialAndInsertToTimeline(ratingType, timeline, organizedTrials,
  prompt_header, prompt_footer, minimum_trial_duration, practice,
  trial_prefix, trash_can, image_size,
  { required_clicks = 4, labels = ['', ''] } = {}
) {
  // validate & gather helpers
  const def = TRIAL_DEFS[ratingType];
  assert(def !== undefined, `Unknown ratingType "${ratingType}"`);

  const opts = {
    labels,
    image_size,
    minimum_trial_duration,
    required_clicks,
    trash_can
  };

  /* ---------- build & push jsPsych trials ---------- */
  organizedTrials.forEach((trial, idx) => {
    const base = {
      type: def.plugin,
      prompt_header,
      prompt_footer:
        `${prompt_footer}<br>Trial number: ${idx + 1} / ${organizedTrials.length}<br>`,
      practice,
      attention_check: trial.attention_check,
      data: {
        rating_type: ratingType,
        exp_stage: trial_prefix + idx,
      },
      on_finish: onFinishRatings
    };

    timeline.push({ ...base, ...def.buildExtra(trial, opts) });
  });

  return timeline;
}

/**
 * Build the single instruction trial for a given rating paradigm.
 *
 * @param {string} ratingType               – key into TRIAL_DEFS
 * @param {string[][]} gridWithSrc          – 2-D array of example images (with src)
 * @param {string} attnImgWithSrc           – full path of the attention image
 * @param {string} header, footer           – HTML prompts
 * @param {[number,number]} image_size
 * @param {string[]}  labels
 * @param {number}    required_clicks
 * @param {string}    trash_can
 * @param {number}    minimum_trial_duration
 * @returns {Object} jsPsych trial descriptor
 */
function buildInstructionTrial(
  ratingType, gridWithSrc, attnImgWithSrc, header, footer, image_size,
  labels, required_clicks, trash_can, minimum_trial_duration
) {
  const def = TRIAL_DEFS[ratingType];
  assert(def !== undefined, `Unknown ratingType "${ratingType}"`);

  // options bundle passed to each builder
  const opts = { labels, image_size, required_clicks, trash_can, minimum_trial_duration };

  return {
    type: def.instrPlugin,
    prompt_header: header,
    prompt_footer: footer,
    data: { exp_stage: 'instr' },
    ...def.buildInstrExtra(gridWithSrc, opts, attnImgWithSrc)
  };
}

/**
 * Convenience wrapper for a one-page jsPsych instructions node.
 *
 * @param {string} html     – Inner HTML of the page
 * @param {function=} on_finish  – Optional jsPsych on_finish callback
 */
function buildStartPage(html, on_finish = undefined) {
  return {
    type: 'instructions',
    pages: [`<div class="centerbox"><p class="block-text">${html}</p></div>`],
    allow_keys: false,
    show_clickable_nav: true,
    allow_backward: true,
    show_page_number: false,
    on_finish: on_finish
  };
}


/**
 * Create a complete jsPsych **timeline** for a rating experiment,
 * including fullscreen request, instructions, practice block, and main block.
 *
 * High-level flow
 * ---------------
 * 1. **Fullscreen** prompt (first node on the timeline).  
 * 2. **Preload** of all stimulus files used in the experiment.  
 * 3. **Instruction trial** (one example stimulus, paradigm-specific plugin).  
 * 4. Optional **practice block** (feedback on attention checks).  
 * 5. **Main block** (no feedback).  
 *
 * @param {'likert'|'slider'|'pairwise'|'fire'} ratingType
 * @param {string[]} filenames stimulus pool
 * @param {string[]} attn_filenames attention check pool
 * @param {string} img_src_main Path / URL prefix prepended to every entry in `filenames`.
 * @param {string} img_src_attn Path / URL prefix prepended to every entry in `attn_filenames`.
 * @param {number} num_trial_prac number of **practice** trials (including attention checks).
 * @param {number} num_attn_trial_prac number of attention-check trials in the **practice** block.
 * @param {number} num_trial_main number of **main** trials (including attention checks).
 * @param {number} num_attn_trial_main number of attention-check trials in the **main** block.
 * @param {string}  prompt_header   HTML fragment shown above grid.
 * @param {string}  prompt_footer   HTML fragment shown below grid.
 * @param {number}  minimum_trial_duration Minimum time (ms) before the trial may advance.
 * @param {string}  trial_prefix    String prepended to `exp_stage` data tags.
 * @param {string}  trash_can       Selector or ID for the trash can (fire).
 * @param {[number, number]} image_size  `[width, height]` in pixels for each image.
 * @param {Object} [options={}]
 * @param {string}  [options.img_src_prac='']        – path prefix for **practice** stimuli.
 * @param {string[]} [options.prac_filenames=[]]     – pool for practice stimuli
 * @param {string}  [options.img_src_attn_prac='']   – path prefix for **practice** attention images
 * @param {string[]} [options.prac_attn_filenames=[]] – pool for practice attention images
 * @param {number}  [options.required_clicks=4]      – min clicks in fire paradigm
 * @param {string[]} [options.labels=['','']]        – label array for Likert / Slider scales
 *
 * @returns {Array<Object>}  The populated jsPsych `timeline` array that was
 *                           passed in.  (The function mutates & returns it for
 *                           convenience.)
 *
 * Notes
 * --------------------
 * • `img_src_prac` and `img_src_attn_prac` default to the main paths when
 *   omitted, allowing practice and main blocks to share the same images.  
 * • The **first** practice trial is reserved to illustrate instructions  
 * • `result_string` is set at the *main-block* start page via the
 *   `on_finish` callback, using `INITIAL_RESULT_STRINGS[ratingType]` if present.
 */
function createTimeline(
  ratingType, filenames, attn_filenames, img_src_main, img_src_attn,
  num_trial_prac, num_attn_trial_prac, num_trial_main, num_attn_trial_main,
  prompt_header, prompt_footer, minimum_trial_duration, trial_prefix,
  trash_can, image_size,
  {
    img_src_prac        = '',
    prac_filenames      = [],
    img_src_attn_prac   = '',
    prac_attn_filenames = [],
    required_clicks     = 4,
    labels              = ['', '']
  } = {}
) {

    assert(
    num_trial_prac - num_attn_trial_prac >= 1,
    'There should be at least one practice trial without attention check (to use for instruction)'
  );

  if (img_src_prac      === '') img_src_prac      = img_src_main;
  if (img_src_attn_prac === '') img_src_attn_prac = img_src_attn;

  const timeline = [];

  // Full-screen request
  timeline.push({ type: 'fullscreen', fullscreen_mode: true });

  // preloading
  timeline.push({type: 'preload', auto_preload: true});

  // sample the filenames
  const [
    filenames_prac, attn_filenames_prac,
    filenames_main, attn_filenames_main
  ] = sampleFilenames(
        ratingType, filenames, attn_filenames,
        num_trial_prac, num_attn_trial_prac,
        num_trial_main, num_attn_trial_main,
        prac_filenames, prac_attn_filenames
      );

  // Split the practice pool: first trial is instruction; remainder is practice block
  const pracTrialBlocks   = splitFilenamesToTrials(
                              ratingType,
                              filenames_prac,
                              num_trial_prac,
                              num_attn_trial_prac
                            );
  const instrBlock        = pracTrialBlocks.shift();   // first element
  const instrGridWithSrc  = organizeTrials(
                              ratingType,
                              [instrBlock],
                              [],              // no attn imgs needed here
                              img_src_prac,
                              ''
                            )[0].image_array_with_src;

  // Build and append the instruction trial
  timeline.push(buildInstructionTrial(
    ratingType, instrGridWithSrc,
    img_src_attn_prac + attn_filenames_prac[0],
    prompt_header, prompt_footer,
    image_size, labels, required_clicks, trash_can, minimum_trial_duration
  ));

  // add the practice trials
  if (num_trial_prac > 1) {
    timeline.push(buildStartPage(
      'Click next to begin the practice trials.<br>' +
      'You will be given feedback if you miss the attention checks.'
    ));

    const organizedPractice = organizeTrials(
      ratingType,
      pracTrialBlocks,
      attn_filenames_prac,
      img_src_prac,
      img_src_attn_prac
    );

    createTrialAndInsertToTimeline(
      ratingType, timeline, organizedPractice,
      prompt_header, prompt_footer,
      minimum_trial_duration, true,
      trial_prefix, trash_can, image_size,
      { required_clicks, labels }
    );
  }

  // add the main trials
  timeline.push(buildStartPage(
    'Click next to begin the main trials.<br>' +
    'You will <b>NOT</b> be given feedback if you miss the attention checks.' +
    '<br>We will reject if you miss more than half of the attention checks.',
    () => { result_string = INITIAL_RESULT_STRINGS[ratingType] ?? ''; }
  ));

  const mainChunks = splitFilenamesToTrials(
    ratingType,
    filenames_main,
    num_trial_main,
    num_attn_trial_main
  );

  const organizedMain = organizeTrials(
    ratingType,
    mainChunks,
    attn_filenames_main,
    img_src_main,
    img_src_attn
  );

  createTrialAndInsertToTimeline(
    ratingType, timeline, organizedMain,
    prompt_header, prompt_footer,
    minimum_trial_duration, false,
    trial_prefix, trash_can, image_size,
    { required_clicks, labels }
  );

  return timeline;
}
