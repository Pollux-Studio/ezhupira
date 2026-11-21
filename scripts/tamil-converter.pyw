"""Tamil -> legacy font converter (internal tool).

Type normal Unicode Tamil on the left; the right shows it in the chosen legacy font
(Mallikai or JF Devadas) and "Copy" puts the font's key code on the clipboard, ready to
paste into Photoshop, InDesign, Word, or the site code with that font selected.

Run: double-click this file, or `pythonw scripts/tamil-converter.pyw`.
The fonts must be installed on this PC for the preview (they are in public/fonts/).
The maps live in to-mallikai.py and to-devadas.py; this file only adds the window.
"""
import importlib.util
import os
import re
import sys
import tkinter as tk
from pathlib import Path
from tkinter import ttk

sys.dont_write_bytecode = True  # don't leave __pycache__ next to the scripts
HERE = Path(__file__).resolve().parent

# pythonw has no console, so stdout/stderr are None; the converter scripts call
# sys.stdout.reconfigure() on import, which would crash before the window opens.
for _name in ("stdout", "stderr"):
    if getattr(sys, _name) is None:
        setattr(sys, _name, open(os.devnull, "w", encoding="utf-8"))


def load(name: str, func: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), HERE / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, func)


FONTS = {
    "Mallikai": load("to-mallikai", "to_mallikai"),
    "JF Devadas": load("to-devadas", "convert"),
}
TAMIL_UI = "Nirmala UI"


def convert(text: str, fn):
    """Convert word by word so one unmapped letter doesn't block the rest.

    Returns [(chunk, ok)] where failed words are kept as typed."""
    parts = []
    for tok in re.split(r"(\s+)", text):
        if not tok:
            continue
        try:
            # English letters would draw as Tamil glyphs in these fonts; flag them.
            if re.search(r"[A-Za-z]", tok):
                raise ValueError("latin")
            parts.append((fn(tok), True))
        except ValueError:
            parts.append((tok, tok.isspace()))
    return parts


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Tamil Font Converter")
        self.geometry("1100x640")
        self.minsize(700, 420)

        self.font_name = tk.StringVar(value="Mallikai")
        self.size = tk.IntVar(value=26)

        bar = ttk.Frame(self, padding=(12, 10))
        bar.pack(fill="x")
        ttk.Label(bar, text="Font:").pack(side="left")
        for name in FONTS:
            ttk.Radiobutton(bar, text=name, value=name, variable=self.font_name,
                            command=self.refresh).pack(side="left", padx=6)
        ttk.Label(bar, text="   Size:").pack(side="left")
        ttk.Spinbox(bar, from_=12, to=72, width=4, textvariable=self.size,
                    command=self.refresh).pack(side="left")
        ttk.Button(bar, text="Clear", command=self.clear).pack(side="right")
        ttk.Button(bar, text="Copy as JS escape", command=self.copy_escaped).pack(side="right", padx=6)
        ttk.Button(bar, text="Copy", command=self.copy).pack(side="right")

        panes = ttk.PanedWindow(self, orient="horizontal")
        panes.pack(fill="both", expand=True, padx=12)

        left = ttk.LabelFrame(panes, text="Type Tamil (Unicode)", padding=6)
        self.src = tk.Text(left, wrap="word", font=(TAMIL_UI, 16), undo=True)
        self.src.pack(fill="both", expand=True)
        panes.add(left, weight=1)

        right = ttk.LabelFrame(panes, text="Preview", padding=6)
        self.out = tk.Text(right, wrap="word", state="disabled", cursor="arrow")
        self.out.tag_configure("bad", foreground="#c62828", font=(TAMIL_UI, 14), underline=True)
        self.out.pack(fill="both", expand=True)
        panes.add(right, weight=1)

        self.status = tk.StringVar()
        ttk.Label(self, textvariable=self.status, padding=(12, 6)).pack(fill="x")

        self.src.bind("<<Modified>>", self.on_modified)
        self.size.trace_add("write", lambda *_: self.refresh())
        self.bind("<Control-Shift-C>", lambda e: self.copy())
        self.src.focus_set()
        self.code = ""
        self.refresh()

    def on_modified(self, _):
        self.src.edit_modified(False)
        self.refresh()

    def refresh(self):
        name = self.font_name.get()
        try:
            size = int(self.size.get())
        except (tk.TclError, ValueError):
            size = 26
        text = self.src.get("1.0", "end-1c")
        parts = convert(text, FONTS[name])
        self.code = "".join(chunk for chunk, _ in parts)

        self.out.configure(state="normal", font=(name, size))
        self.out.delete("1.0", "end")
        bad = []
        for chunk, ok in parts:
            self.out.insert("end", chunk, () if ok else ("bad",))
            if not ok:
                bad.append(chunk)
        self.out.configure(state="disabled")

        if bad:
            self.status.set(f"Can't convert (shown in red, copied as typed): {', '.join(bad[:8])}"
                            + (" …" if len(bad) > 8 else ""))
        elif text:
            self.status.set(f"{len(text)} characters → {name}. Ctrl+Shift+C or Copy to copy.")
        else:
            self.status.set("Start typing Tamil on the left.")

    def _clip(self, value: str, msg: str):
        self.clipboard_clear()
        self.clipboard_append(value)
        self.status.set(msg)

    def copy(self):
        self._clip(self.code, f"Copied {self.font_name.get()} code. Paste it with that font selected.")

    def copy_escaped(self):
        esc = "".join(c if 32 <= ord(c) < 127 and c not in '"\\' else f"\\u{ord(c):04x}"
                      for c in self.code)
        self._clip(esc, "Copied as a JS string escape (for lib/*.ts).")

    def clear(self):
        self.src.delete("1.0", "end")
        self.src.focus_set()


if __name__ == "__main__":
    App().mainloop()
