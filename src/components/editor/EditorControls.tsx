"use client";
import {
  getColspan,
  getRowspan,
  isTableCell,
  mapTableCell,
  type DefaultBlockSchema,
  type DefaultInlineContentSchema,
  type DefaultStyleSchema,
  type PartialBlock,
} from "@blocknote/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  SideMenuExtension,
  SuggestionMenu as SuggestionMenuExtension,
  TableHandlesExtension,
} from "@blocknote/core/extensions";
import {
  useBlockNoteEditor,
  useEditorState,
  useExtension,
  useExtensionState,
  type DefaultReactSuggestionItem,
  type SuggestionMenuProps,
  type TableHandleProps,
  type ExtendButtonProps,
  type TableCellButtonProps,
} from "@blocknote/react";
import {
  HiPlus,
  HiTrash,
  HiBars2,
  HiLink,
  HiCodeBracket,
  HiArrowUturnLeft,
  HiArrowUturnRight,
} from "react-icons/hi2";
import { cn } from "@/src/lib/cn";
const toolButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm text-muted hover:bg-surface-hover hover:text-foreground aria-pressed:bg-primary-soft aria-pressed:text-primary-ink";
const menuItem =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-none data-[highlighted]:bg-surface-hover";
const menuContent =
  "z-[90] min-w-[20rem] rounded-lg border border-border bg-surface p-1 shadow-lg outline-none";
