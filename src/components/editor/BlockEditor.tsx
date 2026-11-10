"use client";
import { cn } from "@/src/lib/cn";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  type PartialBlock,
} from "@blocknote/core";
import { pt } from "@blocknote/core/locales";
import {
  useCreateBlockNote,
  BlockNoteViewRaw,
  FormattingToolbarController,
  SideMenuController,
  SuggestionMenuController,
  TableHandlesController,
  EmojiPickerController,
} from "@blocknote/react";
import {
  EditorFormattingToolbar,
  EditorSideMenu,
  EditorSuggestionMenu,
  EditorTableHandle,
  EditorExtendTable,
  EditorTableCellHandle,
} from "./EditorControls";
import { useTheme } from "next-themes";
import type { DocumentBlock, RichDocument } from "@/data/types";
const {
  paragraph,
  heading,
  bulletListItem,
  numberedListItem,
  checkListItem,
  quote,
  divider,
  codeBlock,
  table,
  toggleListItem,
} = defaultBlockSpecs;
const schema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph,
    heading,
    bulletListItem,
    numberedListItem,
    checkListItem,
    quote,
    divider,
    codeBlock,
    table,
    toggleListItem,
  },
});
export default function BlockEditor({
  initialContent,
  onChange,
  readOnly = false,
  label = "Editor de texto",
}: {
  initialContent: RichDocument;
  onChange?: (doc: RichDocument) => void;
  readOnly?: boolean;
  label?: string;
}) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
    dictionary: pt,
    initialContent: initialContent.blocks as unknown as PartialBlock<
      typeof schema.blockSchema,
      typeof schema.inlineContentSchema,
      typeof schema.styleSchema
    >[],
    domAttributes: { editor: { "aria-label": label, "data-testid": label } },
  });
  return (
    <BlockNoteViewRaw
      editor={editor}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      editable={!readOnly}
      formattingToolbar={false}
      sideMenu={false}
      slashMenu={false}
      linkToolbar={false}
      className={cn(
        "min-w-0 [&_.bn-editor]:bg-transparent [&_.bn-editor]:font-sans [&_.bn-editor]:text-base [&_.bn-editor]:leading-relaxed [&_.bn-block-content]:text-foreground [&_.bn-editor_h1]:font-heading [&_.bn-editor_h2]:font-heading [&_.bn-editor_h3]:font-heading",
        readOnly
          ? "[&_.bn-editor]:min-h-0 [&_.bn-editor]:p-0"
          : "[&_.bn-editor]:min-h-[12rem] [&_.bn-editor]:px-5",
      )}
      onChange={() => {
        if (!readOnly)
          onChange?.({
            version: 1,
            blocks: editor.document as unknown as DocumentBlock[],
          });
      }}
    >
      {!readOnly && (
        <>
          <FormattingToolbarController
            formattingToolbar={EditorFormattingToolbar}
          />
          <EmojiPickerController triggerCharacter=":" />
          <SideMenuController sideMenu={EditorSideMenu} />
          <SuggestionMenuController
            triggerCharacter="/"
            suggestionMenuComponent={EditorSuggestionMenu}
          />
          <TableHandlesController
            tableHandle={EditorTableHandle}
            extendButton={EditorExtendTable}
            tableCellHandle={EditorTableCellHandle}
          />
        </>
      )}
    </BlockNoteViewRaw>
  );
}
