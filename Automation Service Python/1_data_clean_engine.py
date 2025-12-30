"""
Apex Data Clean Engine

Cleans, standardizes, and fixes messy CSV/Excel files.

Offline behavior:
- CSV supported via stdlib `csv`
- XLSX supported if `openpyxl` is installed (optional)
"""

from __future__ import annotations

import csv
import dataclasses
import datetime as _dt
import io
import os
import re
import typing as t

from shared_utils import ServiceError, slugify_header, utc_now_iso


@dataclasses.dataclass
class DataCleanReport:
    rows_in: int
    rows_out: int
    columns_in: int
    columns_out: int
    header_map: dict[str, str]
    fixes: dict[str, int]
    started_at: str
    finished_at: str


class ApexDataCleanEngine:
    """
    Cleans, standardizes, and fixes messy CSV/Excel files.

    Offline behavior:
    - CSV supported via stdlib `csv`
    - XLSX supported if `openpyxl` is installed (optional)
    """

    _date_patterns = (
        # 2025-12-29
        re.compile(r"^\d{4}-\d{2}-\d{2}$"),
        # 12/29/2025, 12-29-2025
        re.compile(r"^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$"),
    )

    def clean_csv_text(
        self,
        csv_text: str,
        *,
        delimiter: str = ",",
        normalize_headers: bool = True,
        drop_empty_rows: bool = True,
    ) -> tuple[str, DataCleanReport]:
        started = utc_now_iso()
        fixes: dict[str, int] = {
            "trimmed_cells": 0,
            "normalized_headers": 0,
            "normalized_dates": 0,
            "normalized_numbers": 0,
            "empties_to_blank": 0,
            "dropped_empty_rows": 0,
        }

        inp = io.StringIO(csv_text)
        reader = csv.reader(inp, delimiter=delimiter)
        rows = list(reader)
        if not rows:
            raise ServiceError("CSV appears to be empty.")

        raw_headers = rows[0]
        data_rows = rows[1:]

        header_map: dict[str, str] = {}
        headers_out: list[str] = []
        for h in raw_headers:
            h2 = slugify_header(h) if normalize_headers else h.strip()
            header_map[h] = h2
            headers_out.append(h2)
            if h2 != h:
                fixes["normalized_headers"] += 1

        def norm_cell(val: str) -> str:
            if val is None:
                fixes["empties_to_blank"] += 1
                return ""
            v = str(val)
            v2 = v.strip()
            if v2 != v:
                fixes["trimmed_cells"] += 1
            v = v2
            if not v:
                return ""

            # numbers like "1,234.50" -> "1234.50"
            if re.fullmatch(r"-?\d{1,3}(,\d{3})+(\.\d+)?", v):
                fixes["normalized_numbers"] += 1
                return v.replace(",", "")

            # dates
            for pat in self._date_patterns:
                if pat.match(v):
                    iso = self._try_parse_date_to_iso(v)
                    if iso and iso != v:
                        fixes["normalized_dates"] += 1
                        return iso
                    return v
            return v

        def reconcile_row_length(row: list[str], target_cols: int) -> list[str]:
            """
            Best-effort fix for malformed CSV rows where delimiters appear inside values
            but the value wasn't quoted (e.g., 1,234.50).
            """
            if len(row) == target_cols:
                return row
            if len(row) < target_cols:
                return (row + [""] * target_cols)[:target_cols]

            # Attempt to merge numeric thousands separators: ["1","234.50"] -> ["1,234.50"]
            rr = list(row)
            numeric_left = re.compile(r"^-?\d{1,3}$")
            numeric_mid = re.compile(r"^\d{3}$")
            numeric_right = re.compile(r"^\d{3}(\.\d+)?$")

            i = 0
            while len(rr) > target_cols and i < len(rr) - 1:
                a, b = rr[i].strip(), rr[i + 1].strip()
                if numeric_left.match(a) and (numeric_mid.match(b) or numeric_right.match(b)):
                    rr[i : i + 2] = [f"{a},{b}"]
                    fixes["normalized_numbers"] += 1
                    continue
                i += 1

            # If still too long, merge the tail into the last column.
            if len(rr) > target_cols:
                head = rr[: target_cols - 1]
                tail = rr[target_cols - 1 :]
                rr = head + [delimiter.join(tail)]
            return rr[:target_cols]

        out_rows: list[list[str]] = [headers_out]
        rows_out_count = 0
        for r in data_rows:
            rr = reconcile_row_length(list(r), len(raw_headers))
            rr2 = [norm_cell(c) for c in rr]
            if drop_empty_rows and all(c == "" for c in rr2):
                fixes["dropped_empty_rows"] += 1
                continue
            out_rows.append(rr2)
            rows_out_count += 1

        out = io.StringIO()
        writer = csv.writer(out, delimiter=delimiter, lineterminator="\n")
        writer.writerows(out_rows)

        finished = utc_now_iso()
        report = DataCleanReport(
            rows_in=len(data_rows),
            rows_out=rows_out_count,
            columns_in=len(raw_headers),
            columns_out=len(headers_out),
            header_map=header_map,
            fixes=fixes,
            started_at=started,
            finished_at=finished,
        )
        return out.getvalue(), report

    def clean_csv_file(self, input_path: str, output_path: str | None = None) -> DataCleanReport:
        with open(input_path, "r", encoding="utf-8-sig", errors="replace") as f:
            csv_text = f.read()
        cleaned, report = self.clean_csv_text(csv_text)
        if output_path is None:
            base, ext = os.path.splitext(input_path)
            output_path = f"{base}.cleaned{ext or '.csv'}"
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            f.write(cleaned)
        return report

    def _try_parse_date_to_iso(self, value: str) -> str | None:
        value = value.strip()
        # YYYY-MM-DD
        try:
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                d = _dt.date.fromisoformat(value)
                return d.isoformat()
        except ValueError:
            pass
        # M/D/YYYY or M-D-YYYY
        m = re.fullmatch(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", value)
        if m:
            mm, dd, yy = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if yy < 100:
                yy += 2000
            try:
                return _dt.date(yy, mm, dd).isoformat()
            except ValueError:
                return None
        return None


