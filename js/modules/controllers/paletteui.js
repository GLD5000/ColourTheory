import { userObjects } from "../view/userobjects.js";
import { colourObject} from '../utilities/colourobject.js';
import { paletteData } from "./palettedata.js";
import { throttleDebounce} from '../utilities/utilities.js';
import { variantMaker } from "./variantmaker.js";
import { gradientMaker } from "./gradientmaker.js";
import { clampRotate } from "../utilities/utilities.js";
//import { callLogger } from "../utilities/utilities.js";
import { textMaker } from "./textmaker.js";

export const paletteUi = {
    _debounce(){
        this._updateVariants = throttleDebounce.debounce(() => variantMaker.updateVariants(),250);//working
    },
    _clipboardColourspaceLookup: {
        hex: '#ce9178',
        hsl: '#b5cea8',
        rgb: '#DCDCAA',
    },
    _init(){
        this._updateClipboard = 0;
        this._debounce();
        this._updatePrimaryGradient = (x) => gradientMaker.updateGradient(...x);//not returning

        userObjects.wrappers['dieA'].style.backgroundColor = colourObject.makeRandomHslString();
        userObjects.wrappers['dieB'].style.backgroundColor = colourObject.makeRandomHslString();
       // paletteData.addColour(colourObject.makeRandomColour('primary'));
        this.addColour(colourObject.makeRandomColour('primary'));
        //gradientMaker.updateGradient(paletteData.getColourObject('primary'));
       // this._updatePrimaryGradient = throttleDebounce.throttle((x) => gradientMaker.updateGradient(...x),85);//not returning
        this._setOnChange();
        this.setTextMode('Auto');
        this._initSmallWrapperContent();

        this._counter = 0;
        this._setColourspace('hsl');
        this._setClipboardTextAll();

        //this._debounceOnChangeTextPicker = debounceB(() => this._onChangeTextPicker(),250);
      },
    _splitName(name, separator = '-'){
        return name.split(separator)[0];
    },
    _initSmallWrapperContent(){
       userObjects.smallSwatchNamesArray.forEach(x => userObjects.wrappers[x + '-wrapper'].dataset.content = x);
    },
    _updateTextColour(backgroundColour) {
        textMaker.updateText(backgroundColour);
    },
    _getColourspace(){
        return userObjects.other['colourspace'].innerHTML.toLowerCase();
    },
    _setColourspace(colourspace){
        paletteData.setColourSpace(colourspace);
        this._setSliderStyles(colourspace);
        userObjects.other['colourspace'].innerHTML = colourspace;
        this._setClipboardTextAll();
        this.getAllSwatchNames().forEach(name => userObjects.copyButtons[name + '-copybtn'].innerHTML = this.getColourObject(name)[colourspace]);

    },

    _setSliderValues(args){
        userObjects.sliders.forEach((x,i) => x.value = args[i]);
    },
    _getSliderValues(){
        return userObjects.sliders.map(x => x.value);
    },
    _addPrimaryColour(newColour){
        this._updateClipboard = 0;
        const {hue, sat, lum, red, green, blue, hex} = newColour;
        const selectColourObject = {
            'hex': [hue, sat, lum],
            'hsl': [hue, sat, lum],
            'rgb': [red, green, blue],
        };
        const colourspace = this._getColourspace();
        this._setSliderValues(selectColourObject[colourspace]);
        userObjects.pickers['primary-picker'].value = hex;
        userObjects.copyButtons['primary-copybtn'].innerHTML = newColour[colourspace];
        this._updateVariants();
        this._initSmallWrapperContent();
        this.setTextMode('Auto');
        this._updateClipboard = 1;
        this._setClipboardTextAll();
    },
    addColour(newColour){// not working for custom picker or custom text
        paletteData.addColour(newColour);
        gradientMaker.updateGradient(newColour);
        textMaker.updateText(newColour);
        if (newColour.name === 'primary') {
            this._addPrimaryColour(newColour);
            return;
        }
        userObjects.pickers[newColour.name + '-picker'].value = newColour.hex;
        userObjects.copyButtons[newColour.name + '-copybtn'].innerHTML = newColour[this._getColourspace()];
        this._setClipboardTextAll();
    },
    setBackgroundGradient(name, string){
        userObjects.wrappers[name + '-wrapper'].style.background = string;
    },
    _getSliderColourObject(){
        const selectColourKeys = {
            'hex': ['red', 'green', 'blue'],
            'hsl': ['hue', 'sat', 'lum'],
            'rgb': ['red', 'green', 'blue'],
        };        
        const selectColourMethod = {
            'hex': 'fromSrgb',
            'hsl': 'fromHsl',
            'rgb': 'fromSrgb',
        };

        const colourspace = this._getColourspace();
        const keysArray = selectColourKeys[colourspace];
        const sliderValuesArray = this._getSliderValues();
        const returnObject = {name: 'primary'};

        keysArray.forEach((x, i) => returnObject[x] = sliderValuesArray[i] );
        return colourObject[selectColourMethod[colourspace]](returnObject);
    },
    _oninputSlider(x){
        this.addColour(this._getSliderColourObject());//update data store
    },
    _onclickGradient(){
        paletteData.paletteState.gradientMode = clampRotate.rotate(1* paletteData.paletteState.gradientMode + 1, 1 ,10) || 1;
        userObjects.other['gradient'].innerHTML = 'Gradient Mode: ' + paletteData.paletteState.gradientMode;
        paletteData.backgroundColours.forEach(colour => gradientMaker.updateGradient(colour));
        this._setClipboardTextAll();

    },
    _onclickRandom(){
        //paletteData.addColour(colourObject.makeRandomColour('primary'));
        this.addColour(colourObject.makeRandomColour('primary'));
        //gradientMaker.updateGradient(paletteData.getColourObject('primary'));
        userObjects.wrappers['dieA'].style.backgroundColor = colourObject.makeRandomHslString();
        userObjects.wrappers['dieB'].style.backgroundColor = colourObject.makeRandomHslString();
    },
    _addTextColour(name, hex) {
       const textColour = colourObject.fromHex({name: name, hex: hex});
       this.getAllSwatchNames().forEach(key => {
        const backgroundColour = paletteData.getColourObject(this._splitName(key));
        const newTextColour = colourObject.getTextColourContrast(textColour, backgroundColour);
        this.setTextColour(newTextColour);
       });
    },
    _addCustomColour(name, hex) {
        const customName = paletteData.getCustomColourName(name) || `Custom${++this._counter}`;    // for custom colour add as normal but save custom status and update dataset.content
        paletteData.addCustomColour(name, colourObject.fromHex({name: name, customName: customName, hex: hex}));// store custom name with colour under key of swatch location
        userObjects.wrappers[name + '-wrapper'].dataset.content = customName;// update wrapper content
        this._setClipboardTextAll();
    },
    _oninputPicker(x){
        const name = this._splitName(x.target.id);
        const hex = x.target.value;
        if (name === 'textcolour') {
            this.setTextMode('Custom');
            this._addTextColour('customText',hex);
            return;
        }// do not add as normal due to no wrapper thing 
        const newPartial = {hex: hex};
        newPartial.name = name;
        const newColour = colourObject.fromHex(newPartial);
        this.addColour(newColour);
        if (name !== 'primary') this._addCustomColour(name, hex); // custom colour

    },
    _onclickSmallSwatch(e){
        const name = this._splitName(e.target.id);
        const customColour = paletteData.getCustomColourObject(name);
        if (customColour == null) return;
        this.addColour(customColour);
        const wrapper = userObjects.wrappers[customColour.name + '-wrapper'];
        wrapper.dataset.content = customColour.customName;
    },
    _getClipboardTextSingle(name){
        const colourspace = this._getColourspace();
        const prefix = paletteData.getPrefix();
        let customName = paletteData.getCustomColourName(name)|| name;
        const textArray = [`${prefix}${customName}: ${paletteData.getColourObject(name)[colourspace]}`];
        const gradientColours = paletteData.getGradientColours(name);
        if (gradientColours != null) {
            gradientColours.forEach(x => {
                customName = paletteData.getCustomColourName(x.name) ||x.name;
                textArray.push(`${prefix}${customName}: ${x[colourspace]}`)
            });
        }
        return textArray.join('\n');
    },
    _getClipboardTextSingleAsArray(name){
        const colourspace = this._getColourspace();
        const prefix = paletteData.getPrefix();
        let customName = paletteData.getCustomColourName(name) || name;
        const textArray = [[`${prefix}${customName}: `],
        [`${paletteData.getColourObject(name)[colourspace]}`],
        [`${prefix}${customName}: ${paletteData.getColourObject(name)[colourspace]}`]];
        const gradientColours = paletteData.getGradientColours(name);
        if (gradientColours != null) {
            gradientColours.forEach(x => {
                customName = paletteData.getCustomColourName(x.name) ||x.name;

                textArray[0].push(`${prefix}${customName}: `);
                textArray[1].push(`${x[colourspace]}`);
                textArray[2].push(`${prefix}${customName}: ${x[colourspace]}`);
            });
        }
        //return [textArray[0].join('\n'), textArray[1].join('\n')];
        return [textArray[0], textArray[1], textArray[2]];
    },
    _clipboard: userObjects.clipboard.clipboard,
    _clipboardSecondary: userObjects.clipboard['clipboard-secondary'],
    

    _setClipboardTextAll(){
        if (this._updateClipboard === 0) return;
        const swatchNames = this.getAllSwatchNames();
        const colourspace = this._getColourspace();
        const prefix = paletteData.getPrefix();
        const textArray = [[],[],[]];
        swatchNames.forEach(x => {
            const returnArray = this._getClipboardTextSingleAsArray(x);
            textArray[0].push(...returnArray[0]);
            textArray[1].push(...returnArray[1]);
            textArray[2].push(...returnArray[2]);
        });
        paletteData.setClipboard(textArray);
        // Set innerHTML text
        this._clipboard.innerHTML = textArray[0].join('\n');;
        // Set ::after content element text
        this._clipboardSecondary.innerHTML = textArray[1].join('\n');
        this._clipboardSecondary.style.color = this._clipboardColourspaceLookup[this._getColourspace()];

    },
    _onclickCopyAll(){
            const textArray = paletteData.getClipboard()[2];
        let text = textArray.join('\n');
        navigator.clipboard.writeText(text);
        alert(`Copied To Clipboard:\n${text}`);
    },

    _onclickCopyButtons(e){
        const name = this._splitName(e.target.id);
        if (name == 'copyAllCSS') {
            this._onclickCopyAll();
            return;
        }
        const text = this._getClipboardTextSingle(name);
        navigator.clipboard.writeText(text);
        alert(`Copied To Clipboard:\n${text}`);
    
    },
    _setSliderStyles(colourspace){
        const sliderNameArrays = {
            hex: [ 'tint', 'temp', 'lum'],
            hsl: [ 'hue', 'sat', 'lum'],
            rgb: [ 'red', 'green', 'blue'],
        }
/*         const sliderGradientArrays = {
            hex: [ 'background:linear-gradient(to right, #d00,#0d0)', 'background:linear-gradient(to left, #dd0,#00d)', 'background:linear-gradient(to left, #fff,#555)'],
            hsl: [ 'linear-gradient(to right, hsl(0,$sat,$lum), hsl(60,$sat,$lum), hsl(120,$sat,$lum), hsl(180,$sat,$lum), hsl(240,$sat,$lum),hsl(300,$sat,$lum),hsl(360,$sat,$lum))', 'linear-gradient(to right, hsl(0,0%,$lum), hsl(60,10%,$lum), hsl(120,20%,$lum), hsl(180,40%,$lum), hsl(240,80%,$lum),hsl(300,100%,$lum),hsl(360,100%,$lum))', 'background:linear-gradient(to left, #fff,#555)'],
            rgb: [ 'background:linear-gradient(to left, #000,#d00)', 'background:linear-gradient(to left, #000,#0d0)', 'background:linear-gradient(to left, #000,#00d)'],
        }
 */        
        const namesArray = sliderNameArrays[colourspace];
        //const gradientsArray = sliderGradientArrays[colourspace];
        userObjects.sliders.forEach((x,i) => {
            x.name = namesArray[i]; //set name
        });
    },
    _onclickColourspace(){
        const colourspace = this._getColourspace();
        const optionsArray = ['hex','hsl','rgb'];
        const arrayLimit = optionsArray.length -1;
        let index = optionsArray.indexOf(colourspace);
        index++;
        if (index > arrayLimit) index = 0;
        const newColourspace = optionsArray[index];
        this._setColourspace(newColourspace);
    },
    _onclickPrefix(){
        const prefix = paletteData.getPrefix();
        const prefixMode = paletteData.getPrefixMode();
        if (prefixMode === 'SCSS'){
            paletteData.setPrefixMode('CSS');
            userObjects.other['prefix'].innerHTML = 'CSS';
            paletteData.setPrefix('--');
            this._setClipboardTextAll();
            return;
        }
        paletteData.setPrefixMode('SCSS');
        userObjects.other['prefix'].innerHTML = 'SCSS';
        paletteData.setPrefix('$');
        this._setClipboardTextAll();
    },
    _setOnChange() {
        userObjects.other['colourspace'].onclick = () => this._onclickColourspace();//to make
        userObjects.other['prefix'].onclick = () => this._onclickPrefix();// to make
        userObjects.other['gradient'].onclick = () => this._onclickGradient();
        userObjects.other['dice-btn'].onclick = () => this._onclickRandom();
        userObjects.other['randomise-btn'].onclick = () => this._onclickRandom();
        Object.keys(userObjects.copyButtons).forEach(x => userObjects.copyButtons[x].onclick = (e) => this._onclickCopyButtons(e));//'copyAllCSS'
        Object.keys(userObjects.clipboard).forEach(x => userObjects.clipboard[x].onclick = () => this._onclickCopyAll());//'copyAllCSS'

        userObjects.sliders.forEach((x) => x.oninput = throttleDebounce.throttle((x) => this._oninputSlider(x),85));
        Object.keys(userObjects.pickers).forEach((x) => userObjects.pickers[x].oninput = throttleDebounce.throttle((x) => this._oninputPicker(...x),85) );
        this.getSmallSwatchNames().forEach(x => userObjects.pickers[x + '-picker'].onclick = (e) => this._onclickSmallSwatch(e));
    }, 
    getStops(){
        return userObjects.other['gradient'].innerHTML.toLowerCase();
    },
    userObjects(){
        return userObjects;
    },
    getColourObject(name){
        return paletteData.getColourObject(name);
    },
    getTextMode(){
        return paletteData.getTextMode();
    },
    setTextMode(mode){
        paletteData.setTextMode(mode);
        userObjects.other['textmode'].dataset.content = `Text: ${mode}`;
    },
    getTextColour(backgroundColour){
        return paletteData.getTextColour(backgroundColour);
    },
    _getWrapper(name){
        return userObjects.wrappers[name + '-wrapper'];
    },
    _setWrapperTextColour(textColour){
        const name = this._splitName(textColour.name)
        const wrapper = this._getWrapper(name);
        wrapper.style.color = textColour.hex || '#000000';
        if (name === 'primary') {
            wrapper.dataset.content = textColour.contrastString;
            //userObjects.pickers['textcolour-picker'].value = textColour.hex;
        }
        if (name !== 'primary') wrapper.dataset.rating = textColour.rating;
    },
    setTextColour(textColour){
        this._setWrapperTextColour(textColour);
        paletteData.setTextColour(textColour);
    },
    getSmallSwatchNames(){
        return userObjects.smallSwatchNamesArray;
    },
    getAllSwatchNames(){
        return ['primary', ...userObjects.smallSwatchNamesArray];
    },

}
