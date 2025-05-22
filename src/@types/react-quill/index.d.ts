declare module 'react-quill' {
  import React from 'react';

  // Interface pour l'éditeur Quill
  export interface QuillEditor {
    root: HTMLElement;
    clipboard: {
      convert: (html: string) => Delta;
    };
    getText: (index?: number, length?: number) => string;
    getLength: () => number;
    getContents: (index?: number, length?: number) => Delta;
    getSelection: () => Range | null;
    setSelection: (index: number, length: number, source?: string) => void;
  }

  // Interface pour Delta (format de données Quill)
  export interface Delta {
    ops?: Array<{
      insert?: string | object;
      delete?: number;
      retain?: number;
      attributes?: object;
    }>;
  }

  export interface ReactQuillProps {
    id?: string;
    className?: string;
    theme?: string;
    style?: React.CSSProperties;
    readOnly?: boolean;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    tabIndex?: number;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    onChange?: (content: string) => void;
    onChangeSelection?: (range: Range, source: string, editor: QuillEditor) => void;
    onFocus?: (range: Range, source: string, editor: QuillEditor) => void;
    onBlur?: (previousRange: Range, source: string, editor: QuillEditor) => void;
    onKeyPress?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
    formats?: string[];
    children?: React.ReactElement;
    modules?: Record<string, unknown>;
    preserveWhitespace?: boolean;
  }

  export interface Range {
    index: number;
    length: number;
  }

  declare class ReactQuill extends React.Component<ReactQuillProps> {
    static Quill: typeof QuillEditor;
    getEditor(): QuillEditor;
    focus(): void;
    blur(): void;
  }

  export default ReactQuill;
}