function Tool({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={toolButton}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function EditorFormattingToolbar() {
  const editor = useBlockNoteEditor<
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >();
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      styles: editor.getActiveStyles(),
      block: editor.getTextCursorPosition().block,
    }),
  });
  const tables = useExtension(TableHandlesExtension);
  const [showLink, setShowLink] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const toggle = (
    name: "bold" | "italic" | "underline" | "strike" | "code",
  ) => {
    editor.focus();
    editor.toggleStyles({ [name]: true });
  };
  const changeBlock = (type: string) => {
    editor.focus();
    const block = editor.getTextCursorPosition().block;
    if (type === "heading-1")
      editor.updateBlock(block, { type: "heading", props: { level: 1 } });
    else if (type === "heading-2")
      editor.updateBlock(block, { type: "heading", props: { level: 2 } });
    else if (type === "heading-3")
      editor.updateBlock(block, { type: "heading", props: { level: 3 } });
    else if (type === "paragraph")
      editor.updateBlock(block, { type: "paragraph" });
    else if (type === "bulletListItem")
      editor.updateBlock(block, { type: "bulletListItem" });
    else if (type === "numberedListItem")
      editor.updateBlock(block, { type: "numberedListItem" });
    else if (type === "checkListItem")
      editor.updateBlock(block, { type: "checkListItem" });
    else if (type === "quote") editor.updateBlock(block, { type: "quote" });
    else if (type === "codeBlock")
      editor.updateBlock(block, { type: "codeBlock" });
  };
  const blockType =
    state.block.type === "heading"
      ? "heading-" + state.block.props.level
      : state.block.type;
  return (
    <div className="bn-formatting-toolbar max-w-[min(56rem,calc(100vw-2.4rem))] rounded-lg border border-border bg-surface p-1 shadow-lg">
      <div
        role="toolbar"
        aria-label="Formatar texto"
        className="flex flex-wrap items-center gap-1"
      >
        <select
          aria-label="Tipo de bloco"
          className="h-8 max-w-[15rem] rounded-md border-0 bg-surface px-2 text-sm"
          value={blockType}
          onChange={(event) => changeBlock(event.target.value)}
        >
          <option value="paragraph">Texto</option>
          <option value="heading-1">Título 1</option>
          <option value="heading-2">Título 2</option>
          <option value="heading-3">Título 3</option>
          <option value="bulletListItem">Lista</option>
          <option value="numberedListItem">Lista numerada</option>
          <option value="checkListItem">Checklist</option>
          <option value="quote">Citação</option>
          <option value="codeBlock">Código</option>
        </select>
        <Tool
          label="Negrito"
          active={!!state.styles.bold}
          onClick={() => toggle("bold")}
        >
          <strong>B</strong>
        </Tool>
        <Tool
          label="Itálico"
          active={!!state.styles.italic}
          onClick={() => toggle("italic")}
        >
          <em>I</em>
        </Tool>
        <Tool
          label="Sublinhado"
          active={!!state.styles.underline}
          onClick={() => toggle("underline")}
        >
          <span className="underline">U</span>
        </Tool>
        <Tool
          label="Tachado"
          active={!!state.styles.strike}
          onClick={() => toggle("strike")}
        >
          <span className="line-through">S</span>
        </Tool>
        <Tool
          label="Código no texto"
          active={!!state.styles.code}
          onClick={() => toggle("code")}
        >
          <HiCodeBracket className="size-4" />
        </Tool>
        <Tool
          label="Adicionar link"
          active={showLink}
          onClick={() => {
            setShowLink((value) => !value);
            setUrl(editor.getSelectedLinkUrl() ?? "");
            setLinkError("");
          }}
        >
          <HiLink className="size-4" />
        </Tool>
        <label className={toolButton} title="Cor do texto">
          <span className="sr-only">Cor do texto</span>
          <input
            aria-label="Cor do texto"
            type="color"
            className="size-5 cursor-pointer border-0 bg-transparent p-0"
            value={
              typeof state.styles.textColor === "string" &&
              /^#[a-f0-9]{6}$/i.test(state.styles.textColor)
                ? state.styles.textColor
                : "#20212c"
            }
            onChange={(event) => {
              editor.focus();
              editor.addStyles({ textColor: event.target.value });
            }}
          />
        </label>
        <label className={toolButton} title="Cor de fundo">
          <span className="sr-only">Cor de fundo</span>
          <input
            type="color"
            aria-label="Cor de fundo"
            className="size-5 cursor-pointer border-0 bg-transparent p-0"
            value={
              typeof state.styles.backgroundColor === "string" &&
              /^#[a-f0-9]{6}$/i.test(state.styles.backgroundColor)
                ? state.styles.backgroundColor
                : "#ffffff"
            }
            onChange={(event) => {
              editor.focus();
              editor.addStyles({ backgroundColor: event.target.value });
            }}
          />
        </label>
        <select
          aria-label="Alinhamento"
          className="h-8 max-w-[12rem] rounded-md border-0 bg-surface px-2 text-sm"
          value={
            "textAlignment" in state.block.props
              ? state.block.props.textAlignment
              : "left"
          }
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "left" ||
              value === "center" ||
              value === "right" ||
              value === "justify"
            ) {
              editor.focus();
              editor.updateBlock(state.block, {
                props: { textAlignment: value },
              });
            }
          }}
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
          <option value="justify">Justificado</option>
        </select>
        <Tool
          label="Recuar bloco"
          onClick={() => {
            editor.focus();
            if (editor.canNestBlock()) editor.nestBlock();
          }}
        >
          <span className="text-xs">→</span>
        </Tool>
        <Tool
          label="Diminuir recuo"
          onClick={() => {
            editor.focus();
            if (editor.canUnnestBlock()) editor.unnestBlock();
          }}
        >
          <span className="text-xs">←</span>
        </Tool>
        {state.block.type === "table" && (
          <Tool label="Mesclar células" onClick={() => tables.mergeCells()}>
            <span className="text-xs">Mesclar</span>
          </Tool>
        )}
        <Tool
          label="Refazer"
          onClick={() => {
            editor.focus();
            editor.redo();
          }}
        >
          <HiArrowUturnRight className="size-4" />
        </Tool>
        <Tool
          label="Desfazer"
          onClick={() => {
            editor.focus();
            editor.undo();
          }}
        >
          <HiArrowUturnLeft className="size-4" />
        </Tool>
      </div>
      {showLink && (
        <form
          className="mt-1 flex flex-wrap gap-2 border-t border-border p-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) ||
              url.startsWith("//")
            ) {
              setLinkError("Informe um link válido.");
              return;
            }
            editor.focus();
            editor.createLink(url);
            setShowLink(false);
            setUrl("");
          }}
        >
          <input
            aria-label="Endereço do link"
            className="min-w-[16rem] flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm"
            type="text"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1 text-sm text-white"
          >
            Aplicar
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-1 text-sm text-danger hover:bg-danger-soft"
            onClick={() => {
              editor.focus();
              editor.deleteLink();
              setShowLink(false);
            }}
          >
            Remover link
          </button>
          {linkError && (
            <span role="alert" className="w-full text-xs text-danger">
              {linkError}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
export function EditorSuggestionMenu({
  items,
  selectedIndex,
  onItemClick,
  loadingState,
}: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    container.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);
  return (
    <div
      ref={container}
      id="bn-suggestion-menu"
      role="listbox"
      aria-label="Inserir bloco"
      className="max-h-[32rem] w-[min(34rem,calc(100vw-3.2rem))] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
    >
      {loadingState !== "loaded" && !items.length ? (
        <p className="p-3 text-sm text-muted">Carregando…</p>
      ) : (
        items.map((item, index) => (
          <button
            id={"bn-suggestion-menu-item-" + index}
            role="option"
            aria-selected={index === selectedIndex}
            type="button"
            key={item.title + index}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onItemClick?.(item)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover",
              index === selectedIndex && "bg-primary-soft text-primary-ink",
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface [&_svg]:size-4">
              {item.icon}
            </span>
            <span className="min-w-0">
              <strong className="block font-medium">{item.title}</strong>
              <small className="block truncate text-xs text-muted">
                {item.subtext}
              </small>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
export function EditorSideMenu() {
  const editor = useBlockNoteEditor<
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >();
  const side = useExtension(SideMenuExtension);
  const suggestion = useExtension(SuggestionMenuExtension);
  const block = useExtensionState(SideMenuExtension, {
    selector: (state) => state?.block,
  });
  if (!block) return null;
  const add = () => {
    editor.focus();
    const empty = Array.isArray(block.content) && !block.content.length;
    const destination = empty
      ? block
      : editor.insertBlocks([{ type: "paragraph" }], block, "after")[0];
    editor.setTextCursorPosition(destination);
    suggestion.openSuggestionMenu("/");
  };
  return (
    <div className="bn-side-menu flex items-center gap-[0.1rem]">
      <Tool label="Inserir bloco" onClick={add}>
        <HiPlus className="size-4" />
      </Tool>
      <Dropdown.Root
        onOpenChange={(open) =>
          open ? side.freezeMenu() : side.unfreezeMenu()
        }
      >
        <Dropdown.Trigger asChild>
          <button
            type="button"
            draggable
            aria-label="Mover ou editar bloco"
            className={cn(toolButton, "cursor-grab")}
            onDragStart={(event) => side.blockDragStart(event, block)}
            onDragEnd={() => side.blockDragEnd()}
          >
            <HiBars2 className="size-4" />
          </button>
        </Dropdown.Trigger>
        <Dropdown.Content className={menuContent} sideOffset={0} align="start">
          <Dropdown.Item
            className={menuItem}
            onSelect={() => {
              const source = editor.getBlock(block.id);
              if (!source) return;
              const copy: PartialBlock = structuredClone(source);
              const clearIds = (item: PartialBlock) => {
                delete item.id;
                item.children?.forEach(clearIds);
              };
              clearIds(copy);
              editor.insertBlocks([copy], source, "after");
            }}
          >
            Duplicar bloco
          </Dropdown.Item>
          <Dropdown.Item
            className={cn(menuItem, "text-danger")}
            onSelect={() => editor.removeBlocks([block])}
          >
            <HiTrash className="size-4" />
            Excluir bloco
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
  );
}
export function EditorTableHandle({
  orientation,
  hideOtherElements,
}: TableHandleProps) {
  const editor = useBlockNoteEditor<
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >();
  const extension = useExtension(TableHandlesExtension);
  const state = useExtensionState(TableHandlesExtension);
  const index = orientation === "row" ? state?.rowIndex : state?.colIndex;
  if (!state || index === undefined) return null;
  return (
    <Dropdown.Root
      onOpenChange={(open) => {
        if (open) extension.freezeHandles();
        else extension.unfreezeHandles();
        hideOtherElements(open);
      }}
    >
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label={orientation === "row" ? "Editar linha" : "Editar coluna"}
          draggable
          className={cn(toolButton, "bg-surface shadow-sm")}
          onDragStart={(event) => {
            hideOtherElements(true);
            if (orientation === "row") extension.rowDragStart(event);
            else extension.colDragStart(event);
          }}
          onDragEnd={() => {
            extension.dragEnd();
            hideOtherElements(false);
          }}
        >
          <HiBars2
            className={cn("size-4", orientation === "column" && "rotate-90")}
          />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content className={menuContent} align="start" sideOffset={0}>
        <Dropdown.Item
          className={menuItem}
          onSelect={() =>
            extension.addRowOrColumn(
              index,
              orientation === "row"
                ? { orientation: "row", side: "above" }
                : { orientation: "column", side: "left" },
            )
          }
        >
          Inserir {orientation === "row" ? "linha acima" : "coluna à esquerda"}
        </Dropdown.Item>
        <Dropdown.Item
          className={menuItem}
          onSelect={() =>
            extension.addRowOrColumn(
              index,
              orientation === "row"
                ? { orientation: "row", side: "below" }
                : { orientation: "column", side: "right" },
            )
          }
        >
          Inserir {orientation === "row" ? "linha abaixo" : "coluna à direita"}
        </Dropdown.Item>
        {index === 0 && (
          <Dropdown.Item
            className={menuItem}
            onSelect={() => {
              const source = editor.getBlock(state.block.id);
              if (source?.type !== "table") return;
              const key = orientation === "row" ? "headerRows" : "headerCols";
              editor.updateBlock(source, {
                type: "table",
                content: {
                  ...source.content,
                  [key]: source.content[key] ? undefined : 1,
                },
              });
            }}
          >
            Alternar cabeçalho
          </Dropdown.Item>
        )}
        <Dropdown.Item
          className={cn(menuItem, "text-danger")}
          onSelect={() => extension.removeRowOrColumn(index, orientation)}
        >
          Excluir {orientation === "row" ? "linha" : "coluna"}
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
export function EditorExtendTable({ orientation }: ExtendButtonProps) {
  const extension = useExtension(TableHandlesExtension);
  const block = useExtensionState(TableHandlesExtension, {
    selector: (state) => state?.block,
  });
  if (!block) return null;
  return (
    <button
      type="button"
      aria-label={
        orientation === "addOrRemoveRows"
          ? "Adicionar linha"
          : "Adicionar coluna"
      }
      className="grid min-h-5 min-w-5 place-items-center rounded-md bg-surface-hover p-1 text-muted hover:bg-primary-soft hover:text-primary-ink"
      onClick={() =>
        extension.addRowsOrColumns(
          block,
          orientation === "addOrRemoveRows" ? "rows" : "columns",
          1,
        )
      }
    >
      <HiPlus className="size-3" />
    </button>
  );
}
export function EditorTableCellHandle({
  hideOtherElements,
}: TableCellButtonProps) {
  const editor = useBlockNoteEditor<
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >();
  const extension = useExtension(TableHandlesExtension);
  const state = useExtensionState(TableHandlesExtension);
  if (!state || state.rowIndex === undefined || state.colIndex === undefined)
    return null;
  const { rowIndex, colIndex } = state;
  const block = editor.getBlock(state.block.id);
  if (block?.type !== "table") return null;
  const cell = block.content.rows[rowIndex]?.cells[colIndex];
  const merged =
    cell && isTableCell(cell) && (getColspan(cell) > 1 || getRowspan(cell) > 1);
  const updateColor = (color: string) => {
    const rows = block.content.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => mapTableCell(cell)),
    }));
    rows[rowIndex].cells[colIndex].props.backgroundColor = color;
    editor.updateBlock(block, {
      type: "table",
      content: { ...block.content, rows },
    });
    editor.setTextCursorPosition(block);
  };
  return (
    <Dropdown.Root
      onOpenChange={(open) => {
        if (open) extension.freezeHandles();
        else extension.unfreezeHandles();
        hideOtherElements(open);
      }}
    >
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label="Editar célula"
          className={cn(toolButton, "bg-surface shadow-sm")}
        >
          <HiBars2 className="size-4" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content className={menuContent} sideOffset={0} align="start">
        {merged && (
          <Dropdown.Item
            className={menuItem}
            onSelect={() =>
              extension.splitCell({ row: rowIndex, col: colIndex })
            }
          >
            Separar células
          </Dropdown.Item>
        )}
        <label className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
          Fundo da célula
          <input
            aria-label="Fundo da célula"
            type="color"
            className="size-6 border-0 bg-transparent p-0"
            defaultValue="#ffffff"
            onChange={(event) => updateColor(event.target.value)}
          />
        </label>
        <Dropdown.Item
          className={menuItem}
          onSelect={() => updateColor("default")}
        >
          Restaurar cor
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
