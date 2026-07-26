import { useEffect } from "react";
import report from "@/data/report.json";

type CoilInventoryRow = {
  tonnage?: number | string;
};

const headingLabels = ["Coil Inventory", "卷材库存", "موجودی کویل‌ها"];

const totalLabels: Record<string, string> = {
  "Coil Inventory": "Total inventory",
  "卷材库存": "库存合计",
  "موجودی کویل‌ها": "مجموع موجودی",
};

const unitLabels: Record<string, string> = {
  "Coil Inventory": "ton",
  "卷材库存": "吨",
  "موجودی کویل‌ها": "تن",
};

const formatTonnage = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function CoilInventoryEnhancer() {
  useEffect(() => {
    const total = (
      ((report as unknown as Record<string, unknown>).coilInventory ?? []) as CoilInventoryRow[]
    ).reduce((sum, row) => {
      const value = Number(row.tonnage ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const enhanceTable = () => {
      const section = Array.from(document.querySelectorAll("section")).find((candidate) => {
        const heading = candidate.querySelector("h2")?.textContent?.trim() ?? "";
        return headingLabels.includes(heading);
      });

      if (!section) return;

      const heading = section.querySelector("h2")?.textContent?.trim() ?? "Coil Inventory";
      const table = section.querySelector("table");
      if (!table) return;

      section.classList.add("coil-inventory-enhanced");

      let footer = table.querySelector<HTMLTableSectionElement>("tfoot[data-coil-inventory-total]");
      if (!footer) {
        footer = document.createElement("tfoot");
        footer.dataset.coilInventoryTotal = "true";
        const row = document.createElement("tr");
        row.className = "border-t-2 border-primary/40 bg-primary/10";

        const labelCell = document.createElement("td");
        labelCell.colSpan = 2;
        labelCell.className = "py-3 px-4 text-center font-semibold text-foreground";

        const valueCell = document.createElement("td");
        valueCell.className = "py-3 px-4 text-center font-bold tabular-nums text-primary";

        row.append(labelCell, valueCell);
        footer.append(row);
        table.append(footer);
      }

      const cells = footer.querySelectorAll("td");
      const totalLabel = totalLabels[heading] ?? "Total inventory";
      const totalValue = `${formatTonnage(total)} ${unitLabels[heading] ?? "ton"}`;

      if (cells[0] && cells[0].textContent !== totalLabel) cells[0].textContent = totalLabel;
      if (cells[1] && cells[1].textContent !== totalValue) cells[1].textContent = totalValue;
    };

    enhanceTable();
    const observer = new MutationObserver(enhanceTable);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      .coil-inventory-enhanced table th,
      .coil-inventory-enhanced table td {
        text-align: center !important;
      }
    `}</style>
  );
}
