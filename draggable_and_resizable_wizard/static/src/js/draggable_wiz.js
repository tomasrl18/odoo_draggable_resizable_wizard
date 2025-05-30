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

    $dlg.draggable({
        handle: '.modal-header',
        scroll: false,
        stop: function () {
            const { left, top, width, height } = this.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const overflow =
                left < 0 || top < 0 ||
                left + width > vw || top + height > vh;

            if (overflow) {
                const newLeft = (vw - width) / 2;
                const newTop = (vh - height) / 2;
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

    const MAX_RATIO = 0.9;

    $dlg.find('.modal-header').on('dblclick', function () {
        const $m = $dlg;
        if ($m.data('isMax')) {
            const {l, t, w, h} = $m.data('origSize');
            $m.animate({ left: l, top: t, width: w, height: h }, 200, () => {
                $m.data('isMax', false);
            });
        } else {
            $m.data('origSize', {
                l: $m.position().left,
                t: $m.position().top,
                w: $m.outerWidth(),
                h: $m.outerHeight(),
            });
            const vw = $(window).width()  * MAX_RATIO;
            const vh = $(window).height() * MAX_RATIO;
            $m.animate({
                left: ($(window).width()  - vw) / 2,
                top:  ($(window).height() - vh) / 2,
                width:  vw,
                height: vh,
            }, 200, () => {
                $m.data('isMax', true);
            });
        }
    });
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