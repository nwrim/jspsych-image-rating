// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-pairwise'] = (function () {

  jsPsych.pluginAPI.registerPreload('image-rating-pairwise', 'image_array_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-pairwise',
    description: '',
    parameters: {
      prompt_header: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt header',
        default: '',
        description: 'Description of the current task to be displayed above the image grid'
      },
      prompt_footer: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt footer',
        default: '',
        description: 'Trial-related details to be displayed below the image grid'
      },
      image_array_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Image array with source',
        array: true,
        default: undefined,
        description: '2D matrix of image file names including the source (used for display)'
      },
      image_array: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Image array',
        array: true,
        default: undefined,
        description: '2D matrix of image file names (used for data output)'
      },
      attention_check: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Attention check',
        default: '',
        description: 'The image used as the attention check for the trial'
      },
      attention_check_index: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Attention Check Label',
        default: 0,
        description: 'What to click in the attention check trial. Blurry for 0 or Not blurry for 1.'
      },
      image_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image size',
        array: true,
        default: [560, 420],
        description: 'Array specifying the width and height (px) of the images to show.'
      },
      minimum_trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Minimum Trial duration',
        default: 1000,
        description: 'Delay before the Submit button appears (ms)'
      },
      practice: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Practice flag',
        default: false,
        description: 'If true, one can only proceed after clicking the attention check image'
      },
      require_fullscreen: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Require fullscreen',
        default: true,
        description: 'Enter fullscreen at the start of the trial'
      },
      cell_padding: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Cell padding',
        default: 2,
        description: 'Padding (px) around each image inside its grid cell'
      },
      min_screen_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Minimum screen width',
        default: 1152,
        description: 'Minimum width (px) the image grid will occupy'
      },
    }
  }

    plugin.generateHtml = function (
    prompt_header, prompt_footer, image_array_with_src, image_array,
    image_size, attention_check_index, cell_padding, min_screen_width
  ) {

    const n_rows = image_array_with_src.length;
    const n_cols = image_array_with_src[0].length;

    // create blank element to hold code that we generate
    const cell_width = image_size[0] + 2 * cell_padding;      // img width + padding L/R
    const width   = Math.max(cell_width * n_cols, min_screen_width);
    
    // Display the prompt above the image grid
    let html = `<div class="jspsych-image-rating-prompt-header" style="width:${width}px;">${prompt_header}</div>`;

    // create table for holding images (used as image grids)
    html += '<table class="jspsych-image-rating-image-container">';
    // loop through the row to create the rows (tr elements)
    for (let row = 0; row < n_rows; row++) {
      html += `<tr style="height:${image_size[1] + 2*cell_padding}px;">`;
      // for each row, loop through the columns to create the columns (td elements)
      for (let col = 0; col < n_cols; col++) {
        // create a div for each cell (adds slight padding to the image)
        html += `<td> <div style="width:${image_size[0] + 2*cell_padding}px;
                                  height:${(image_size[1] + 2*cell_padding)}px;
                                  padding: ${cell_padding}px;">`;
        // if there is an image in the row-col, add the image to the cell
        if (image_array_with_src[row][col]) {
          html += `<img id="img-${row}-${col}"
                    data-id="${image_array[row][col]}" 
                    src="${image_array_with_src[row][col]}" draggable="false"
                    style="width:${image_size[0]}px; height:${image_size[1]}px;">`;
        }
        html += '</div></td>';
      }
      html += '</tr>';
    }
    html += '</table>';

    // create div for displaying the footer
    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px">
               <!-- Keep an empty left cell to preserve centering even without a trash icon -->
               <div class="jspsych-image-rating-prompt-footer-left"></div>
               <div class="jspsych-image-rating-prompt-footer-center">
                 If there is a blurry image, select the ${['blurry image', 'image that is not blurry'][attention_check_index]}.
                 ${prompt_footer}
               </div>
               <div class="jspsych-image-rating-prompt-footer-right"></div>
             </div>`;

    return html;
  };

  plugin.trial = function (display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image_array || !trial.image_array_with_src) {
      throw new Error('image_array and image_array_with_src are required parameters.');
    }

    if (trial.image_array.length !== trial.image_array_with_src.length ||
        trial.image_array.some((row, i) => row.length !== trial.image_array_with_src[i].length)) {
      throw new Error('image_array and image_array_with_src must have identical dimensions.');
    }

    if (!Array.isArray(trial.image_array_with_src[0])) {
      throw new Error('image_array_with_src must be 2D (array of rows).');
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(
      trial.prompt_header, trial.prompt_footer, trial.image_array_with_src, 
      trial.image_array, trial.image_size, trial.attention_check_index,
      trial.cell_padding, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // functions related to the submit button
    function updateSubmitBtn () {
      const submit_btn = document.getElementById('jspsych-image-rating-submit-btn');
      if (submit_btn) submit_btn.disabled = !selected_img_id;
    }

    function submitBtnListener(evt) {
      evt.target.disabled = true; // disable the button to prevent multiple clicks
      endTrial(evt);
    }

    // function to handle clicks on the stimuli
    function imgClickListener (evt) {
      if (evt.target.tagName !== 'IMG') return;
      display_element.querySelectorAll('.jspsych-image-rating-image-container img').forEach(img => img.classList.remove('selected'));
      const img = evt.target;
      img.classList.add('selected');
      selected_img_id = img.dataset.id  ; // store the id of the clicked image
      updateSubmitBtn();
    }

    // function to finish the trial
    function endTrial(evt) {
      // get the response
      const clicked = selected_img_id ? [selected_img_id] : [];

      // attention check
      let pass_attention = true;
      if (trial.attention_check) {
        const clicked_is_ac = clicked[0] === trial.attention_check;
        if ((trial.attention_check_index === 0 && !clicked_is_ac) ||
            (trial.attention_check_index === 1 && clicked_is_ac)) {
          pass_attention = false;
        }
      }

      if (trial.practice && !pass_attention) {
        alert('Please follow the instructions below the images when there is a blurry image.');
        evt.target.disabled = false; // re-enable the button
        return;
      }

      // build trial data
      const trial_data = {
        image_array: trial.image_array,
        clicked,
        attention_check: trial.attention_check,
        attention_check_index: trial.attention_check_index,
        pass_attention,
        practice: trial.practice,
        rt: Math.round(performance.now() - trial_onset)
      };

      display_element.innerHTML = '';
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.finishTrial(trial_data);
    }

    // ----------------- initialization -----------------
    let selected_img_id = null;
    const container = display_element.querySelector('.jspsych-image-rating-image-container');
    
    container.addEventListener('click', imgClickListener);
    
    // make the submit button appear after the minimum trial duration
    jsPsych.pluginAPI.setTimeout(() => {
      display_element.querySelector(".jspsych-image-rating-prompt-footer-right").insertAdjacentHTML(
        'afterBegin',
        '<button id="jspsych-image-rating-submit-btn" class="jspsych-btn" disabled>Submit</button>'
      );

      const submit_btn = document.getElementById('jspsych-image-rating-submit-btn');

      submit_btn.addEventListener('click', submitBtnListener);

      updateSubmitBtn(); // check whether it should be enabled at insertion
    }, trial.minimum_trial_duration);

    // request fullscreen mode    
    if (trial.require_fullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen)       element.requestFullscreen();
      else if (element.mozRequestFullScreen)  element.mozRequestFullScreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else if (element.msRequestFullscreen)    element.msRequestFullscreen();
    }

    // record the trial onset time
    const trial_onset = performance.now();
  };

  return plugin;
})();
