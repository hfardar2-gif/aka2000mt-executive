export type ReportLanguage = "zh" | "en" | "fa";

export type LocalizedText = Partial<Record<ReportLanguage, string>> & { en: string };

export interface MetricRow {
  key: string;
  value: number;
}

export interface AKAProjectReport {
  reportDate: string;
  version: string;
  title: LocalizedText;
  productionKpis: Array<{ key: string; value: number }>;
  totals: {
    inputCoilsTon: number;
    inputCoilsQty: number;
    pickling: number;
    rolling: number;
    galvanized: number;
    sold: number;
  };
  warehouse: Array<{ key: string; ton: number }>;
  scrap: Array<{ key: string; ton: number }>;
  materialBalance: Array<{ key: string; ton: number }>;
  finishedGoods: Array<{ key: string; ton: number }>;
  yields: Array<{ key: string; formula: string; value: number }>;
  coating: Array<{
    thickness: number;
    width: number;
    producedWeight: number;
    theoreticalZinc: number;
    loss: number;
    actualCoating: number;
  }>;
  massBalance: Array<{ key: string; value: number; unit: string }>;
  sales: Array<{ date: string; buyer: string; tonnage: number; amountRial: number }>;
  transport: { underLoading: number; readyInWarehouse: number };
  financial: Array<{ key: string; amountRial: number; note?: string }>;
  transfers: Array<{
    date: string;
    rialAmount: number;
    usdRate: number;
    usdAmount: number;
    status: string;
    notes?: string;
  }>;
  productionPlan: Array<{
    date: string;
    thickness: string;
    width: number;
    tons: number;
    status: string;
  }>;
  inventory: Array<{
    thickness: number;
    width: number;
    gradeAKg: number;
    gradeBCKg: number;
    totalKg: number;
  }>;
  dailyProduction: Array<{
    persianDate: string;
    date: string;
    inputCoilsTon: number;
    inputCoilsQty: number;
    pickling: number;
    rolling: number;
    galvanized: number;
  }>;
  notes: LocalizedText[];
  signature: { role: LocalizedText; name: string };
}

export const sum = <T>(rows: T[], selector: (row: T) => number) =>
  rows.reduce((total, row) => total + selector(row), 0);

export const reportChecks = (report: AKAProjectReport) => {
  const material = Object.fromEntries(report.materialBalance.map((row) => [row.key, row.ton]));
  const expectedMaterial =
    (material.finalGalvanizedProduct ?? 0) + (material.wip ?? 0) + (material.totalScrap ?? 0);
  const salesTonnage = sum(report.sales, (row) => row.tonnage);
  const inventoryKg = sum(report.inventory, (row) => row.totalKg);
  const dailyPickling = sum(report.dailyProduction, (row) => row.pickling);
  const dailyRolling = sum(report.dailyProduction, (row) => row.rolling);
  const dailyGalvanized = sum(report.dailyProduction, (row) => row.galvanized);

  return {
    materialBalanceDifference: report.totals.inputCoilsTon - expectedMaterial,
    salesDifference: report.totals.sold - salesTonnage,
    inventoryDifferenceTon: report.transport.readyInWarehouse - inventoryKg / 1000,
    dailyDifference: {
      pickling: report.totals.pickling - dailyPickling,
      rolling: report.totals.rolling - dailyRolling,
      galvanized: report.totals.galvanized - dailyGalvanized,
    },
  };
};
