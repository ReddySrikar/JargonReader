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

class TranslateTogglebar {
  /**
   * @param {TranslateTogglebarOptions} options
   * @param {HTMLDivElement} languageContainer
   * @param {EventBus} eventBus
   */
  constructor(options, languageContainer, eventBus) {
    debugger;
    this.toolbar = options.toolbar;
    this.toggleButton = options.toggleButton;
    this.toolbarButtonContainer = options.toolbarButtonContainer;
    this.languageButtons = [
    { element: options.swedish, eventName: 'presentationmode',
      close: true, },
    { element: options.german, eventName: 'openfile', close: true, },
    { element: options.english, eventName: 'print', close: true, },
    { element: options.spanish, eventName: 'download', close: true, },
    { element: options.french, eventName: null, close: true, },
    { element: options.italian, eventName: 'firstpage',
      close: true, },
    { element: options.portuguese_BR, eventName: 'lastpage', close: true, },
    { element: options.portuguese_PO, eventName: 'rotatecw',
      close: false, },
    { element: options.mandarin, eventName: 'lastpage', close: true, },
    { element: options.russian, eventName: 'lastpage', close: true, },
    { element: options.dutch, eventName: 'lastpage', close: true, },
    { element: options.japanese, eventName: 'lastpage', close: true, },
    { element: options.danish, eventName: 'lastpage', close: true, },
    { element: options.norwegian, eventName: 'lastpage', close: true, },
    { element: options.finnish, eventName: 'lastpage', close: true, },
    { element: options.hindi, eventName: 'lastpage', close: true, },
    { element: options.irish, eventName: 'lastpage', close: true, },
    { element: options.bulgarian, eventName: 'lastpage', close: true, },
    { element: options.belgian, eventName: 'lastpage', close: true, },
    { element: options.farsi, eventName: 'rotateccw',
      close: false, },
    ];
    this.items = {
      firstPage: options.firstPageButton,
      lastPage: options.lastPageButton,
      pageRotateCw: options.pageRotateCwButton,
      pageRotateCcw: options.pageRotateCcwButton,
    };

    this.languageContainer = languageContainer;
    this.eventBus = eventBus;

    this.opened = false;
    this.containerHeight = null;
    this.previousContainerHeight = null;

    this.reset();

    // Bind the event listeners for click and cursor tool actions.
    this._bindClickListeners();
    this._bindCursorToolsListener(options);

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
    this._updateUIState();
  }

  setPagesCount(pagesCount) {
    this.pagesCount = pagesCount;
    this._updateUIState();
  }

  reset() {
    this.pageNumber = 0;
    this.pagesCount = 0;
    this._updateUIState();
  }

  _updateUIState() {
    this.items.firstPage.disabled = (this.pageNumber <= 1);
    this.items.lastPage.disabled = (this.pageNumber >= this.pagesCount);
    this.items.pageRotateCw.disabled = this.pagesCount === 0;
    this.items.pageRotateCcw.disabled = this.pagesCount === 0;
  }

  _bindClickListeners() {
    // Button to toggle the visibility of the translate togglebar.
    this.toggleButton.addEventListener('click', this.toggle.bind(this));

    // All items within the secondary toolbar.
    for (let button in this.buttons) {
      let { element, eventName, close, eventDetails, } = this.buttons[button];

      element.addEventListener('click', (evt) => {
        if (eventName !== null) {
          let details = { source: this, };
          for (let property in eventDetails) {
            details[property] = eventDetails[property];
          }
          this.eventBus.dispatch(eventName, details);
        }
        if (close) {
          this.close();
        }
      });
    }
  }

  _bindCursorToolsListener(buttons) {
    this.eventBus.on('cursortoolchanged', function(evt) {
      buttons.cursorSelectToolButton.classList.remove('toggled');
      buttons.cursorHandToolButton.classList.remove('toggled');

      switch (evt.tool) {
        case CursorTool.SELECT:
          buttons.cursorSelectToolButton.classList.add('toggled');
          break;
        case CursorTool.HAND:
          buttons.cursorHandToolButton.classList.add('toggled');
          break;
      }
    });
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
    this.containerHeight = this.languageContainer.clientHeight;

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
