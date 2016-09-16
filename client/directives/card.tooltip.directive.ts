import { Directive, ElementRef, Input, Renderer, HostListener } from "@angular/core";
import * as contracts from "../../interfaces/index";

@Directive({ selector: "[cardTooltip]" })
export class CardToolTipDirective {
    tooltipEl: HTMLDivElement;
    timeoutId = 0;
    height = 300 + 20;
    width = 217;
    offset = 10;
    lastMouseEvent: MouseEvent;
    constructor(private el: ElementRef, private renderer: Renderer) { }

    @Input("cardTooltip") card: contracts.Card;

    @HostListener("mouseenter", ["$event"]) onMouseEnter($event: MouseEvent) {
        this.lastMouseEvent = $event;
        //preload image
        this.createTooltip();
        this.timeoutId = setTimeout(() => this.mountTooltip(), 200) as any;
    }

    @HostListener("mousemove", ["$event"]) onMouseMove($event: MouseEvent) {
        this.lastMouseEvent = $event;
        this.updateTooltipPosition();
    }

    @HostListener("mouseleave") onMouseLeave() {

        this.destroyTooltip();
    }

    private mountTooltip() {
        window.document.body.appendChild(this.tooltipEl);
        this.updateTooltipPosition();
    }

    private createTooltip() {
        // let imgEl = document.createElement("img");
        // imgEl.className = "card-image";
        // imgEl.setAttribute("src", this.card.img);
        // let setEl = document.createElement("div");
        // setEl.innerText = this.card.setName;
        this.tooltipEl = document.createElement("div");
        this.tooltipEl.className = "card-tooltip";

        this.tooltipEl.innerHTML = `
            <img class="card-image" src="${this.card.img}" />
            <div class="avail">${this.card.numberAvailable}</div>
            <div>
                <span class="set-name">${this.card.setName}</span>
            </div>
        `;
        // this.tooltipEl.appendChild(imgEl);
        // this.tooltipEl.appendChild(setEl);
    }

    private updateTooltipPosition() {
        if (!this.tooltipEl) {
            return;
        }
        let lowerBoundOk = window.innerHeight - this.lastMouseEvent.clientY > this.height / 2,
            upperBoundOk = this.lastMouseEvent.clientY > this.height / 2,
            rightBoundOk = window.innerWidth - this.lastMouseEvent.clientX >= this.offset + this.width;

        if (rightBoundOk) {
            this.tooltipEl.style.left = `${this.offset + this.lastMouseEvent.pageX}px`; // - []
        }
        else {
            this.tooltipEl.style.left = `${this.lastMouseEvent.pageX - this.offset - this.width}px`; // [] -
        }

        if (lowerBoundOk && upperBoundOk) {
            this.tooltipEl.style.top = `${this.lastMouseEvent.pageY - this.height / 2}px`; // - []
        }
        else if (!upperBoundOk) {
            this.tooltipEl.style.top = `${window.pageYOffset + this.offset}px`; // ``[] 
        }
        else if (!lowerBoundOk) {
            this.tooltipEl.style.top = `${window.pageYOffset + window.innerHeight - (this.height + this.offset)}px`; // .. [] 
        }
    }

    private destroyTooltip() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = 0;
        }

        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }
    }
}