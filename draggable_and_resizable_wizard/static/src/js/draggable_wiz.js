/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Dialog } from "@web/core/dialog/dialog";
import { onMounted, onWillDestroy } from "@ owl";

const VIEWPORT_RATIO = 0.96;
const MAXIMIZE_RATIO = 0.9;
const ANIMATION_MS = 200;
const RESIZE_DEBOUNCE_MS = 100;

function viewportSize() {
    return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Keep the dialog fully inside the viewport by clamping its position
 * (instead of jumping back to the center).
 */
function clampToViewport($dlg) {
    const { width: vw, height: vh } = viewportSize();
    const rect = $dlg[0].getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    if (left < 0) {
        left = 0;
    }
    if (top < 0) {
        top = 0;
    }
    if (left + rect.width > vw) {
        left = Math.max(0, vw - rect.width);
    }
    if (top + rect.height > vh) {
        top = Math.max(0, vh - rect.height);
    }
    if (left !== rect.left || top !== rect.top) {
        $dlg.css({ left, top });
    }
}

function cleanupModal($dlg) {
    const cleanup = $dlg.data('drw-cleanup');
    if (cleanup) {
        cleanup();
        $dlg.removeData('drw-cleanup');
    }
}

/**
 * Make a `.modal-dialog` element draggable (by its header). Resizing is
 * handled natively by the CSS `resize: both` grip on `.modal-content`.
 * A cleanup function is stored in the element's data so all listeners
 * are removed when the dialog closes.
 */
function makeModalDraggableResizable($dlg) {
    if ($dlg.data('drw-initialized')) {
        return;
    }
    $dlg.data('drw-initialized', true);

    $dlg.css({ position: 'fixed', margin: 0, transform: 'none' });

    $dlg.draggable({
        handle: '.modal-header',
        scroll: false,
        stop: function () {
            clampToViewport($(this));
        },
    });

    let resizeTimer;
    const onWindowResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            clampToViewport($dlg);
        }, RESIZE_DEBOUNCE_MS);
    };
    $(window).on('resize.drag_resize', onWindowResize);

    // Double-click on the header to maximize/restore the dialog.
    $dlg.find('.modal-header').on('dblclick.drag_resize', function (ev) {
        ev.preventDefault();
        if ($dlg.data('drw-maximized')) {
            const { left, top, width, height } = $dlg.data('drw-orig-size');
            $dlg.animate(
                { left, top, width, height },
                ANIMATION_MS,
                () => $dlg.data('drw-maximized', false)
            );
        } else {
            $dlg.data('drw-orig-size', {
                left: $dlg.offset().left,
                top: $dlg.offset().top,
                width: $dlg.outerWidth(),
                height: $dlg.outerHeight(),
            });
            const { width: vw, height: vh } = viewportSize();
            const width = vw * MAXIMIZE_RATIO;
            const height = vh * MAXIMIZE_RATIO;
            $dlg.animate(
                {
                    left: (vw - width) / 2,
                    top: (vh - height) / 2,
                    width,
                    height,
                },
                ANIMATION_MS,
                () => $dlg.data('drw-maximized', true)
            );
        }
    });

    requestAnimationFrame(() => {
        const { width: vw, height: vh } = viewportSize();
        $dlg.css({
            left: (vw - $dlg.outerWidth()) / 2,
            top: (vh - $dlg.outerHeight()) / 2,
        });
    });

    $dlg.data('drw-cleanup', () => {
        clearTimeout(resizeTimer);
        $(window).off('resize.drag_resize', onWindowResize);
        $dlg.find('.modal-header').off('dblclick.drag_resize');
        if ($dlg.hasClass('ui-draggable')) {
            $dlg.draggable('destroy');
        }
        $dlg.removeData('drw-initialized');
    });
}

// OWL dialogs (all standard Odoo wizards).
patch(Dialog.prototype, 'draggable_and_resizable_wizard', {
    setup() {
        this._super(...arguments);
        onMounted(() => {
            const modal = this.el.querySelector('.modal-dialog');
            if (modal) {
                makeModalDraggableResizable($(modal));
            }
        });
        onWillDestroy(() => {
            const modal = this.el.querySelector('.modal-dialog');
            if (modal) {
                cleanupModal($(modal));
            }
        });
    },
});

// Legacy/Bootstrap modals not rendered through the OWL Dialog component.
$(document).on('shown.bs.modal', function (e) {
    const $modalDialog = $(e.target).find('.modal-dialog');
    if ($modalDialog.length) {
        makeModalDraggableResizable($modalDialog);
    }
});

$(document).on('hidden.bs.modal', function (e) {
    const $modalDialog = $(e.target).find('.modal-dialog');
    if ($modalDialog.length) {
        cleanupModal($modalDialog);
    }
});
