'use client';

import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { SlashMenu, type SlashMenuRef } from './slash-menu';
import { type SlashCommandItem, filterSlashItems } from './slash-items';

interface Options {
  items: SlashCommandItem[];
}

/**
 * Tiptap extension that listens for '/' at the start of an empty block
 * and renders the SlashMenu popup via tippy.js. On select, it deletes
 * the typed '/foo' range and runs the item's command.
 */
export const SlashCommands = Extension.create<Options>({
  name: 'slashCommands',

  addOptions() {
    return { items: [] };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        // Only fire when the '/' starts a new word (beginning of block or
        // after whitespace). Prevents random slashes inside text.
        allowSpaces: false,
        startOfLine: false,

        items: ({ query }) => filterSlashItems(this.options.items, query),

        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },

        render: () => {
          let component: ReactRenderer<SlashMenuRef> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: props => {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: () => {
                  const rect = props.clientRect?.();
                  return rect ?? new DOMRect();
                },
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                // Keep within viewport on small screens
                popperOptions: {
                  modifiers: [{ name: 'preventOverflow', options: { padding: 8 } }],
                },
              });
            },

            onUpdate: props => {
              if (!component) return;
              component.updateProps({
                items: props.items,
                command: (item: SlashCommandItem) => props.command(item),
              });
              if (!props.clientRect || !popup?.[0]) return;
              popup[0].setProps({
                getReferenceClientRect: () => {
                  const rect = props.clientRect?.();
                  return rect ?? new DOMRect();
                },
              });
            },

            onKeyDown: props => {
              if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              popup?.[0].destroy();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
