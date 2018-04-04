/* Copyright 2016 Mozilla Foundation
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

import { NullL10n } from './ui_utils';
import { RenderingStates } from './pdf_rendering_queue';

const UI_NOTIFICATION_CLASS = 'pdfSidebarNotification';

const TranslatorView = {
  NONE: 0,
  TRANSLATOR: 1,
  //COULD ADD MORE VIEWS HERE!!!
};

/**
 * @typedef {Object} PDFTranslatorOptions
 * @property {PDFViewer} pdfViewer - The document viewer.
 * @property {HTMLDivElement} outerContainer - The outer container
 *   (encasing both the viewer and sidebar elements).
 * @property {HTMLDivElement} viewerContainer - The viewer container
 *   (in which the viewer element is placed).
 * @property {EventBus} eventBus - The application event bus.
 * @property {HTMLButtonElement} toggleButton - The button used for
 *   opening/closing the sidebar.
 * @property {HTMLButtonElement} translatorButton - The button used to show
 *   the translator view.
 * @property {HTMLDivElement} translatorView - The container in which
 *   the translator is placed.
 * @property {boolean} disableNotification - (optional) Disable the notification
 *   for documents containing outline/attachments. The default value is `false`.
 */

class PDFTranslator {
  /**
   * @param {PDFSidebarOptions} options
   * @param {IL10n} l10n - Localization service.
   */
  constructor(options, l10n = NullL10n) {
    this.isOpen = false;
    this.active = TranslatorView.TRANSLATOR;
    this.isInitialViewSet = false;

    /**
     * Callback used when the translator has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFTranslatorViewer) are updated correctly.
     */
    this.onToggled = null;

    this.pdfViewer = options.pdfViewer;
    this.pdfTranslatorViewer = options.pdfTranslatorViewer;
    // CHANGE THIS ABOVE
    this.outerContainer = options.outerContainer;
    this.viewerContainer = options.viewerContainer;
    this.translatorContainer = options.translatorContainer;
    this.eventBus = options.eventBus;
    this.toggleButton = options.toggleButton;

    this.translatorButton = options.translatorButton;
    // Change this above!!!
    // MORE BUTTONS COULD BE ADDED HERE for each corresponding view!!!

    this.tranlatorView = options.translatorView;
    //MORE VIEWS HERE!!!

    this.disableNotification = options.disableNotification || false;

    this.l10n = l10n;

    this._addEventListeners();
  }

  reset() {
    this.isInitialViewSet = false;

    this._hideUINotification(null);
    this.switchView(TranslatorView.TRANSLATOR);
  }

  /**
   * @returns {number} One of the values in {TranslatorView}.
   */
  get visibleView() {
    return (this.isOpen ? this.active : TranslatorView.NONE);
  }

  get isTranslatorViewVisible() {
    return (this.isOpen && this.active === TranslatorView.TRANSLATOR);
  }

  /**
   * @param {number} view - The sidebar view that should become visible,
   *                        must be one of the values in {TranslatorView}.
   */
  setInitialView(view = TranslatorView.NONE) {
    if (this.isInitialViewSet) {
      return;
    }
    this.isInitialViewSet = true;

    if (this.isOpen && view === TranslatorView.NONE) {
      this._dispatchEvent();
      // If the user has already manually opened the sidebar,
      // immediately closing it would be bad UX.
      return;
    }
    let isViewPreserved = (view === this.visibleView);
    this.switchView(view, /* forceOpen */ true);

    if (isViewPreserved) {
      // Prevent dispatching two back-to-back `TranslatorViewchanged` events,
      // since `this.switchView` dispatched the event if the view changed.
      this._dispatchEvent();
    }
  }

  /**
   * @param {number} view - The translator view that should be switched to,
   *                        must be one of the values in {TranslatorView}.
   * @param {boolean} forceOpen - (optional) Ensure that the translator is open.
   *                              The default value is `false`.
   */
  switchView(view, forceOpen = false) {
    if (view === TranslatorView.TRANSLATOR) {
      this.close();
      return;
    }
    let isViewChanged = (view !== this.active);
    let shouldForceRendering = false;

    switch (view) {
      case TranslatorView.TRANSLATOR:
        this.translatorButton.classList.add('toggled');

        // this.translatorView.classList.remove('hidden');

        if (this.isOpen && isViewChanged) {
          shouldForceRendering = true;
        }
        break;
      default:
        console.error('PDFTranslator_switchView: "' + view +
                      '" is an unsupported value.');
        return;
    }
    // Update the active view *after* it has been validated above,
    // in order to prevent setting it to an invalid state.
    this.active = view | 0;

    if (forceOpen && !this.isOpen) {
      this.open();
      return; // NOTE: Opening will trigger rendering, and dispatch the event.
    }
    if (shouldForceRendering) {
      this._forceRendering();
    }
    if (isViewChanged) {
      this._dispatchEvent();
    }
    this._hideUINotification(this.active);
  }

