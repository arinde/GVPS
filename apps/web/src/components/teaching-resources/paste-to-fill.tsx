"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { Textarea } from "@/components/common/textarea";

export type PasteToFillProps = {
  hint: string;
  example: string;
  onParse: (text: string) => void;
};

/**
 * Lets a teacher paste an already-typed scheme/lecture/question bank once,
 * instead of re-entering it field by field. Pattern-matching only (no AI
 * budget yet, per the owner) — the parsed result lands in the normal editable
 * fields below, so a rough parse is a starting point, never a dead end.
 */
export function PasteToFill({ hint, example, onParse }: PasteToFillProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <div>
        <AppButton type="button" variant="secondary" size="small" onClick={() => setOpen(true)}>
          <ClipboardPaste aria-hidden="true" />
          Paste to fill
        </AppButton>
      </div>
    );
  }

  return (
    <ContentCard className="flex flex-col gap-3">
      <div>
        <h2 className="text-base">Paste to fill</h2>
        <p className="text-muted-foreground text-sm">{hint}</p>
        <p className="text-muted-foreground mt-1 text-xs whitespace-pre-wrap">
          Example:{"\n"}
          {example}
        </p>
      </div>
      <Textarea
        aria-label="Paste your content here"
        rows={8}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste the whole thing here…"
      />
      <div className="flex gap-2">
        <AppButton
          type="button"
          onClick={() => {
            onParse(text);
            setOpen(false);
            setText("");
          }}
          disabled={!text.trim()}
        >
          Parse into the form below
        </AppButton>
        <AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </AppButton>
      </div>
    </ContentCard>
  );
}
