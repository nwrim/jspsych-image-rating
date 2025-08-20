// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-fire-instr'] = (function () {

  jsPsych.pluginAPI.registerPreload('image-rating-fire-instr', 'image_array_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-fire-instr', 'attn_img_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-fire-instr', 'trash_can', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-fire-instr',
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
      attn_img_with_src: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Attention check image with source',
        default: undefined,
        description: 'The attention check image file name including the source'
      },
      image_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image size',
        array: true,
        default: [280, 210],
        description: 'Array specifying the width and height (px) of the images to show.'
      },
      minimum_trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Minimum Trial duration',
        default: 4000,
        description: 'Delay before the Submit button appears (ms)'
      },
      required_clicks: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Required clicks',
        default: 4,
        description: 'The number of click one should make to proceed. Must be less than or equal to the number of images and greater than 0.'
      },
      trash_can: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Trash can',
        default: './lib/trash_can.png',
        description: 'Trash can image with source'
      },
      trash_can_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trash can image size',
        array: true,
        default: [213, 55],
        description: 'Array specifying the width and height of the trash can image (px)'
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
  };

  plugin.generateHtml = function (
    prompt_header, prompt_footer, image_array_with_src, image_size, 
    trash_can, trash_can_size, cell_padding, min_screen_width
  ) {
    const n_rows = image_array_with_src.length;
    const n_cols = image_array_with_src[0].length;

    // create blank element to hold code that we generate
    const cell_width = image_size[0] + 2 * cell_padding;      // img width + padding L/R
    const width   = Math.max(cell_width * n_cols, min_screen_width);

    // Display the initial instruction text and prompt header above the image grid
    let html = `<div class="jspsych-image-rating-instr" style="width:${width}px;">
            <p id="jspsych-image-rating-instr-text">
                In each trial of this task, you will see a screen like the one below.
            </p>
            </div> 
            <div class="jspsych-image-rating-prompt-header" style="width:${width}px;">
                ${prompt_header}
            </div>`;

    // image grid
    html += '<table class="jspsych-image-rating-image-container">';
    // loop through the row to create the rows (tr elements)
    for (let row = 0; row < n_rows; row++) {
      html += `<tr style="height:${image_size[1] + 2*cell_padding}px;">`;
      // for each row, loop through the columns to create the columns (td elements)
      for (let col = 0; col < n_cols; col++) {
        // create a div for each cell (adds slight padding to the image)
        html += `<td> <div style="width:${image_size[0] + 2*cell_padding}px;
                                  height:${image_size[1] + 2*cell_padding}px;
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

    // create div for displaying the footer prompt and the submit button
    html += `<div class="jspsych-image-rating-prompt-footer"
                style="width:${width}px;">
                <div class="jspsych-image-rating-prompt-footer-left">
                    <img id="jspsych-image-rating-prompt-footer-left-trash" src="${trash_can}" 
                          style="height:${trash_can_size[1]}px; width:${trash_can_size[0]}px; display:none;">
                </div>
                <div class="jspsych-image-rating-prompt-footer-center" style="opacity:0;">${prompt_footer}</div>
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

    if (trial.required_clicks <= 0) {
      throw new Error(`required_clicks (${trial.required_clicks}) must be greater than 0.`);
    }

    const n_imgs = trial.image_array_with_src.flat().length;
    if (trial.required_clicks > n_imgs) {
      throw new Error(`required_clicks (${trial.required_clicks}) exceeds number of images (${n_imgs}).`);
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(trial.prompt_header, 
      trial.prompt_footer, trial.image_array_with_src, trial.image_size, 
      trial.trash_can, trial.trash_can_size, 
      trial.cell_padding, trial.min_screen_width);
    
    // ----------------- functions -----------------
    // function to handle clicks on images
    function imgClickListener (evt) {
      if (evt.target.tagName !== 'IMG') return;

      const img = evt.target;
      if (img.classList.toggle('selected')) {
        instr_num_clicked++;
      } else {
        instr_num_clicked--;
      }

      if (instr_page === 3){
        next_btn.disabled = instr_num_clicked !== trial.required_clicks;
      }
    }

    // functions to handle the trash can drag and drop
    function imgDragStart(evt){
      if (instr_page < 3) return;
      evt.dataTransfer.setData("Text", evt.target.id);
    }

    function trashDrop(evt) {
      if (instr_page < 3) return;

      evt.preventDefault();

      const img_id = evt.dataTransfer.getData('Text');
      const img     = document.getElementById(img_id);

      if (!img) return; // if the image is not found, do nothing

      if (img_id === attention_check_id) {
        img.style.opacity = 0.3; // make the attention check image transparent
        if (instr_page === 7){
          next_btn.disabled = false; // enable the Next button
        }
      } else {
        dimAndFadeBack(img)
      }
    }

    function trashDragOver(evt) { if (instr_page > 2) evt.preventDefault(); }

    function dimAndFadeBack(el) {
      el.style.transition = "none";
      el.style.opacity = 0.3;

      // force reflow so the browser applies the "no transition" style
      void el.offsetWidth;

      el.style.transition = `opacity 2s ease`;
      el.style.opacity = 1;
    }

    // function to advance the instruction
    function instrPageAdvance() {
      switch (instr_page) {
        case 0:
          instr.innerHTML = 
              `Your job is to choose <b>${trial.required_clicks}</b> images following the shown prompt.`;
          
          header.classList.add('jspsych-image-rating-instr-highlight');
          break;

        case 1:
          instr.innerHTML = 
              `You can select an image by <b>clicking</b> on it. 
                When selected, the image will be <span style="color:magenta"><b><i>highlighted</i></b></span>.
                You can unselect it by clicking it again.`;
          
          header.classList.remove('jspsych-image-rating-instr-highlight');
          break;

        case 2:
          instr.innerHTML = 
              `Please try selecting ${trial.required_clicks} images.
               The Next button will activate once you select ${trial.required_clicks} images.`;
          
          images.forEach(img => img.classList.remove('selected'));
          instr_num_clicked = 0;
          next_btn.disabled = true;
          break;

        case 3:
          instr.innerHTML = 
              `<span style="color:#FF0000"><b>IMPORTANT ATTENTION CHECK!</b></span>
                In some trials, there is a <b>blurry image</b> among the others.`;

          const rand = Array.from(images)[Math.floor(Math.random() * images.length)];
          rand.src = trial.attn_img_with_src; // change the image to the attention check
          attention_check_id = rand.id; // store the id of the attention check image
          images.forEach(img => {img.classList.remove('selected');});
          break;

        case 4:
          instr.innerHTML = 
            `When there is a blurry image, you must drag and drop the blurry image into the <b>trash can</b>.`;

          trash.style.display = "";
          footer.style.opacity = 1;
          footer.classList.add('jspsych-image-rating-instr-highlight');
          instr_num_clicked = 0;
          images.forEach(img => {img.draggable = true;});
          break;
        
        case 5:
          instr.innerHTML = 
              `If the image is <b><i>successfully</i></b> dragged into the trash can, it will become <u><b>transparent.</b></u>
                If the image was not blurry but dragged into the trash can, it will gradually return to its original state.`;
          break;

        case 6:
          instr.innerHTML = 
              `Please try dragging the blurry image into the trash can.
              The Next button will activate once you successfully drop the blurry image into the trash can.`;
          
          images.forEach(img => img.style.opacity = 1);
          footer.classList.remove('jspsych-image-rating-instr-highlight');
          next_btn.disabled = true; // disable the Next button
          break;

        case 7:
          instr.innerHTML = 
              `If you miss <span style="color:#FF0000"><u><b>more than half of the blurry images</b></u></span>, you will be rejected.`;
          break;
        
        case 8:
          const sec = Math.floor(trial.minimum_trial_duration/1000);
          const unit = sec === 1 ? 'second' : 'seconds';
          const msg = (trial.minimum_trial_duration > 500)
            ? `Finally, in the actual task, the button will appear <b>${sec} ${unit}</b> after the trial starts. 
               Please <i>take your time to inspect the images</i>.`
            : `Please press the <span style="color:#FF0000"><b><i>Next</i></b></span> button to move on.
               Please <i>take your time to inspect the images</i>.`;
          instr.innerHTML = msg;
          break;

        case 9: 
          container.removeEventListener('click', imgClickListener);
          container.removeEventListener('dragstart', imgDragStart);
          trash.removeEventListener('drop', trashDrop);
          trash.removeEventListener('dragover', trashDragOver);
          next_btn.removeEventListener('click', instrPageAdvance);
          
          display_element.innerHTML = '';

          jsPsych.finishTrial();
          return;
      }

      instr_page++;
    }

    // ----------------- initialization -----------------
    let instr_page        = 0;
    let instr_num_clicked = 0;
    let attention_check_id   = null;
    const next_btn = document.getElementById('jspsych-image-rating-submit-btn');
    const container = display_element.querySelector('.jspsych-image-rating-image-container');
    const images = container.querySelectorAll('img');
    const trash = document.getElementById('jspsych-image-rating-prompt-footer-left-trash');
    const instr = document.getElementById('jspsych-image-rating-instr-text');
    const header = display_element.querySelector(".jspsych-image-rating-prompt-header");
    const footer = display_element.querySelector(".jspsych-image-rating-prompt-footer-center");

    // initial listener attachments
    container.addEventListener('click', imgClickListener);
    container.addEventListener('dragstart', imgDragStart);
    trash.addEventListener('drop', trashDrop);
    trash.addEventListener('dragover', trashDragOver);
    next_btn.addEventListener('click', instrPageAdvance);
  }

  return plugin;
})();
