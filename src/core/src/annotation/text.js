import assign from 'deep-assign';
import appendChild from '../render/appendChild';
import { getSVGLayer } from '../UI/utils';
import { addInputField } from '../UI/text';
import { enableViewMode, disableViewMode } from '../UI/view';
import AbstractAnnotation from './abstract';
import {
    scaleUp,
    scaleDown,
    getMetadata,
    disableUserSelect,
    enableUserSelect
} from '../UI/utils';

let globalEvent;

/**
 * Text Annotation.
 */
export default class TextAnnotation extends AbstractAnnotation {

    /**
     * Constructor.
     */
    constructor(readOnly, parent) {
        super();

        globalEvent = window.globalEvent;

        this.type     = 'textbox';
        this.parent   = parent;
        this.x        = 0;
        this.y        = 0;
        this.readOnly = readOnly;
        this.$element = this.createDummyElement();

        // Updated by parent via AbstractAnnotation#setTextForceDisplay.
        this.textForceDisplay = false;
    }


    /**
     * Render a text.
     */
     render() {

        // TODO 引数で text と position を渡せば、循環参照を無くせる.

        let result = false;

        if (this.parent.text) {
            assign(this, this.parent.getTextPosition());
            this.text = this.parent.text;
            this.color = this.parent.color;
            this.parentId = this.parent.uuid;
            result = super.render();
            if (this.textForceDisplay) {
                this.$element.addClass('--visible');
            }
        } else {
            this.$element.remove();
        }

        console.log('render:text:', result);
    }

    /**
     * Set a hover event.
     */
    setHoverEvent() {
        this.$element.find('text').hover(
            this.handleHoverInEvent,
            this.handleHoverOutEvent
        );
    }

    /**
     * Delete a text annotation.
     */
    destroy() {
        super.destroy();
    }

    isHit(x, y) {

        if (!this.parent.text || this.deleted) {
            return false;
        }

        let $rect = this.$element.find('rect');
        let x1 = parseInt($rect.attr('x'));
        let y1 = parseInt($rect.attr('y'));
        let x2 = x1 + parseInt($rect.attr('width'));
        let y2 = y1 + parseInt($rect.attr('height'));

        return (x1 <= x && x <= x2) && (y1 <= y && y <= y2);
    }

    /**
     * Delete a text annotation if selected.
     */
    deleteSelectedAnnotation() {
        super.deleteSelectedAnnotation();
    }

    /**
     * Handle a hoverin event.
     */
    handleHoverInEvent() {
        this.highlight();
        this.emit('hoverin');
    }

    /**
     * Handle a hoverout event.
     */
    handleHoverOutEvent() {
        this.dehighlight();
        this.emit('hoverout');
    }

    /**
     * Handle a click event.
     */
    handleClickEvent() {

        let next = !this.$element.hasClass('--selected');

        if (next) {
            super.select();
            this.emit('selected');

        } else {
            super.deselect();
            this.emit('deselected');
        }

        // Check double click.
        let currentTime = (new Date()).getTime();
        if (this.prevClickTime && (currentTime - this.prevClickTime) < 400) {
            this.handleDoubleClickEvent();
        }
        this.prevClickTime = currentTime;
    }

    /**
     * Handle a click event.
     */
    handleDoubleClickEvent() {
        console.log('handleDoubleClickEvent');

        // this.destroy();
        this.$element.remove();

        let svg = getSVGLayer();
        let pos = scaleUp(svg, {
            x : this.x,
            y : this.y
        });
        let rect = svg.getBoundingClientRect();
        pos.x += rect.left;
        pos.y += rect.top;

        addInputField(pos.x, pos.y, this.uuid, this.text, (text) => {

            console.log('callback:', text);

            if (text || text === '') {
                this.text = text;
                this.emit('textchanged', text);
            }

            this.render();

            if (!this.readOnly) {
                this.$element.find('text').off('click').on('click', this.handleClickEvent);
            }

        });

    }

    // handleRectMoveEnd(rectAnnotation) {
    //     if (rectAnnotation === this.parent) {
    //         this.enableViewMode();
    //     }
    // }

    enableViewMode() {
        console.log('text:enableViewMode');

        super.enableViewMode();
        if (!this.readOnly) {
            this.$element.find('text').off('click').on('click', this.handleClickEvent);
        }
    }

    disableViewMode() {

        super.disableViewMode();
        this.$element.find('text').off('click', this.handleClickEvent);
    }

}
