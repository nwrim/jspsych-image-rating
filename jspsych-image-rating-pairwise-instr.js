// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-pairwise-instr'] = (function () {

  jsPsych.pluginAPI.registerPreload('image-rating-pairwise-instr', 'image_array_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-pairwise-instr', 'attn_img_with_src', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-pairwise-instr',
    description: '',
    parameters: {
      prompt_header: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt header',
        description: 'Description of the current task'
      },
      prompt_footer: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt footer',
        description: 'Trial-related details'
      },
      image_array_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Image array with source',
        array: true,
        default: undefined,
        description: 'A matrix of image file names including the source - the images will be loaded using this'
      },
      attn_img_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Attention check image with source',
        default: undefined,
        description: 'The attention check image file name including the source - the image will be loaded using this'
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
        description: 'Array specifying the width and height of the images to show.'
      },
      minimum_trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: 1000,
        description: 'The minimum trial duration (the button will not appear until this) in milliseconds.'
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
    prompt_header, prompt_footer, image_array_with_src, 
    image_size, attention_check_index, cell_padding, min_screen_width
  ) {

    const n_rows = image_array_with_src.length;
    const n_cols = image_array_with_src[0].length;

    const cell_width = image_size[0] + 2 * cell_padding;
    const width   = Math.max(cell_width * n_cols, min_screen_width);

    // Div for the instruction
    let html = `<div class="jspsych-image-rating-instr" style="width:${width}px;">
                  <p id="jspsych-image-rating-instr-text">
                    In each trial of this task, you will see a screen like the one below.
                  </p>
                </div>`;
    // Display the prompt above the image grid
    html += `<div class="jspsych-image-rating-prompt-header" style="width:${width}px;">${prompt_header}</div>`;

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
          html += `<img id="instr-img-${row}-${col}" 
                        src="${image_array_with_src[row][col]}" 
                        style="width:${image_size[0]}px; height:${image_size[1]}px;" 
                        draggable="false">`;
        }
        html += '</div></td>';
      }
      html += '</tr>';
    }
    html += '</table>';

    // create div for displaying the footer
    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px;">
                <div class="jspsych-image-rating-prompt-footer-left"></div>
                <div class="jspsych-image-rating-prompt-footer-center" style="opacity:0;">
                    If there is a blurry image, select the ${['blurry image','image that is not blurry'][attention_check_index]}.
                    ${prompt_footer}
                </div>
                <div class="jspsych-image-rating-prompt-footer-right">
                    <button id="jspsych-image-rating-submit-btn" class="jspsych-btn">Next</button>
                </div>
              </div>`;

    return html;
  };

  plugin.trial = function (display_element, trial) {

    // ----------------- validation -----------------
    if (!trial.image_array_with_src || !trial.attn_img_with_src) {
      throw new Error('image_array_with_src and attn_img_with_src are required parameters.');
    }

    if (!Array.isArray(trial.image_array_with_src[0])) {
      throw new Error('image_array_with_src must be 2D (array of rows).');
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(
      trial.prompt_header, trial.prompt_footer, trial.image_array_with_src,
      trial.image_size, trial.attention_check_index, trial.cell_padding, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // function to reset the selections
    function clearSelections(){ images.forEach(i=>i.classList.remove('selected')); selected_img_id=null; }

    // function to handle clicks on images
    function imgClickListener(evt){
      if (evt.target.tagName !== 'IMG') return;

      images.forEach(i=>i.classList.remove('selected'));
      evt.target.classList.add('selected');
      selected_img_id = evt.target.id;

      if (instr_page === 3) {
        next_btn.disabled = !selected_img_id;
      }

      if (instr_page === 7){
        const clicked_is_ac = (selected_img_id === attention_check_id);
        const should_click_ac = (trial.attention_check_index === 0);
        next_btn.disabled = should_click_ac ? !clicked_is_ac : clicked_is_ac;
      }
    }

    // function to advance the instruction
    function instrPageAdvance(){
      switch (instr_page){
        case 0:
          instr.innerHTML = 
            `Your job is to choose <strong>one</strong> image following the shown prompt.`;

          header.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 1:
          instr.innerHTML =
            `You can select an image by <b>clicking</b> on it. 
              When selected, the image will be <span style="color:magenta"><b><i>highlighted</i></b></span>. 
              Clicking another image switches your selection.`;

          header.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 2:
          instr.innerHTML = 
            `Please try selecting an image. The Next button will activate once you make a selection.`;

          clearSelections();
          next_btn.disabled = true;
          break;

        case 3:
          instr.innerHTML = 
            `<span style="color:#FF0000"><b>IMPORTANT ATTENTION CHECK!</b></span>
             In some trials, there is a <b>blurry image</b>.`;
          
          // randomly swap one image to attention check image
          const rand = images[Math.floor(Math.random()*images.length)];
          rand.src = trial.attn_img_with_src;
          attention_check_id = rand.id;
          clearSelections();
          break;
  
        case 4:
          instr.innerHTML = 
            `When there is a blurry image, you must follow the instructions shown <b>below</b> the images.`;

          footer.style.opacity = 1;
          footer.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 5:
          instr.innerHTML = 
            `The instructions given below the images will <b>change throughout the task</b>, so pay attention to them.`;
          break;

        case 6:
          instr.innerHTML = 
            `Please try the selection according to the instructions below the images.
             The Next button will activate once you follow the instructions below the images.`;
          footer.classList.remove('jspsych-image-rating-instr-highlight');
          clearSelections();
          next_btn.disabled = true;
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
          container.removeEventListener('click', imgClickListener);
          next_btn.removeEventListener('click', instrPageAdvance); 

          display_element.innerHTML = ''; 

          jsPsych.finishTrial(); 
          return;
      }
      instr_page++;
    }

    // ----------------- initialization -----------------
    let instr_page = 0;
    let selected_img_id = null;
    let attention_check_id = null;

    const next_btn = document.getElementById('jspsych-image-rating-submit-btn');
    const container = display_element.querySelector('.jspsych-image-rating-image-container');
    const images = container.querySelectorAll('img');
    const instr = document.getElementById('jspsych-image-rating-instr-text');
    const header = display_element.querySelector(".jspsych-image-rating-prompt-header");
    const footer = display_element.querySelector(".jspsych-image-rating-prompt-footer-center");

    container.addEventListener('click', imgClickListener);
    next_btn.addEventListener('click', instrPageAdvance);

  };

  return plugin;
})();
