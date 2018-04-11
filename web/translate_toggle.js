/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CursorTool } from './pdf_cursor_tools';
import { SCROLLBAR_PADDING } from './ui_utils';
import { languageArr } from './languageConstants';

class TranslateTogglebar {
  /**
   * @param {TranslateTogglebarOptions} options
   * @param {HTMLDivElement} mainContainer
   * @param {EventBus} eventBus
   */
  constructor(options, mainContainer, eventBus) {
    this.languageArr = languageArr;
    this.toolbar = options.toolbar;
    this.toggleButton = options.toggleButton;
    this.toolbarButtonContainer = options.toolbarButtonContainer;
    this.buttons = [
    { element: options.swedish, eventName: 'setTargetLanguage', eventSubType: 'sv',
      close: true, },
    { element: options.spanish, eventName: 'setTargetLanguage', eventSubType: 'es', close: true, },
    { element: options.french, eventName: 'setTargetLanguage', eventSubType: 'fr', close: true, },
    { element: options.german, eventName: 'setTargetLanguage', eventSubType: 'de', close: true, },
    { element: options.italian, eventName: 'setTargetLanguage', eventSubType: 'it',
    close: true, },
    { element: options.portuguese_br, eventName: 'setTargetLanguage', eventSubType: 'pt', close: true, },
    { element: options.bulgarian, eventName: 'setTargetLanguage', eventSubType: 'bg', close: true, },
    { element: options.english, eventName: 'setTargetLanguage', eventSubType: 'en', close: true, },

    // Release the languages when support is added on the front end.
    /*
    { element: options.mandarin, eventName: 'setTargetLanguage', eventSubType: 'mandarin', close: true, },
    { element: options.russian, eventName: 'setTargetLanguage', eventSubType: 'russian', close: true, },
    { element: options.dutch, eventName: 'setTargetLanguage', eventSubType: 'dutch', close: true, },
    { element: options.japanese, eventName: 'setTargetLanguage', eventSubType: 'japanese', close: true, },
    { element: options.danish, eventName: 'setTargetLanguage', eventSubType: 'danish', close: true, },
    { element: options.norwegian, eventName: 'setTargetLanguage', eventSubType: 'norwegian', close: true, },
    { element: options.finnish, eventName: 'setTargetLanguage', eventSubType: 'finnish', close: true, },
    { element: options.hindi, eventName: 'setTargetLanguage', eventSubType: 'hindi', close: true, },
    { element: options.irish, eventName: 'setTargetLanguage', eventSubType: 'irish', close: true, },
    { element: options.english, eventName: 'setTargetLanguage', eventSubType: 'english', close: true, },
    { element: options.belgian, eventName: 'setTargetLanguage', eventSubType: 'belgian', close: true, },
    { element: options.farsi, eventName: 'setTargetLanguage', eventSubType: 'farsi',
      close: false, },*/
    ];

    this.mainContainer = mainContainer;
    this.eventBus = eventBus;

    this.opened = false;
    this.containerHeight = null;
    this.previousContainerHeight = null;

    this.reset();

    // Bind the event listeners for click and cursor tool actions.
    this._bindClickListeners();

    // Bind the event listener for adjusting the 'max-height' of the toolbar.
    this.eventBus.on('resize', this._setMaxHeight.bind(this));
  }

  /**
   * @return {boolean}
   */
  get isOpen() {
    return this.opened;
  }

  setPageNumber(pageNumber) {
    this.pageNumber = pageNumber;
    //this._updateUIState();
  }

  setPagesCount(pagesCount) {
    this.pagesCount = pagesCount;
    //this._updateUIState();
  }

  reset() {
    this.pageNumber = 0;
    this.pagesCount = 0;
    //this._updateUIState();
  }

/*  _updateUIState() {
    this.items.firstPage.disabled = (this.pageNumber <= 1);
    this.items.lastPage.disabled = (this.pageNumber >= this.pagesCount);
    this.items.pageRotateCw.disabled = this.pagesCount === 0;
    this.items.pageRotateCcw.disabled = this.pagesCount === 0;
  } */

  _bindClickListeners() {
    // Button to toggle the visibility of the translate togglebar.
    this.toggleButton.addEventListener('click', this.toggle.bind(this));

    // All items within the translate toolbar.
    for (let button in this.buttons) {
      let { element, eventName, eventSubType, close, } = this.buttons[button];

      element.addEventListener('click', (evt) => {
        const alertDetails = this.languageArr.find(x => x.langCode === eventSubType);
        if (eventName !== null) {
          swal({
            title: alertDetails.helloText+"\nSwitched to "+alertDetails.language.toUpperCase(),
            timer: 3000,
            imageUrl: alertDetails.langImg
          });
          this.eventBus.dispatch(eventName, eventSubType);
        }
        if (close) {
          this.close();
        }
      });
    }
  }

  open() {
    if (this.opened) {
      return;
    }
    this.opened = true;
    this._setMaxHeight();

    this.toggleButton.classList.add('toggled');
    this.toolbar.classList.remove('hidden');
  }

  close() {
    if (!this.opened) {
      return;
    }
    this.opened = false;
    this.toolbar.classList.add('hidden');
    this.toggleButton.classList.remove('toggled');
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * @private
   */
  _setMaxHeight() {
    if (!this.opened) {
      return; // Only adjust the 'max-height' if the toolbar is visible.
    }
    this.containerHeight = this.mainContainer.clientHeight;

    if (this.containerHeight === this.previousContainerHeight) {
      return;
    }
    this.toolbarButtonContainer.setAttribute('style',
      'max-height: ' + (this.containerHeight - SCROLLBAR_PADDING) + 'px;');

    this.previousContainerHeight = this.containerHeight;
  }
}

export {
  TranslateTogglebar,
};
