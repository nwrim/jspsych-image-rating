// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-likert-instr'] = (function() {

  jsPsych.pluginAPI.registerPreload('image-rating-likert-instr', 'image_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-likert-instr', 'attn_img_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-likert-instr',
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
        attn_img_with_src: {
          type: jsPsych.plugins.parameterType.IMAGE,
          pretty_name: 'Attention check image with source',
          default: undefined,
          description: 'The attention check image file name including the source'
        },
        attention_check_index: {
          type: jsPsych.plugins.parameterType.INT,
            pretty_name: 'Attention Check Label',
            default: 5,
            description: 'The label index of the attention check'
        },
        minimum_trial_duration: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Minimum Trial duration',
          default: 1000,
          description: 'Delay before the Submit button appears (ms)'
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
    
    // Div for the instruction
    let html = `<div class="jspsych-image-rating-instr" style="width:${width}px;">
                  <p id="jspsych-image-rating-instr-text">
                    In each trial of this task, you will see a screen like the one below.
                  </p>
                </div>`;
    // Display the prompt above the image grid
    html += `<div class="jspsych-image-rating-prompt-header" style="width:${width}px;">${prompt_header}</div>`;

    // add the image - the table structure is to match fire/pairwise
    html += `<table class="jspsych-image-rating-image-container">
              <tr>
                <td>
                  <img src="${image_with_src}"  id="instr-img"
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
                <div class="jspsych-image-rating-prompt-footer-center" style="opacity:0;">
                  If the image is blurry, select "${labels[attention_check_index]}".${prompt_footer}
                </div>
                <div class="jspsych-image-rating-prompt-footer-right">
                  <button id="jspsych-image-rating-submit-btn" class="jspsych-btn">Next</button>
                </div>
              </div>`;

    return html;
  };

  plugin.trial = function(display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image_with_src || !trial.labels || !trial.attn_img_with_src) {
      throw new Error('image_with_src, labels, and attn_img_with_src are required parameters.');
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
    // function to handle clicks on the options
    function optionClickListener(evt){
      if (instr_page === 3) {
        next_btn.disabled = false;
      }
      if (instr_page === 7){
        const checked = display_element.querySelector('input[name="Q0"]:checked');
        next_btn.disabled = !(parseInt(checked.value) === trial.attention_check_index + 1);
      }
    }

    // function to reset the selections
    function clearSelections() {
      const radios = display_element.querySelectorAll('input[name="Q0"]');
      radios.forEach(r => { r.checked = false; });
    }

    // function to advance the instruction
    function instrPageAdvance(){
      switch (instr_page){
        case 0:
          instr.innerHTML = 
            `Your job is to rate images following the shown prompt.`;

          header.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 1:
          instr.innerHTML = 
            `You can rate an image by selecting a response option below the image.`;

          header.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 2:
          instr.innerHTML = 
            `Please try selecting a rating. 
             The Next button will activate once you select a response.`;

          clearSelections();
          next_btn.disabled = true;
          break;

        case 3:
          instr.innerHTML = 
            `<span style="color:#FF0000"><b>IMPORTANT ATTENTION CHECK!</b></span>
              In some trials, you will see a <b>blurry image</b>, which looks something like this.`;

          image.src = trial.attn_img_with_src;
          clearSelections();
          break;

        case 4:
          instr.innerHTML = 
            `For blurry images, you must follow the instructions given <b>below</b> the scale.`;

          footer.style.opacity = 1;
          footer.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 5:
          instr.innerHTML = 
            `The instructions below the scale will <b>change throughout the task</b>, so pay attention to them.`;
          break;

        case 6:
            instr.innerHTML =
              `Please try rating a blurry image according to the instructions below the scale.
               The Next button will activate once you follow the instructions below the scale.`

          clearSelections();
          next_btn.disabled = true;
          footer.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 7:
          instr.innerHTML =
            `If you do not follow the instructions for <span style="color:#FF0000">more than half of the blurry images</span>, you will be rejected.`;
          break;

        case 8:
          const sec = Math.floor(trial.minimum_trial_duration/1000);
          const unit = sec === 1 ? 'second' : 'seconds';
          const msg = (trial.minimum_trial_duration > 500)
            ? `Finally, in the actual task, the button will appear <b>${sec} ${unit}</b> after the trial starts. 
               Please <i>take your time to inspect the images</i>.`
            : `Finally, you can press the <span style="color:#FF0000"><b><i>Next</i></b></span> button to move on.
               Please <i>take your time to inspect the images</i>.`;
          instr.innerHTML = msg;
          break;

        case 9:
          container.removeEventListener('change', optionClickListener);
          next_btn.removeEventListener('click', instrPageAdvance); 

          display_element.innerHTML = '';

          jsPsych.finishTrial(); 
          return;
      }
      instr_page++;
    }

    let instr_page = 0;

    const instr   = document.getElementById('jspsych-image-rating-instr-text');
    const header  = display_element.querySelector('.jspsych-image-rating-prompt-header');
    const footer  = display_element.querySelector('.jspsych-image-rating-prompt-footer-center');
    const image     = document.getElementById('instr-img');
    const next_btn   = document.getElementById('jspsych-image-rating-submit-btn');
    const container = display_element.querySelector('.jspsych-image-rating-likert-container');

    container.addEventListener('change', optionClickListener);
    next_btn.addEventListener('click', instrPageAdvance);
  };

  return plugin;
})();