  open() {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.toggleButton.classList.add('toggled');

    this.translatorContainer.classList.add('sidebarMoving');
    this.translatorContainer.classList.add('sidebarOpen');

    this._forceRendering();
    this._dispatchEvent();

    this._hideUINotification(this.active);
  }

  close() {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.toggleButton.classList.remove('toggled');

    this.translatorContainer.classList.add('sidebarMoving');
    this.translatorContainer.classList.remove('sidebarOpen');

    this._forceRendering();
    this._dispatchEvent();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * @private
   */
  _dispatchEvent() {
    this.eventBus.dispatch('translatorviewchanged', {
      source: this,
      view: this.visibleView,
    });
  }

  /**
   * @private
   */
  _forceRendering() {
    if (this.onToggled) {
      this.onToggled();
    } else { // Fallback
      this.pdfViewer.forceRendering();
      this.pdfTranslatorViewer.forceRendering();
    }
  }

  /**
   * @private
   */
/*  _updateTranslatorViewer() {
    let { pdfViewer, pdfTranslatorViewer, } = this;

    // Use the rendered pages to set the corresponding thumbnail images.
    let pagesCount = pdfViewer.pagesCount;
    for (let pageIndex = 0; pageIndex < pagesCount; pageIndex++) {
      let pageView = pdfViewer.getPageView(pageIndex);
      if (pageView && pageView.renderingState === RenderingStates.FINISHED) {
        let translatorView = pdfTranslatorViewer.getThumbnail(pageIndex);
        translatorView.setImage(pageView);
      }
    }
    pdfTranslatorViewer.scrollThumbnailIntoView(pdfViewer.currentPageNumber);
  } */

  /**
   * @private
   */
  _showUINotification(view) {
    if (this.disableNotification) {
      return;
    }

    this.l10n.get('toggle_translator_notification.title', null,
                  'Toggle Translator').
        then((msg) => {
      this.toggleButton.title = msg;
    });

    if (!this.isOpen) {
      // Only show the notification on the `toggleButton` if the translator is
      // currently closed, to avoid unnecessarily bothering the user.
      this.toggleButton.classList.add(UI_NOTIFICATION_CLASS);
    } else if (view === this.active) {
      // If the translator is currently open *and* the `view` is visible, do not
      // bother the user with a notification on the corresponding button.
      return;
    }

        this.translatorButton.classList.add(UI_NOTIFICATION_CLASS);

  }

  /**
   * @private
   */
  _hideUINotification(view) {
    if (this.disableNotification) {
      return;
    }

    let removeNotification = (view) => {
          this.translatorButton.classList.remove(UI_NOTIFICATION_CLASS);
    };

    if (!this.isOpen && view !== null) {
      // Only hide the notifications when the translator is currently open,
      // or when it is being reset (i.e. `view === null`).
      return;
    }
    this.toggleButton.classList.remove(UI_NOTIFICATION_CLASS);

    if (view !== null) {
      removeNotification(view);
      return;
    }
    for (view in TranslatorView) { // Remove all translator notifications on reset.
      removeNotification(TranslatorView[view]);
    }

    this.l10n.get('toggle_translator.title', null, 'Toggle Translator').
        then((msg) => {
      this.toggleButton.title = msg;
    });
  }

  /**
   * @private
   */
  _addEventListeners() {
    this.viewerContainer.addEventListener('transitionend', (evt) => {
      if (evt.target === this.viewerContainer) {
        this.translatorContainer.classList.remove('sidebarMoving');
      }
    });

    /* // Update the thumbnailViewer, if visible, when exiting presentation mode.
    this.eventBus.on('presentationmodechanged', (evt) => {
      if (!evt.active && !evt.switchInProgress && this.isTranslatorViewVisible) {
        this._updateTranslatorViewer();
      }
    });*/
  }
}

export {
  TranslatorView,
  PDFTranslator,
};
