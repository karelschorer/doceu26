export type ElementType = 'text' | 'image' | 'shape' | 'line';
export type ShapeType = 'rect' | 'ellipse' | 'arrow';

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
}

export interface TextElement {
  id: string;
  type: 'text';
  transform: Transform;
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement {
  id: string;
  type: 'image';
  transform: Transform;
  src: string;
  alt: string;
}

export interface ShapeElement {
  id: string;
  type: 'shape';
  transform: Transform;
  shape: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type SlideElement = TextElement | ImageElement | ShapeElement;

export interface Slide {
  id: string;
  background: string;
  elements: SlideElement[];
  notes: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: {
    primaryColor: string;
    fontFamily: string;
    background: string;
  };
}

export function createPresentation(title: string): Presentation {
  return {
    id: crypto.randomUUID(),
    title,
    slides: [createSlide()],
    theme: {
      primaryColor: '#2563eb',
      fontFamily: 'sans-serif',
      background: '#ffffff',
    },
  };
}

export function createSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    background: '#ffffff',
    elements: [],
    notes: '',
  };
}

export function createTextElement(x = 100, y = 100): TextElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    transform: { x, y, width: 300, height: 60, rotation: 0 },
    content: 'Click to edit',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#111111',
    align: 'left',
  };
}

export function createShapeElement(shape: ShapeType = 'rect', x = 100, y = 100): ShapeElement {
  return {
    id: crypto.randomUUID(),
    type: 'shape',
    transform: { x, y, width: 150, height: 100, rotation: 0 },
    shape,
    fill: '#dbeafe',
    stroke: '#2563eb',
    strokeWidth: 2,
  };
}
