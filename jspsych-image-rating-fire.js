// note that the plugin needs the jspsych-image-rating.css for proper rendering

jsPsych.plugins['image-rating-fire'] = (function () {

  jsPsych.pluginAPI.registerPreload('image-rating-fire', 'image_array_with_src', 'image');
  jsPsych.pluginAPI.registerPreload('image-rating-fire', 'trash_can', 'image');

  const plugin = {};

  plugin.info = {
    name: 'image-rating-fire',
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
      practice: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Practice flag',
        default: false,
        description: 'If true, one can only proceed after draging the blurry image to the trashcan'
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
    image_size, trash_can, trash_can_size, cell_padding, min_screen_width
  ) {

    const n_rows = image_array_with_src.length;
    const n_cols = image_array_with_src[0].length;

    // create blank element to hold code that we generate
    const cell_width = image_size[0] + 2 * cell_padding;      // img width + padding L/R
    const width      = Math.max(cell_width * n_cols, min_screen_width);

    // Display the header prompt above the image grid
    let html = `<div class="jspsych-image-rating-prompt-header" style="width:${width}px;">${prompt_header}</div>`;

    // image grid
    html += '<table class="jspsych-image-rating-image-container">';
    // loop through the row to create the rows (tr elements)
    for (let row = 0; row < n_rows; row++) {
      html += `<tr id="tr-${row}" style="height:${image_size[1] + 2*cell_padding}px;">`;
      // for each row, loop through the columns to create the columns (td elements)
      for (let col = 0; col < n_cols; col++) {
        // create a div for each cell (adds slight padding to the image)
        html += `<td> <div style="width:${image_size[0] + 2*cell_padding}px;
                                  height:${image_size[1] + 2*cell_padding}px;
                                  padding: ${cell_padding}px;">`;
        // if there is an image in the row-col, add the image to the cell
        if (image_array_with_src[row][col]) {
          html += `<img id="img-${row}-${col}"
                    data-id="${image_array[row][col]}" 
                    src="${image_array_with_src[row][col]}" 
                    style="width:${image_size[0]}px; height:${image_size[1]}px;"
                    draggable="true">`;
        }
        html += '</div></td>';
      }
      html += '</tr>';
    }
    html += '</table>';

    // create div for displaying the footer prompt and the submit button
    html += `<div class="jspsych-image-rating-prompt-footer" style="width:${width}px;">
                <div class="jspsych-image-rating-prompt-footer-left">
                  <img id="jspsych-image-rating-prompt-footer-left-trash" src="${trash_can}" 
                       style="height:${trash_can_size[1]}px; width:${trash_can_size[0]}px;">
                </div>
                <div class="jspsych-image-rating-prompt-footer-center">${prompt_footer}</div>
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

    if (trial.required_clicks <= 0) {
      throw new Error(`required_clicks (${trial.required_clicks}) must be greater than 0.`);
    }

    const n_imgs = trial.image_array.flat().length;
    if (trial.required_clicks > n_imgs) {
      throw new Error(`required_clicks (${trial.required_clicks}) exceeds number of images (${n_imgs}).`);
    }

    // ----------------- html rendering -----------------
    display_element.innerHTML = plugin.generateHtml(
      trial.prompt_header, trial.prompt_footer, trial.image_array_with_src,
      trial.image_array, trial.image_size, trial.trash_can, trial.trash_can_size,
      trial.cell_padding, trial.min_screen_width
    );

    // ----------------- functions -----------------
    // functions related to the submit button
    function updateSubmitBtn () {
      const submit_btn = document.getElementById('jspsych-image-rating-submit-btn');
      if (submit_btn) submit_btn.disabled = num_clicked !== trial.required_clicks;
    }
    
    function submitBtnListener(evt) {
      evt.target.disabled = true; // disable the button to prevent multiple clicks
      endTrial(evt);
    }

    // function to handle clicks on images
    function imgClickListener (evt) {
      if (evt.target.tagName !== 'IMG') return;
      const img = evt.target;
      if (img.classList.toggle('selected')) {
        num_clicked++;
      } else {
        num_clicked--;
      }
      updateSubmitBtn();
    }

    // functions to handle the trash can drag and drop
    function imgDragStart(evt){
      evt.dataTransfer.setData("Text", evt.target.id);
    }

    function trashDrop(evt) {
      evt.preventDefault();

      const img_id = evt.dataTransfer.getData('Text');
      const img     = document.getElementById(img_id);

      if (!img) return;

      img.classList.add('trashed'); // add class to indicate it was trashed
      if (img.dataset.id === trial.attention_check) {
          img.style.opacity = 0.3; // make the attention check image transparent
      } else {
          dimAndFadeBack(img)
      }
    }

    function trashDragOver(evt) { evt.preventDefault(); }

    function dimAndFadeBack(el) {
      el.style.transition = "none";
      el.style.opacity = 0.3;

      // force reflow so the browser applies the "no transition" style
      void el.offsetWidth;

      el.style.transition = `opacity 2s ease`;
      el.style.opacity = 1;
    }

    // function to finish the trial
    function endTrial(evt) {

      // get the clicked and trashed images
      const n_rows = trial.image_array.length;
      const n_cols = trial.image_array[0].length;
      const clicked = [];
      const trashed = [];

      for (let row = 0; row < n_rows; row++) {
        for (let col = 0; col < n_cols; col++) {
          const img_id = `img-${row}-${col}`;
          const img = document.getElementById(img_id);
          const img_name = img ? img.dataset.id : trial.image_array[row][col];

          if (img.classList.contains('selected')) clicked.push(img_name);
          if (img.classList.contains('trashed')) trashed.push(img_name);
        }
      }

      // attention check
      let pass_attention = true;
      if (trial.attention_check && !trashed.includes(trial.attention_check)) {
        pass_attention = false;
      }

      if (trial.practice && !pass_attention) {
        alert('You must find and drag the blurry image to the trash can.');
        evt.target.disabled = false; // re-enable the button
        return;
      }

      // build trial data
      const trial_data = {
        image_array: trial.image_array,
        clicked,
        trashed,
        attention_check: trial.attention_check,
        pass_attention,
        practice: trial.practice,
        rt: Math.round(performance.now() - trial_onset)
      };

      display_element.innerHTML = '';
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.finishTrial(trial_data);
    }

    // ----------------- initialization -----------------
    let num_clicked = 0;
    const container = display_element.querySelector('.jspsych-image-rating-image-container');
    const trash     = document.getElementById('jspsych-image-rating-prompt-footer-left-trash');

    container.addEventListener('click', imgClickListener);
    container.addEventListener('dragstart', imgDragStart);
    trash.addEventListener('drop', trashDrop);
    trash.addEventListener('dragover', trashDragOver);

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
