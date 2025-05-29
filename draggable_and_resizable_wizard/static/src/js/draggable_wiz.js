/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { Dialog } from "@web/core/dialog/dialog";
const { onMounted } = owl.hooks;

patch(Dialog.prototype, 'dragable_and_resizable_wizard', {
    setup() {
        this._super(...arguments);
        onMounted(this._applyDraggableResizable.bind(this));
    },

    _applyDraggableResizable() {
        const modal = this.el.querySelector('.modal-dialog');
        if (!modal) {
            return;
        }

        const $dlg = $(modal);

        $dlg.css({
            position: 'fixed',
            margin: 0,
            transform: 'none'
        });

        const centerDialog = () => {
            const { innerWidth: vw, innerHeight: vh } = window;
            const { width, height } = modal.getBoundingClientRect();
            $dlg.css({
                left: (vw - width)  / 2,
                top:  (vh - height) / 2,
            });
        };

        centerDialog();

        const EDGE_PAD   = 200;
        $dlg.draggable({
            handle: '.modal-header',
            scroll: false,
            stop: (_evt, ui) => {
                const rect = modal.getBoundingClientRect();
                const vw   = window.innerWidth;
                const vh   = window.innerHeight;

                const nearLeft   = rect.left   < EDGE_PAD;
                const nearRight  = rect.right  > vw - EDGE_PAD;
                const nearTop    = rect.top    < EDGE_PAD;
                const nearBottom = rect.bottom > vh - EDGE_PAD;

                if (nearLeft || nearRight || nearTop || nearBottom) {
                    const newLeft = (vw - rect.width)  / 2;
                    const newTop  = (vh - rect.height) / 2;
                    $(modal).animate({ left: newLeft, top: newTop }, 200);
                }
            },
        })
        .resizable({
            handles: 'n, e, s, w, ne, se, sw, nw',
            alsoResize: $dlg.find('.modal-content'),
            minWidth: 400,
            minHeight: 200,
            maxWidth: $(window).width() * 0.96,
            maxHeight: $(window).height() * 0.96,
        });

        $(window).on('resize', () => {
            $dlg.resizable('option', {
                maxWidth: $(window).width() * 0.96,
                maxHeight: $(window).height() * 0.96,
            });

            if (!$dlg.data('wasDragged')) {
                centerDialog();
            }
        });
    },
});
