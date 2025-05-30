/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { Dialog } from "@web/core/dialog/dialog";
const { onMounted } = owl.hooks;

function makeModalDraggableResizable($dlg) {
    $dlg.css({
        position: 'fixed',
        margin: 0,
        transform: 'none',
    });

    const centerDialog = () => {
        const vw = $(window).width();
        const vh = $(window).height();
        const width = $dlg.outerWidth();
        const height = $dlg.outerHeight();
        $dlg.css({
            left: (vw - width) / 2,
            top: (vh - height) / 2,
        });
    };

    const EDGE_PAD = 200;
    $dlg.draggable({
        handle: '.modal-header',
        scroll: false,
        stop: function () {
            const rect = this.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            if (
                rect.left < EDGE_PAD ||
                rect.right > vw - EDGE_PAD ||
                rect.top < EDGE_PAD ||
                rect.bottom > vh - EDGE_PAD
            ) {
                const newLeft = (vw - rect.width) / 2;
                const newTop = (vh - rect.height) / 2;
                $(this).animate({ left: newLeft, top: newTop }, 200);
            }
        },
    }).resizable({
        handles: 'n, e, s, w, ne, se, sw, nw',
        alsoResize: $dlg.find('.modal-content'),
        minWidth: 400,
        minHeight: 200,
        maxWidth: $(window).width() * 0.96,
        maxHeight: $(window).height() * 0.96,
    });

    let lastDims = { w: 0, h: 0 };
    $(window).on('resize.drag_resize', function () {
        const nw = $(window).width() * 0.96;
        const nh = $(window).height() * 0.96;
        if (lastDims.w !== nw || lastDims.h !== nh) {
            lastDims = { w: nw, h: nh };
            $dlg.resizable('option', {
                maxWidth: nw,
                maxHeight: nh,
            });
        }
    });

    requestAnimationFrame(centerDialog);
}

patch(Dialog.prototype, 'dragable_and_resizable_wizard', {
    setup() {
        this._super(...arguments);
        onMounted(() => {
            const modal = this.el.querySelector('.modal-dialog');
            if (modal) {
                makeModalDraggableResizable($(modal));
            }
        });
    },
});

$(document).on('shown.bs.modal', function (e) {
    const $modalDialog = $(e.target).find('.modal-dialog');
    if ($modalDialog.length && !$modalDialog.hasClass('ui-draggable')) {
        makeModalDraggableResizable($modalDialog);
    }
});