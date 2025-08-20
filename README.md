This repository contains a set of [jsPsych](https://www.jspsych.org/) plugins implementing four different rating tasks described in the preprint [Reliable and Valid Rating Data in Less Time with the Fast Image Rating Experiment](https://osf.io/preprints/psyarxiv/v3n5a_v1).

# Rating Methods

There are four rating methods implemented in this repository. Each method has a "main" task plugin and a corresponding instruction version (suffixed with `-instr`). All plugins require accompanying CSS files for correct rendering (`jspsych.css` from jsPsych v6.3.1 and `jspsych-image-rating.css`; both are included in the repository).

## 1. Fast Image Rating Experiment (FIRE)  
* main plugin: `image-rating-fire`  
* instruction plugin: `image-rating-fire-instr`  
* Displays a **grid of images**, where participants can select multiple items according to the prompt.  
* In the paper, we used a setup where participants select **4 images out of a grid of 12 images**.  
* **Attention check**: when the grid includes an invalid ("blurry") image, participants are asked to drag it into a **trash can** area.  

## 2. Likert Rating  
* main plugin: `image-rating-likert`  
* instruction plugin: `image-rating-likert-instr`  
* Displays a **single image** with a **Likert-style categorical scale**.  
* In the paper, we used a **7-point Likert scale (1–7)**.  
* **Attention check**: when an invalid ("blurry") image is shown, participants are asked to give a specific rating (e.g., 4).  

## 3. Slider Rating  
* main plugin: `image-rating-slider`  
* instruction plugin: `image-rating-slider-instr`  
* Displays a **single image** with a continuous **slider scale**.  
* In the paper, we used a **0–100 slider scale** with step size 1.  
* **Attention check**: when an invalid ("blurry") image is shown, participants are asked to give an extreme rating (i.e., leftmost or rightmost).  

## 4. Pairwise Rating  
* main plugin: `image-rating-pairwise`  
* instruction plugin: `image-rating-pairwise-instr`  
* Displays **two images side by side**, and participants select the image that best matches the prompt.  
* **Attention check**: when one of the two images is invalid ("blurry"), participants are asked to select the valid image.

# Usage

You can use these plugins in the same way you would use any jsPsych plugin (see the official jsPsych [plugins overview](https://www.jspsych.org/latest/overview/plugins/)).

First, load the plugin’s JavaScript file in your experiment’s HTML page along with `jspsych.js` and the required CSS files. For example, to use the FIRE plugin:

```html
<head>
  <script src="jspsych-6.3.1/jspsych.js"></script>
  <script src="plugins/jspsych-image-rating-fire.js"></script>
  <link href="jspsych-6.3.1/css/jspsych.css" rel="stylesheet" type="text/css">
  <link href="css/jspsych-image-rating.css" rel="stylesheet" type="text/css">
</head>
```

Once the plugin is loaded, you can define a trial using that plugin. For example:

```javascript
const trial = {
    type: 'image-rating-fire',
    image_array_with_src: image_array_with_src,
    image_array: image_array,
};
```

Then, you can insert the trial to a timeline and run it with `jsPsych.init()`. See the individual plugin for the list of parameters for each plugin.

# Example Scripts

This repository provides example scripts to help you get started quickly.  

* `examples/image-rating.js` contains helper functions to build a jsPsych timeline using any of the rating methods.  
* The `/examples/{method}_example.html` files demonstrate a full working setup for each method. These can also serve as a base for adapting the plugins to your own experiment:  
  * FIRE: `examples/fire_example.html`  
  * Likert: `examples/likert_example.html`  
  * Slider: `examples/slider_example.html`  
  * Pairwise: `examples/pairwise_example.html`  
* You can try the example scripts here:
  * FIRE: [https://nwrim.github.io/jspsych-image-rating/examples/fire_example.html](https://nwrim.github.io/jspsych-image-rating/examples/fire_example.html)
  * Likert: [https://nwrim.github.io/jspsych-image-rating/examples/likert_example.html](https://nwrim.github.io/jspsych-image-rating/examples/likert_example.html)
  * Slider: [https://nwrim.github.io/jspsych-image-rating/examples/slider_example.html](https://nwrim.github.io/jspsych-image-rating/examples/slider_example.html)
  * Pairwise: [https://nwrim.github.io/jspsych-image-rating/examples/fire_example.html](https://nwrim.github.io/jspsych-image-rating/examples/slider_example.html)

# Dependencies and Attribution
* This repository **bundles [jsPsych v6.3.1](https://www.jspsych.org/)** so that the included examples can be run without additional setup.  
* jsPsych is an open-source experiment framework created and maintained by Joshua R. de Leeuw and contributors. Read more about the awesome framwork [here](https://www.jspsych.org/)!
* The `image-rating-likert` and `image-rating-slider` plugins build on the `survey-likert` and `image-slider-response` plugin from jsPsych v6.3.1
* An earlier version of the pairwise and FIRE plugin has been created by Kyoung Whan Choe (see [here](https://github.com/kywch/ImageRatingStudy)), which this plugin build on.

# Citation

If you use these plugins in your work, please cite:

Gaillard, E., Rim, N., Meidenbauer, K. L., Choe, K., & Berman, M. (2025, August 12). Reliable and Valid Rating Data in Less Time with the Fast Image Rating Experiment. https://doi.org/10.31234/osf.io/v3n5a_v1

# Contributing

Contributions or bug reports are welcome! Please open an [issue](https://github.com/nwrim/jspsych-image-rating/issues) or submit a pull request!

# License

* The plugins are distributed under the MIT License.
* The bundled jsPsych v6.3.1 is also licensed under MIT; see the jsPsych repository for details.