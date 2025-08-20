// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-slider'] = (function() {

  jsPsych.pluginAPI.registerPreload('image-rating-slider', 'image_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-slider',
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
        pretty_name: 'Prompt',
        default: '',
        description: 'Any content here will be displayed below the slider.'
      },
      image_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Image with source',
        default: undefined,
        description: 'The image to be displayed including the source (used for display)'
      },
      image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Image',
        default: undefined,
        description: 'The image to be displayed (used for data output)'
      },
      image_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image size',
        array: true,
        default: [720, 540],
        description: 'Array specifying the width and height (px) of the images to show.'
      },
      min: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Min slider',
        default: 0,
        description: 'Sets the minimum value of the slider.'
      },
      max: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Max slider',
        default: 100,
        description: 'Sets the maximum value of the slider',
      },
      slider_start: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Slider starting value',
				default: 50,
				description: 'Sets the starting value of the slider',
			},
      step: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Step',
        default: 1,
        description: 'Sets the step of the slider'
      },
      labels: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name:'Labels',
        default: [],
        array: true,
        description: 'Labels of the slider.',
      },
      require_movement: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Require movement',
        default: false,
        description: 'If true, the participant will have to move the slider before continuing.'
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
          description: 'The direction of the attention check. Left for 0 or Right for 1.'
      },
      minimum_trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Minimum trial duration',
        default: 1000,
        description: 'Delay before the Submit button appears (ms)'
      },
      practice: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Practice flag',
        default: false,
        description: 'If true, one can only proceed after draggin the slider all the way to the right on attention check trials.'
      },
      require_fullscreen: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Require fullscreen',
        default: true,
        description: 'Enter fullscreen at the start of the trial'
      },
      min_screen_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Minimum screen width',
        default: 1152,
        description: 'Minimum width (px) the image grid will occupy'
      },
    }
  }

  plugin.generateHtml = function(
    prompt_header, prompt_footer, image_with_src, image_size,
    min, max, slider_start, step, labels, attention_check_index, min_screen_width
  ){
    const width = Math.max(image_size[0], min_screen_width);
    // half of the thumb width value from jspsych.css, used to adjust the label positions
    const half_thumb_width = 7.5;

    let html = `<div class="jspsych-image-rating-prompt-header" style="width:${width}px;">${prompt_header}</div>`;

    // add image - the table structure is to match fire/pairwise
    html += `<table class="jspsych-image-rating-image-container">
              <tr>
                <td>
                  <img src="${image_with_src}"
                  style="height:${image_size[1]}px; width:${image_size[0]}px;" draggable="false">
                </td>
              </tr>
            </table>`;
    // add the slider
    html += `<div class="jspsych-image-rating-slider-container" style="width:${image_size[0]}px;">
              <output class="slider-bubble"></output>
              <input type="range" class="jspsych-slider" 
                value="${slider_start}" min="${min}" max="${max}" step="${step}"
                id="jspsych-image-slider-response" data-moved="false">`;
    // add the labels to the slider
    for (let j = 0; j < labels.length; j++) {
      const label_width_perc = 100 / (labels.length - 1);
      const percent_of_range = j * (100 / (labels.length - 1));
      const percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
      const offset = (percent_dist_from_center * half_thumb_width) / 100;
      html += `<div style="border: 1px solid transparent; display: inline-block; position: absolute;
                            left:calc(${percent_of_range}% - (${label_width_perc}% / 2) - ${offset}px); 
                            text-align: center; width: ${label_width_perc}%;">
                <span style="text-align: center; font-size: 80%;">${labels[j]}</span>
                </div>`;
    };

    html += '</div>';

    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px; margin-top:20px">
               <!-- Keep an empty left cell to preserve centering even without a trash icon -->
               <div class="jspsych-image-rating-prompt-footer-left"></div>
               <div class="jspsych-image-rating-prompt-footer-center">
                  If the image is blurry, rate the ${['leftmost', 'rightmost'][attention_check_index]} value.
                  ${prompt_footer}
               </div>
               <div class="jspsych-image-rating-prompt-footer-right"></div>
             </div>`;

    return html;
  };

  plugin.trial = function(display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image || !trial.image_with_src) {
      throw new Error('image and image_with_src are required parameters.');
    }

    if (trial.labels.length < 2) {
      throw new Error('At least two labels are required.');
    }

    if (trial.max <= trial.min) {
      throw new Error('[image-rating-slider-instr] max must be greater than min.');
    }

if (trial.slider_start < trial.min || trial.slider_start > trial.max) {
      throw new Error(`slider_start (${trial.slider_start}) must be between min (${trial.min}) and max (${trial.max}).`);
    }

    if (!Number.isFinite(trial.step) || trial.step <= 0) {
      throw new Error(`[image-rating-slider] step (${trial.step}) must be a positive number.`);
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(
      trial.prompt_header, trial.prompt_footer, trial.image_with_src, trial.image_size,
      trial.min, trial.max, trial.slider_start, trial.step, trial.labels, trial.attention_check_index, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // functions related to the submit button
    function updateSubmitBtn() {
      const submit_btn = display_element.querySelector('#jspsych-image-rating-submit-btn');
      if (trial.require_movement) {
        const moved = display_element.querySelector('#jspsych-image-slider-response').dataset.moved === 'true';
        if (submit_btn) submit_btn.disabled = !moved;
      } else {
        if (submit_btn) submit_btn.disabled = false;
      }
    }

    function submitBtnListener(evt) {
      evt.target.disabled = true; // disable the button to prevent multiple clicks
      endTrial(evt);
    }

    // function to handle slider input
    function sliderListener() {
      slider.dataset.moved = 'true';
      setBubble(slider, bubble);
      updateSubmitBtn();
    }

    // function to update the bubble
    function setBubble(range, bubble) {
      const val = range.value;
      const min = range.min ? range.min : 0;
      const max = range.max ? range.max : 100;
      const new_val = Number(((val - min) * 100) / (max - min));
      bubble.textContent = val;    
      // Sorta magic numbers based on size of the native UI thumb
      bubble.style.left = `calc(${new_val}% + (${8 - new_val * 0.15}px))`;
    }

    // function to finish the trial
    function endTrial(evt) {
      // get the response
      const response = display_element.querySelector('#jspsych-image-slider-response').valueAsNumber;

      // attention check
      let pass_attention = true;
      if (trial.attention_check.length > 0) {
        if (trial.attention_check_index === 0 && response > trial.min) {
          pass_attention = false;
        } else if (trial.attention_check_index === 1 && response < trial.max) {
          pass_attention = false;
        }

        if (trial.practice && !pass_attention) {
          alert('Please follow the instructions below the slider for blurry images.');
          evt.target.disabled = false; // re-enable the button
          return;
        }
      }

      // build trial data
      const trial_data = {
        image: trial.image,
        slider_start: trial.slider_start,
        response,
        attention_check: trial.attention_check,
        attention_check_index: trial.attention_check_index,
        pass_attention,
        practice: trial.practice,
        rt: Math.round(performance.now() - trial_onset)
      };

      display_element.innerHTML = '';
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.finishTrial(trial_data);
    };

    // ----------------- initialization -----------------
    const slider = display_element.querySelector("#jspsych-image-slider-response");
    const bubble = display_element.querySelector(".slider-bubble");

    slider.addEventListener("input", sliderListener);

    // initialize the bubble value
    setBubble(slider, bubble);

    // make the submit button appear after the minimum trial duration
    jsPsych.pluginAPI.setTimeout(() => {
      display_element.querySelector(".jspsych-image-rating-prompt-footer-right").insertAdjacentHTML(
        'afterBegin',
        '<button id="jspsych-image-rating-submit-btn" class="jspsych-btn" disabled>Submit</button>'
      );

      const submit_btn = display_element.querySelector('#jspsych-image-rating-submit-btn');

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
