"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Définition d'un type plus précis pour ReactQuill
interface ReactQuillProps {
  value: string;
  onChange: (value: string) => void;
  modules?: Record<string, unknown>;
  formats?: string[];
  theme?: string;
  placeholder?: string;
  className?: string;
  ref?: React.Ref<ReactQuillType>;  // Remplacer 'any' par 'ReactQuillType'
}

type ReactQuillType = React.ComponentType<ReactQuillProps>;

// Types plus précis pour les modules et les options de la barre d'outils
type ToolbarOption = string | { [key: string]: string };
type ToolbarConfig = Array<Array<ToolbarOption>>;

interface QuillModules {
  toolbar?: ToolbarConfig;
  [key: string]: unknown;
}

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  modules?: QuillModules;
  theme?: string;
}

// Composant dynamique avec le displayName
const DynamicQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    const QuillComponent = React.forwardRef<ReactQuillType, QuillEditorProps>((props, ref) => {
      const Component = RQ as React.ComponentType<QuillEditorProps & { ref?: React.Ref<ReactQuillType> }>;
      return <Component {...props} ref={ref} />;
    });
    QuillComponent.displayName = 'DynamicQuillComponent';
    return QuillComponent;
  },
  { 
    ssr: false, 
    loading: () => (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-md p-4">
        Chargement de l&apos;éditeur...
      </div>
    )
  }
);

const QuillEditor = React.forwardRef<ReactQuillType, QuillEditorProps>(({
  value,
  onChange,
  placeholder,
  className,
  modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'bullet' }]
    ]
  }
}, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className={`min-h-[150px] border border-gray-200 dark:border-gray-700 rounded-md p-4 ${className}`}
      >
        {value || placeholder}
      </div>
    );
  }

  return (
    <DynamicQuill
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      modules={modules}
      theme="snow"
    />
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;