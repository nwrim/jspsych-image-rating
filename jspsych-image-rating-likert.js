// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-likert'] = (function() {

  jsPsych.pluginAPI.registerPreload('image-rating-likert', 'image_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-likert',
    description: '',
    parameters: {
      prompt_header: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt header',
        default: '',
        description: 'Description of the current task to be displayed above the image grid'
      },
      prompt_footer : {
          type: jsPsych.plugins.parameterType.STRING,
          pretty_name: 'Prompt footer',
          default: '',
          description: 'Prompt that appear below the likert ratings.'
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
      labels: {
          type: jsPsych.plugins.parameterType.STRING,
          array: true,
          pretty_name: 'Labels',
          default: undefined,
          description: 'Labels to display for individual question.'
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
          default: 5,
          description: 'The label index of the attention check'
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
        description: 'If true, one can only proceed after performing the correct attention check in attention check trials.'
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

  plugin.generateHtml = function (
    prompt_header, prompt_footer, image_with_src, image_size, 
    labels, attention_check_index, min_screen_width
  ) {

    const width = Math.max(image_size[0], min_screen_width);
    
    // Display the prompt above the image grid
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

    // add options
    html += `<div class="jspsych-image-rating-likert-container" style="width:${image_size[0]}px;">`;

    let likert_width = 100 / labels.length;
    let options_string = '<ul class="jspsych-image-rating-likert-opts" data-radio-group="Q0">';
    for (let j = 0; j < labels.length; j++) {
        options_string += `<li style="width: ${likert_width}%">
                              <label class="jspsych-image-rating-likert-opt-label">
                                <input type="radio" name="Q0" value="${String(Number(j) + 1)}">
                                ${labels[j]}
                              </label>
                            </li>`;
    }
    options_string += '</ul> </div>';
    html += options_string;

    // create div for displaying the footer
    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px;">
               <!-- Keep an empty left cell to preserve centering even without a trash icon -->
               <div class="jspsych-image-rating-prompt-footer-left"></div>
               <div class="jspsych-image-rating-prompt-footer-center">
                  If the image is blurry, select "${labels[attention_check_index]}".${prompt_footer}
               </div>
               <div class="jspsych-image-rating-prompt-footer-right"></div>
             </div>`;

    return html;
  };

  plugin.trial = function(display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image || !trial.image_with_src || !trial.labels) {
      throw new Error('image, image_with_src, and labels are required parameters.');
    }

    if (trial.labels.length < 2) {
      throw new Error('At least two labels are required.');
    }

    if (trial.attention_check_index > trial.labels.length - 1) {
      throw new Error('attention_check_index is out of bounds.');
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(
      trial.prompt_header, trial.prompt_footer, trial.image_with_src, trial.image_size,
      trial.labels, trial.attention_check_index, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // functions related to the submit button
    function updateSubmitBtn () {
      const submit_btn = document.getElementById('jspsych-image-rating-submit-btn');
      const checked = display_element.querySelector('input[name="Q0"]:checked');
      submit_btn.disabled = !checked;
    }

    function submitBtnListener(evt) {
      evt.target.disabled = true; // disable the button to prevent multiple clicks
      endTrial(evt);
    }

    // function to finish the trial
    function endTrial (evt){
      // get the response
      const checked = display_element.querySelector('input[name="Q0"]:checked');
      const response = parseInt(checked.value);

      // attention check
      let pass_attention = true;
      if (trial.attention_check && response !== trial.attention_check_index + 1) {
        pass_attention = false;
      }

      if (trial.practice && !pass_attention) {
        alert('Please follow the instructions below the scale for blurry images.');
        evt.target.disabled = false; // re-enable the button
        return;
      }

      // build trial data
      const trial_data = {
        image: trial.image,
        response,
        attention_check: trial.attention_check,
        attention_check_index: trial.attention_check_index,
        pass_attention,
        practice: trial.practice,
        rt: Math.round(performance.now() - trial_onset)
      }

      display_element.innerHTML = '';
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.finishTrial(trial_data);
    }

    // ----------------- initialization -----------------
    // make the submit button appear after the minimum trial duration
    jsPsych.pluginAPI.setTimeout(() => {
      display_element.querySelector(".jspsych-image-rating-prompt-footer-right").insertAdjacentHTML(
        'afterBegin',
        '<button id="jspsych-image-rating-submit-btn" class="jspsych-btn" disabled>Submit</button>'
      );
      
      const container = display_element.querySelector('.jspsych-image-rating-likert-container');
      const submit_btn = document.getElementById('jspsych-image-rating-submit-btn');

      container.addEventListener('change', () => { submit_btn.disabled = false; });
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
