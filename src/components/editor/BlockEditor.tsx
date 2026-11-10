"use client";
import { cn } from "@/src/lib/cn";
import { useRef, useState } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";
import { uploadEditorImage, resolveEditorImage } from "@/src/lib/editor-images";
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
  image,
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
    image,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const editor = useCreateBlockNote({
    schema,
    uploadFile: uploadEditorImage,
    resolveFileUrl: resolveEditorImage,
    dictionary: pt,
    initialContent: initialContent.blocks as unknown as PartialBlock<
      typeof schema.blockSchema,
      typeof schema.inlineContentSchema,
      typeof schema.styleSchema
    >[],
    domAttributes: { editor: { "aria-label": label, "data-testid": label } },
  });
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setImageError("");
    setUploadingImage(true);
    try {
      let anchor = editor.getTextCursorPosition().block;
      for (const file of Array.from(files)) {
        const url = await uploadEditorImage(file);
        anchor = editor.insertBlocks(
          [{ type: "image", props: { url, name: file.name } }],
          anchor,
          "after",
        )[0];
      }
      const paragraph = editor.insertBlocks(
        [{ type: "paragraph" }],
        anchor,
        "after",
      )[0];
      editor.setTextCursorPosition(paragraph);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Falha ao enviar imagem.",
      );
    } finally {
      setUploadingImage(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div className="min-w-0">
      {!readOnly && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Selecionar imagens"
            onChange={(event) => void addImages(event.target.files)}
          />
          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <HiOutlinePhoto className="size-4" />
            {uploadingImage ? "Enviando imagem…" : "Adicionar imagem"}
          </button>
          <span className="text-xs text-subtle">Ou cole uma imagem com Ctrl+V</span>
        </div>
      )}
      {imageError && <p role="alert" className="mb-3 text-xs text-danger">{imageError}</p>}
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
    </div>
  );
}
