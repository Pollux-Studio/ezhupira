// Minimal types for StPageFlip (the package ships its TS source but no declarations).
declare module "page-flip/dist/js/page-flip.module.js" {
  export type PageFlipSettings = {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    startPage?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  };

  export type PageFlipEvent<T = unknown> = { data: T; object: PageFlip };

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings);
    loadFromImages(images: string[]): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    update(): void;
    destroy(): void;
    on(event: "flip", callback: (e: PageFlipEvent<number>) => void): PageFlip;
    on(event: "init", callback: (e: PageFlipEvent<{ page: number }>) => void): PageFlip;
    on(event: string, callback: (e: PageFlipEvent) => void): PageFlip;
  }
}
