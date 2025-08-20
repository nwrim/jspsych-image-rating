// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-slider-instr'] = (function() {

  jsPsych.pluginAPI.registerPreload('image-rating-slider-instr', 'image_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-slider-instr', 'attn_img_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-slider-instr',
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
        description: 'Any content here will be displayed below the slider.'
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
      attn_img_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Attention check image with source',
        default: undefined,
        description: 'The attention check image file name including the source'
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
    min, max, slider_start, step, labels, attention_check_index, min_screen_width
  ){
    const width = Math.max(image_size[0], min_screen_width);
    // half of the thumb width value from jspsych.css, used to adjust the label positions
    const half_thumb_width = 7.5;

    // Instruction
    let html = `<div class="jspsych-image-rating-instr" style="width:${width}px;">
                  <p id="jspsych-image-rating-instr-text">
                    In each trial of this task, you will see a screen like the one below.
                  </p>
                </div>`;

    // header prompt
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
    // add the slider
    html += `<div class="jspsych-image-rating-slider-container" style="width:${image_size[0]}px">
              <output class="slider-bubble"></output>
              <input type="range" class="jspsych-slider" 
                value="${slider_start}" min="${min}" max="${max}" step="${step}"
                id="jspsych-image-slider-instr-response" data-moved="false">`;
    // add the labels to the slider
    for (let j = 0; j < labels.length; j++) {
      const label_width_perc = 100/(labels.length-1);
      const percent_of_range = j * (100/(labels.length - 1));
      const percent_dist_from_center = ((percent_of_range-50)/50)*100;
      const offset = (percent_dist_from_center * half_thumb_width)/100;
      html += `<div style="border: 1px solid transparent; display: inline-block; position: absolute;
                            left:calc(${percent_of_range}% - (${label_width_perc}% / 2) - ${offset}px); 
                            text-align: center; width: ${label_width_perc}%;">
                <span style="text-align: center; font-size: 80%;">${labels[j]}</span>
                </div>`;
    };

    html += '</div>';

    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px; margin-top:20px;">
            <!-- Keep an empty left cell to preserve centering even without a trash icon -->
            <div class="jspsych-image-rating-prompt-footer-left"></div>
            <div class="jspsych-image-rating-prompt-footer-center" style="opacity:0;">
              If the image is blurry, rate the ${['leftmost', 'rightmost'][attention_check_index]} value.
              ${prompt_footer}
            </div>
            <div class="jspsych-image-rating-prompt-footer-right">
              <button id="jspsych-image-rating-submit-btn" class="jspsych-btn">Next</button>
            </div>
          </div>`;

    return html;

  };

  plugin.trial = function(display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image_with_src || !trial.attn_img_with_src) {
      throw new Error('image_with_src and attn_img_with_src are required parameters.');
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
      trial.min, trial.max, trial.slider_start, trial.step, trial.labels,
      trial.attention_check_index, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // function to handle slider input
    function sliderListener(){
      setBubble(slider, bubble);

      if (instr_page === 4) {
        next_btn.disabled = false;
      } else if (instr_page === 8) {
        const response = slider.valueAsNumber;
        if (trial.attention_check_index === 0 && response === trial.min) {
          next_btn.disabled = false;
        } else if (trial.attention_check_index === 1 && response === trial.max) {
          next_btn.disabled = false;
        } else {
          next_btn.disabled = true;
        }
      }
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

    // function to randomize slider position
    function randomizeSlider(){
      const span = trial.max - trial.min;
      const steps = Math.floor(span / trial.step);
      const k = Math.floor(Math.random() * (steps + 1));
      slider.value = trial.min + k * trial.step;
      setBubble(slider, bubble);
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
            `You can rate an image by moving the slider below the image.`;

          header.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 2:
          instr.innerHTML = 
            `The starting position of the slider is set randomly, and is NOT relevant to the image.
             You should ignore the starting position when giving your ratings.`;

          randomizeSlider();
          break;

        case 3:
          instr.innerHTML = 
            `Please try giving a rating with the slider. The Next button will activate once you move the slider.`;

          randomizeSlider();
          next_btn.disabled = true;
          break;

        case 4:
          instr.innerHTML = 
            `<span style="color:#FF0000"><b>IMPORTANT ATTENTION CHECK!</b></span>
              In some trials, you will see a <b>blurry image</b>, which looks something like this.`;

          image.src = trial.attn_img_with_src;
          break;

        case 5:
          instr.innerHTML = 
            `For blurry images, you must follow the instructions given <b>below</b> the slider.`;
            
          footer.style.opacity = 1;
          footer.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 6:
          instr.innerHTML = 
            `The instructions given below the slider will <b>change throughout the task</b>, so pay attention to them.`;
          break;

        case 7:
          instr.innerHTML =
            `Please try rating a blurry image according to the instructions below the slider.
             The Next button will activate once you follow the instructions below the slider.`;
          randomizeSlider();
          next_btn.disabled = true;
          footer.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 8:
          instr.innerHTML =
            `If you do not follow the instructions for <span style="color:#FF0000">more than half of the blurry images</span>, you will be rejected.`;
          break;

        case 9:
          const sec = Math.floor(trial.minimum_trial_duration/1000);
          const unit = sec === 1 ? 'second' : 'seconds';
          const msg = (trial.minimum_trial_duration > 500)
            ? `Finally, in the actual task, the button will appear <b>${sec} ${unit}</b> after the trial starts. 
               Please <i>take your time to inspect the images</i>.`
            : `Finally, you can press the <span style="color:#FF0000"><b><i>Next</i></b></span> button to move on.
               Please <i>take your time to inspect the images</i>.`;
          instr.innerHTML = msg;
          break;

        case 10:
          // end of instructions
          slider.removeEventListener('input', sliderListener);
          next_btn.removeEventListener('click', instrPageAdvance);

          display_element.innerHTML = '';

          jsPsych.finishTrial();
          return;
      }

      instr_page ++;
    }

    // ----------------- initialization -----------------
    let instr_page = 0;
    const instr   = display_element.querySelector('#jspsych-image-rating-instr-text');
    const header  = display_element.querySelector('.jspsych-image-rating-prompt-header');
    const footer  = display_element.querySelector('.jspsych-image-rating-prompt-footer-center');
    const image     = display_element.querySelector('#instr-img');
    const next_btn   = display_element.querySelector('#jspsych-image-rating-submit-btn');
    const slider    = display_element.querySelector('#jspsych-image-slider-instr-response');
    const bubble    = display_element.querySelector('.slider-bubble');

    setBubble(slider, bubble);

    slider.addEventListener('input', sliderListener);
    next_btn.addEventListener('click', instrPageAdvance);
  };

  return plugin;
})();
