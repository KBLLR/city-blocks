declare module "@/react-app/lib/uil/uil.module.js" {
  export type UILValue = number | string | boolean | [number, number] | Array<number>;

  export interface GuiOptions {
    w?: number;
    maxHeight?: number;
    parent?: HTMLElement | null;
    isCanvas?: boolean;
    close?: boolean;
    transparent?: boolean;
  }

  export class Gui {
    constructor(options?: GuiOptions);
    add(target: Record<string, unknown>, key: string, opts?: Record<string, unknown>): Gui;
    onChange(handler: (value: UILValue, data?: unknown) => void): Gui;
    onDraw?: () => void;
    setMouse?(uv: { x: number; y: number } | [number, number]): void;
    reset?(force?: boolean): void;
  }

  export const Tools: {
    icon(name: string, color: string, size?: number): string;
  };

  export const Files: Record<string, unknown>;
  export function add(...args: unknown[]): void;
  export const REVISION: string;
}
