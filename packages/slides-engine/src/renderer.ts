import type { Slide, SlideElement, TextElement, ImageElement, ShapeElement } from './model';

export function renderSlide(ctx: CanvasRenderingContext2D, slide: Slide, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = slide.background;
  ctx.fillRect(0, 0, width, height);

  for (const el of slide.elements) {
    renderElement(ctx, el);
  }
}

function renderElement(ctx: CanvasRenderingContext2D, el: SlideElement): void {
  ctx.save();
  const { x, y, width, height, rotation } = el.transform;
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  switch (el.type) {
    case 'text':
      renderText(ctx, el, width, height);
      break;
    case 'image':
      renderImage(ctx, el as ImageElement, width, height);
      break;
    case 'shape':
      renderShape(ctx, el, width, height);
      break;
  }
  ctx.restore();
}

function renderText(ctx: CanvasRenderingContext2D, el: TextElement, width: number, height: number): void {
  ctx.fillStyle = el.color;
  ctx.font = `${el.fontWeight} ${el.fontSize}px ${ctx.font.split(' ').pop() ?? 'sans-serif'}`;
  ctx.textAlign = el.align;
  const x = el.align === 'center' ? width / 2 : el.align === 'right' ? width : 0;
  ctx.fillText(el.content, x, el.fontSize, width);
}

function renderImage(ctx: CanvasRenderingContext2D, el: ImageElement, width: number, height: number): void {
  // Placeholder: draw a gray rectangle with "image" label
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#9ca3af';
  ctx.strokeRect(0, 0, width, height);
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(el.alt || 'Image', width / 2, height / 2);
}

function renderShape(ctx: CanvasRenderingContext2D, el: ShapeElement, width: number, height: number): void {
  ctx.fillStyle = el.fill;
  ctx.strokeStyle = el.stroke;
  ctx.lineWidth = el.strokeWidth;

  switch (el.shape) {
    case 'rect':
      ctx.fillRect(0, 0, width, height);
      ctx.strokeRect(0, 0, width, height);
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width - 20, height / 2);
      ctx.lineTo(width - 20, 0);
      ctx.lineTo(width, height / 2);
      ctx.lineTo(width - 20, height);
      ctx.lineTo(width - 20, height / 2);
      ctx.fill();
      ctx.stroke();
      break;
  }
}

export function hitTest(slide: Slide, px: number, py: number): string | null {
  for (let i = slide.elements.length - 1; i >= 0; i--) {
    const el = slide.elements[i];
    const { x, y, width, height } = el.transform;
    if (px >= x && px <= x + width && py >= y && py <= y + height) {
      return el.id;
    }
  }
  return null;
}
