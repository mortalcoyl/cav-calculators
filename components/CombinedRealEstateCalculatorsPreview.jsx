"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

const numberFormatter = new Intl.NumberFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const compactMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const CHART_TEXT_SCALE = 0.85;
const CHART_AXIS_FONT_SIZE = 16 * CHART_TEXT_SCALE;
const CHART_ANNOTATION_FONT_SIZE = 11 * CHART_TEXT_SCALE;
const CHART_AXIS_TICK = { fontSize: CHART_AXIS_FONT_SIZE };
const CHART_AXIS_LABEL = { fontSize: CHART_AXIS_FONT_SIZE };
const CHART_LEGEND_WRAPPER_STYLE = { fontSize: CHART_AXIS_FONT_SIZE };
const CHART_BOTTOM_LEGEND_WRAPPER_STYLE = {
  ...CHART_LEGEND_WRAPPER_STYLE,
  bottom: 0,
};

const MARKET_RETURN_PRESETS = [
  { id: "dow", label: "Dow", value: 9.7 },
  { id: "sp500", label: "S&P", value: 10.5 },
  { id: "nasdaq", label: "Nasdaq", value: 12.2 },
];
const MARKET_RETURN_CAVEAT =
  "Index presets use approximate 30-year annualized historical total-return averages with dividends reinvested. They are planning assumptions, not forecasts.";
const MARKET_RETURN_RANGE = { min: -20, max: 35 };
const MARKET_ZERO_PCT =
  ((0 - MARKET_RETURN_RANGE.min) /
    (MARKET_RETURN_RANGE.max - MARKET_RETURN_RANGE.min)) *
  100;
const STORAGE_PREFIX = "cav-calcs:v1";
const RETIREMENT_TAX_BRACKETS_2025_SINGLE = [
  { rate: 10, min: 0, max: 11925 },
  { rate: 12, min: 11926, max: 48475 },
  { rate: 22, min: 48476, max: 103350 },
  { rate: 24, min: 103351, max: 197300 },
  { rate: 32, min: 197301, max: 250525 },
  { rate: 35, min: 250526, max: 626350 },
  { rate: 37, min: 626351, max: Infinity },
];
const RETIREMENT_TAX_BRACKETS_2025_MARRIED_JOINT = [
  { rate: 10, min: 0, max: 23850 },
  { rate: 12, min: 23851, max: 96950 },
  { rate: 22, min: 96951, max: 206700 },
  { rate: 24, min: 206701, max: 394600 },
  { rate: 32, min: 394601, max: 501050 },
  { rate: 35, min: 501051, max: 751600 },
  { rate: 37, min: 751601, max: Infinity },
];
const RETIREMENT_TAX_FILING_STATUSES = [
  {
    id: "single",
    label: "Single",
    brackets: RETIREMENT_TAX_BRACKETS_2025_SINGLE,
  },
  {
    id: "married-joint",
    label: "Married filing jointly",
    brackets: RETIREMENT_TAX_BRACKETS_2025_MARRIED_JOINT,
  },
];
const CAPITAL_GAINS_TAX_BRACKETS_2025_SINGLE = [
  { rate: 0, min: 0, max: 48350 },
  { rate: 15, min: 48351, max: 533400 },
  { rate: 20, min: 533401, max: Infinity },
];
const CAPITAL_GAINS_TAX_BRACKETS_2025_MARRIED_JOINT = [
  { rate: 0, min: 0, max: 96700 },
  { rate: 15, min: 96701, max: 600050 },
  { rate: 20, min: 600051, max: Infinity },
];
const CAPITAL_GAINS_TAX_FILING_STATUSES = [
  {
    id: "single",
    label: "Single",
    brackets: CAPITAL_GAINS_TAX_BRACKETS_2025_SINGLE,
  },
  {
    id: "married-joint",
    label: "Married filing jointly",
    brackets: CAPITAL_GAINS_TAX_BRACKETS_2025_MARRIED_JOINT,
  },
];
const RENT_VS_BUY_TABLE_COLUMNS = [
  "Rent Expense",
  "Renter Invested",
  "Renter Cumulative",
  "Renter Ending",
  "Buyer Outlay",
  "Buyer Invested",
  "Buyer Cumulative",
  "Buyer Equity",
  "Buyer End",
];
const RENT_VS_BUY_EXPORT_COLUMNS = [
  { header: "Year", key: "year" },
  { header: "Rent Expense", key: "renterRentExpense" },
  { header: "Renter Invested", key: "renterInvested" },
  { header: "Renter Cumulative", key: "renterCumulative" },
  { header: "Renter Ending", key: "renterEnding" },
  { header: "Buyer Outlay", key: "buyerOutlay" },
  { header: "Buyer Invested", key: "buyerInvested" },
  { header: "Buyer Cumulative", key: "buyerCumulative" },
  { header: "Buyer Equity", key: "buyerEquity" },
  { header: "Buyer End", key: "buyerEnding" },
  { header: "Home Value", key: "homeValue" },
  { header: "Loan Balance", key: "loanBalance" },
  { header: "Equity After Sale", key: "equityAfterSale" },
];
const RENTAL_PROPERTY_EXPORT_COLUMNS = [
  { header: "Year", key: "year" },
  { header: "Rental Property Profit", key: "rentalPropertyProfit" },
  { header: "Market Investment Result", key: "marketInvestmentResult" },
  { header: "Property Value", key: "propertyValue" },
  { header: "Equity After Sale", key: "equityAfterSale" },
  { header: "Cumulative Cash Flow", key: "cumulativeCashFlow" },
  { header: "Reinvested Cash Flow", key: "reinvestedCashFlow" },
];
const HOME_VALUE_YEAR_TABLE_COLUMNS = [
  "Year",
  "Home Value",
  "Loan Balance",
  "Equity After Sale",
  "Annual Rent",
  "Market Investment",
  "House Advantage",
];
const HOME_VALUE_EXPORT_COLUMNS = [
  { header: "Year", key: "year" },
  { header: "Home Value Result", key: "homeValueResult" },
  { header: "Market Investment Result", key: "marketInvestmentResult" },
  { header: "Home Value", key: "homeValue" },
  { header: "Loan Balance", key: "mortgageBalance" },
  { header: "Equity After Sale", key: "equityAfterSale" },
  { header: "Annual Rent", key: "annualRentAvoided" },
  { header: "House Advantage", key: "houseAdvantage" },
];
const AUTO_COST_TABLE_YEARS = [3, 5, 10];
const AUTO_COST_EXPORT_COLUMNS = [
  { header: "Years", key: "years" },
  { header: "Option", key: "option" },
  { header: "Total Cash Out", key: "totalCashOut" },
  { header: "Resale", key: "resaleValue" },
  { header: "Net Cost", key: "netCost" },
  { header: "Saved Cash Invested", key: "savedCashInvested" },
  { header: "Investment Growth", key: "investmentGrowth" },
  { header: "Investment Value", key: "investmentValue" },
  { header: "Net Outcome", key: "outcome" },
];
const COLLEGE_SAVINGS_EXPORT_COLUMNS = [
  { header: "Year", key: "year" },
  { header: "Month", key: "month" },
  { header: "Combined Balance", key: "combinedBalance" },
  { header: "Combined Withdrawn", key: "combinedWithdrawn" },
  { header: "Combined Contributions", key: "combinedContributions" },
  { header: "Combined Interest", key: "combinedInterest" },
  { header: "Yearly School Cost", key: "yearlySchoolCost" },
  { header: "Uncovered Shortfall", key: "shortfall" },
];
const GENERATIONAL_SAVINGS_EXPORT_COLUMNS = [
  { header: "Year", key: "year" },
  { header: "Child", key: "child" },
  { header: "Starting Amount", key: "startingBalance" },
  { header: "Contributions", key: "contributions" },
  { header: "Earnings", key: "earnings" },
  { header: "Milestone Expenses", key: "milestoneExpenses" },
  { header: "Ending Balance", key: "endingBalance" },
];
const RETIREMENT_EXPORT_COLUMNS = [
  { header: "Age", key: "age" },
  { header: "Year", key: "year" },
  { header: "Phase", key: "phase" },
  { header: "Portfolio", key: "portfolio" },
  { header: "Contribution", key: "contribution" },
  { header: "Gross Withdrawal", key: "grossWithdrawal" },
  { header: "After Tax Spending", key: "afterTaxSpending" },
  { header: "Shortfall", key: "shortfall" },
];
const MEDICAL_COST_EXPORT_COLUMNS = [
  { header: "Age", key: "age" },
  { header: "Year", key: "year" },
  { header: "Yearly Invested Amount", key: "yearlyInvestedAmount" },
  { header: "Employee Cost", key: "employeeCost" },
  { header: "Cash Medical Cost", key: "cashMedicalCost" },
  { header: "Invested Balance", key: "investedBalance" },
  { header: "Cumulative Invested", key: "cumulativeInvested" },
  { header: "Cumulative Employee Costs", key: "cumulativeEmployeeCosts" },
  { header: "Cumulative Cash Costs", key: "cumulativeCashCosts" },
  { header: "Shortfall", key: "shortfall" },
];
const MEDICAL_HEALTH_STATUS_OPTIONS = [
  { id: "healthy", label: "Healthy", color: "#639922" },
  { id: "unhealthy", label: "Unhealthy", color: "#BA7517" },
  { id: "very-unhealthy", label: "Very unhealthy", color: "#E24B4A" },
];
const MEDICAL_ANNUAL_COSTS_BY_AGE = [
  { age: 20, healthy: 2400, unhealthy: 7000, "very-unhealthy": 18000 },
  { age: 25, healthy: 2700, unhealthy: 8500, "very-unhealthy": 23000 },
  { age: 30, healthy: 3100, unhealthy: 10500, "very-unhealthy": 29000 },
  { age: 35, healthy: 3600, unhealthy: 13000, "very-unhealthy": 37000 },
  { age: 40, healthy: 4200, unhealthy: 16000, "very-unhealthy": 47000 },
  { age: 45, healthy: 5200, unhealthy: 19500, "very-unhealthy": 59000 },
  { age: 50, healthy: 6500, unhealthy: 23500, "very-unhealthy": 72000 },
  { age: 55, healthy: 8000, unhealthy: 28000, "very-unhealthy": 85000 },
  { age: 60, healthy: 9500, unhealthy: 33000, "very-unhealthy": 98000 },
  { age: 65, healthy: 13000, unhealthy: 42000, "very-unhealthy": 118000 },
  { age: 70, healthy: 17000, unhealthy: 54000, "very-unhealthy": 145000 },
  { age: 75, healthy: 25000, unhealthy: 70000, "very-unhealthy": 178000 },
  { age: 80, healthy: 38000, unhealthy: 88000, "very-unhealthy": 215000 },
  { age: 85, healthy: 52000, unhealthy: 108000, "very-unhealthy": 248000 },
  { age: 90, healthy: 66000, unhealthy: 126000, "very-unhealthy": 272000 },
  { age: 95, healthy: 78000, unhealthy: 143000, "very-unhealthy": 292000 },
  { age: 100, healthy: 92000, unhealthy: 160000, "very-unhealthy": 310000 },
];
const MEDICAL_SEX_COSTS_BY_AGE = [
  { age: 20, women: 5800, men: 3200 },
  { age: 23, women: 7800, men: 3800 },
  { age: 27, women: 8500, men: 4400 },
  { age: 30, women: 8200, men: 4800 },
  { age: 33, women: 7800, men: 5500 },
  { age: 37, women: 7000, men: 6600 },
  { age: 40, women: 6400, men: 8000 },
  { age: 43, women: 6800, men: 10000 },
  { age: 47, women: 7800, men: 12500 },
  { age: 50, women: 9500, men: 15000 },
  { age: 53, women: 11500, men: 17500 },
  { age: 57, women: 13500, men: 19500 },
  { age: 60, women: 16500, men: 21500 },
  { age: 63, women: 20000, men: 24000 },
  { age: 65, women: 24000, men: 26500 },
  { age: 68, women: 30000, men: 32000 },
  { age: 70, women: 36000, men: 37000 },
  { age: 73, women: 44000, men: 44000 },
  { age: 75, women: 52000, men: 52000 },
  { age: 78, women: 65000, men: 61000 },
  { age: 80, women: 78000, men: 70000 },
  { age: 83, women: 95000, men: 80000 },
  { age: 85, women: 110000, men: 88000 },
  { age: 88, women: 128000, men: 97000 },
  { age: 90, women: 142000, men: 104000 },
  { age: 93, women: 155000, men: 112000 },
  { age: 97, women: 165000, men: 118000 },
  { age: 100, women: 172000, men: 124000 },
];
const SCHOOL_YEAR_OPTIONS = [
  { value: -1, label: "Pre-K" },
  { value: 0, label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: `Grade ${index + 1}`,
  })),
];
const CHART_COLORS = [
  "#0284c7",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
];

function parseNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function clampNumber(value, min, max) {
  const numeric = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, numeric));
}
function safePow(base, exponent) {
  const result = Math.pow(base, exponent);
  return Number.isFinite(result) ? result : 0;
}

function usePersistentState(storageKey, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue !== null) setValue(JSON.parse(storedValue));
    } catch {
      // Browser storage can be unavailable or manually edited; defaults keep the calculator usable.
    } finally {
      setHasLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore quota/private-mode failures so calculator interaction never breaks.
    }
  }, [hasLoaded, storageKey, value]);

  return [value, setValue];
}

function useCalculatorState(calculatorId, field, defaultValue) {
  return usePersistentState(
    `${STORAGE_PREFIX}:${calculatorId}:${field}`,
    defaultValue,
  );
}
function calculateMonthlyPayment(principal, annualRate, months = 360) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = safePow(1 + monthlyRate, months);
  return factor === 1
    ? principal / months
    : (principal * monthlyRate * factor) / (factor - 1);
}
function formatMoney(value) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}
function formatCompactMoney(value) {
  return compactMoneyFormatter.format(Number.isFinite(value) ? value : 0);
}
function formatCost(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  return numeric === 0 ? formatMoney(0) : formatMoney(-Math.abs(numeric));
}
function formatPercent(value) {
  return `${Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, "")}%`;
}
function getRetirementTaxBracket2025(spending, filingStatus = "single") {
  const status =
    RETIREMENT_TAX_FILING_STATUSES.find((item) => item.id === filingStatus) ||
    RETIREMENT_TAX_FILING_STATUSES[0];
  const bracket =
    status.brackets.find(
      (item) => spending >= item.min && spending <= item.max,
    ) || status.brackets[status.brackets.length - 1];
  return {
    ...bracket,
    filingStatus: status.id,
    filingStatusLabel: status.label,
    label:
      bracket.max === Infinity
        ? `${bracket.rate}% over ${formatMoney(bracket.min - 1)}`
        : `${bracket.rate}% for ${formatMoney(bracket.min)}-${formatMoney(bracket.max)}`,
  };
}
function getCapitalGainsTaxBracket2025(taxableIncome, filingStatus = "single") {
  const status =
    CAPITAL_GAINS_TAX_FILING_STATUSES.find(
      (item) => item.id === filingStatus,
    ) || CAPITAL_GAINS_TAX_FILING_STATUSES[0];
  const bracket =
    status.brackets.find(
      (item) => taxableIncome >= item.min && taxableIncome <= item.max,
    ) || status.brackets[status.brackets.length - 1];
  return {
    ...bracket,
    filingStatus: status.id,
    filingStatusLabel: status.label,
    label:
      bracket.max === Infinity
        ? `${bracket.rate}% over ${formatMoney(bracket.min - 1)}`
        : `${bracket.rate}% for ${formatMoney(bracket.min)}-${formatMoney(bracket.max)}`,
  };
}
function getGenerationalBrokerageTaxRate({
  month,
  currentAge,
  currentSalary,
  retirementAge,
  retirementSalary,
}) {
  const ageAtWithdrawal = currentAge + month / 12;
  const taxableIncome =
    ageAtWithdrawal >= retirementAge ? retirementSalary : currentSalary;
  return getCapitalGainsTaxBracket2025(taxableIncome).rate / 100;
}
function toExportFilename(title) {
  return `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "calculator"
  }-export.csv`;
}
function escapeCsvValue(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function downloadCsv({ title, columns, rows }) {
  if (typeof window === "undefined" || !columns?.length || !rows?.length)
    return;
  const header = columns
    .map((column) => escapeCsvValue(column.header))
    .join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value =
            typeof column.accessor === "function"
              ? column.accessor(row)
              : row[column.key];
          return escapeCsvValue(value);
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = toExportFilename(title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function calculateAutoScenario({
  price,
  downPaymentPct = 20,
  tradeInValue = 0,
  rate,
  loanTermMonths,
  yearsOwned,
  depreciationPct,
  annualInsurance,
  annualMaintenance,
  annualRegistration,
  annualFuel,
}) {
  const downPayment = price * (downPaymentPct / 100);
  const effectiveDownPayment = downPayment + tradeInValue;
  const loanAmount = Math.max(0, price - effectiveDownPayment);
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    rate,
    loanTermMonths,
  );
  const paidMonths = Math.min(yearsOwned * 12, loanTermMonths);
  const totalPayments = monthlyPayment * paidMonths;
  const totalInsurance = annualInsurance * yearsOwned;
  const totalMaintenance = annualMaintenance * yearsOwned;
  const totalRegistration = annualRegistration * yearsOwned;
  const totalFuel = annualFuel * yearsOwned;
  const monthlyOwnershipCost =
    (annualInsurance + annualMaintenance + annualRegistration + annualFuel) /
    12;
  const monthlyTotalCost = monthlyPayment + monthlyOwnershipCost;
  const resaleValue = price * safePow(1 - depreciationPct / 100, yearsOwned);
  const totalCashOut =
    downPayment +
    totalPayments +
    totalInsurance +
    totalMaintenance +
    totalRegistration +
    totalFuel;
  return {
    downPayment,
    downPaymentPct,
    tradeInValue,
    effectiveDownPayment,
    loanAmount,
    monthlyPayment,
    monthlyOwnershipCost,
    monthlyTotalCost,
    totalPayments,
    totalInsurance,
    totalMaintenance,
    totalRegistration,
    totalFuel,
    totalCashOut,
    resaleValue,
    netCost: Math.max(0, totalCashOut - resaleValue),
  };
}

function calculateLeaseScenario({
  carValue = 45000,
  dueAtSigning,
  monthlyPayment,
  yearsOwned,
  annualInsurance,
  annualMaintenance,
  annualRegistration,
  annualFuel,
  dispositionFee,
  residualPct = 55,
  buyoutAtEnd = false,
  postBuyoutDepreciationPct = 10,
}) {
  const residualValue = carValue * (residualPct / 100);
  const totalPayments = monthlyPayment * yearsOwned * 12;
  const totalInsurance = annualInsurance * yearsOwned;
  const totalMaintenance = annualMaintenance * yearsOwned;
  const totalRegistration = annualRegistration * yearsOwned;
  const totalFuel = annualFuel * yearsOwned;
  const buyoutCost = buyoutAtEnd ? residualValue : 0;
  const buyoutResaleValue = buyoutAtEnd
    ? residualValue *
      safePow(1 - postBuyoutDepreciationPct / 100, Math.max(0, yearsOwned))
    : 0;
  const totalCashOut =
    dueAtSigning +
    totalPayments +
    totalInsurance +
    totalMaintenance +
    totalRegistration +
    totalFuel +
    dispositionFee +
    buyoutCost;
  const monthlyOwnershipCost =
    (annualInsurance + annualMaintenance + annualRegistration + annualFuel) /
    12;
  const monthlyTotalCost = monthlyPayment + monthlyOwnershipCost;
  return {
    downPayment: dueAtSigning,
    monthlyPayment,
    monthlyOwnershipCost,
    monthlyTotalCost,
    totalPayments,
    totalInsurance,
    totalMaintenance,
    totalRegistration,
    totalFuel,
    totalCashOut,
    resaleValue: buyoutResaleValue,
    netCost: Math.max(0, totalCashOut - buyoutResaleValue),
    dispositionFee,
    carValue,
    residualPct,
    residualValue,
    buyoutCost,
    buyoutResaleValue,
    postBuyoutDepreciationPct,
    buyoutAtEnd,
  };
}

function calculateAutoInvestmentComparison({
  used,
  newer,
  lease,
  yearsOwned,
  marketReturn,
}) {
  const totalMonths = yearsOwned * 12;
  const monthlyRate = marketReturn / 100 / 12;
  const scenarios = [
    { id: "used", label: "Used car", data: used },
    { id: "new", label: "New car", data: newer },
    { id: "lease", label: "Lease", data: lease },
  ];
  const highestStartingCash = Math.max(
    ...scenarios.map((scenario) => scenario.data.downPayment),
  );
  const highestMonthlyCost = Math.max(
    ...scenarios.map((scenario) => scenario.data.monthlyTotalCost),
  );
  const results = scenarios.map((scenario) => {
    const upfrontSavedCash = Math.max(
      0,
      highestStartingCash - scenario.data.downPayment,
    );
    const monthlySavings = Math.max(
      0,
      highestMonthlyCost - scenario.data.monthlyTotalCost,
    );
    const savedCashInvested = upfrontSavedCash + monthlySavings * totalMonths;
    let investmentValue = upfrontSavedCash;

    for (let month = 0; month < totalMonths; month++) {
      investmentValue = investmentValue * (1 + monthlyRate) + monthlySavings;
    }

    const investmentGrowth = Math.max(0, investmentValue - savedCashInvested);

    return {
      ...scenario,
      upfrontSavedCash,
      monthlySavings,
      savedCashInvested,
      investmentGrowth,
      investmentValue,
      investedSavings: investmentValue,
      outcome: investmentValue - scenario.data.netCost,
    };
  });
  const winner = results.reduce(
    (best, current) => (current.outcome > best.outcome ? current : best),
    results[0],
  );
  const runnerUp = Math.max(
    ...results
      .filter((result) => result.id !== winner.id)
      .map((result) => result.outcome),
  );
  return {
    results,
    used: results.find((result) => result.id === "used"),
    newer: results.find((result) => result.id === "new"),
    lease: results.find((result) => result.id === "lease"),
    winner,
    gap: Math.abs(winner.outcome - runnerUp),
  };
}

function runPreviewTests() {
  const auto = calculateAutoScenario({
    price: 30000,
    downPaymentPct: 16.6667,
    tradeInValue: 0,
    rate: 6,
    loanTermMonths: 60,
    yearsOwned: 5,
    depreciationPct: 10,
    annualInsurance: 1800,
    annualMaintenance: 1200,
    annualRegistration: 400,
    annualFuel: 2400,
  });
  const autoSavings = calculateAutoInvestmentComparison({
    used: auto,
    newer: {
      ...auto,
      downPayment: auto.downPayment + 1000,
      monthlyTotalCost: auto.monthlyTotalCost + 100,
    },
    lease: {
      ...auto,
      downPayment: auto.downPayment + 500,
      monthlyTotalCost: auto.monthlyTotalCost + 50,
      netCost: auto.netCost + 500,
    },
    yearsOwned: 5,
    marketReturn: 10,
  });
  const tests = [
    {
      name: "parseNumber handles currency",
      pass: parseNumber("$1,250,000") === 1250000,
    },
    {
      name: "parseNumber handles decimals",
      pass: parseNumber("1.25") === 1.25 && parseNumber(".5") === 0.5,
    },
    {
      name: "zero interest payment",
      pass: Math.round(calculateMonthlyPayment(360000, 0, 360)) === 1000,
    },
    { name: "market presets exist", pass: MARKET_RETURN_PRESETS.length === 3 },
    {
      name: "market return caveat explains period",
      pass: MARKET_RETURN_CAVEAT.includes("30-year"),
    },
    {
      name: "rent table column count",
      pass: RENT_VS_BUY_TABLE_COLUMNS.length === 9,
    },
    {
      name: "home value table columns",
      pass: HOME_VALUE_YEAR_TABLE_COLUMNS.includes("House Advantage"),
    },
    {
      name: "auto cost produces positive net cost",
      pass: auto.netCost > 0 && auto.monthlyPayment > 0,
    },
    {
      name: "auto trade-in reduces financed amount",
      pass:
        calculateAutoScenario({
          price: 30000,
          downPaymentPct: 16.6667,
          tradeInValue: 3000,
          rate: 6,
          loanTermMonths: 60,
          yearsOwned: 5,
          depreciationPct: 10,
          annualInsurance: 1800,
          annualMaintenance: 1200,
          annualRegistration: 400,
          annualFuel: 2400,
        }).loanAmount < 22001 &&
        calculateAutoScenario({
          price: 30000,
          downPaymentPct: 16.6667,
          tradeInValue: 3000,
          rate: 6,
          loanTermMonths: 60,
          yearsOwned: 5,
          depreciationPct: 10,
          annualInsurance: 1800,
          annualMaintenance: 1200,
          annualRegistration: 400,
          annualFuel: 2400,
        }).loanAmount > 21999,
    },
    {
      name: "lease buyout applies depreciated resale value",
      pass:
        calculateLeaseScenario({
          carValue: 50000,
          dueAtSigning: 4000,
          monthlyPayment: 500,
          yearsOwned: 3,
          annualInsurance: 1800,
          annualMaintenance: 500,
          annualRegistration: 400,
          annualFuel: 2000,
          dispositionFee: 500,
          residualPct: 50,
          buyoutAtEnd: true,
          postBuyoutDepreciationPct: 10,
        }).resaleValue < 25000 &&
        calculateLeaseScenario({
          carValue: 50000,
          dueAtSigning: 4000,
          monthlyPayment: 500,
          yearsOwned: 3,
          annualInsurance: 1800,
          annualMaintenance: 500,
          annualRegistration: 400,
          annualFuel: 2000,
          dispositionFee: 500,
          residualPct: 50,
          buyoutAtEnd: true,
          postBuyoutDepreciationPct: 10,
        }).resaleValue > 0,
    },
    {
      name: "auto savings investment compounds positive savings",
      pass:
        autoSavings.used.investmentValue > autoSavings.used.savedCashInvested,
    },
    {
      name: "auto cost table includes 3, 5, and 10 years",
      pass: AUTO_COST_TABLE_YEARS.join(",") === "3,5,10",
    },
    {
      name: "formatCost displays costs as negative",
      pass: formatCost(1000).startsWith("-") || formatCost(1000).includes("($"),
    },
  ];
  const failed = tests.filter((test) => !test.pass);
  if (failed.length)
    console.warn(
      "Preview calculator tests failed:",
      failed.map((test) => test.name),
    );
}
if (typeof window !== "undefined") runPreviewTests();

function IconBase({ children, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
function HomeIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V21h14V10.5" />
      <path d="M9 21v-6h6v6" />
    </IconBase>
  );
}
function BuildingIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M4 21h16" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h1" />
      <path d="M14 7h1" />
      <path d="M9 11h1" />
      <path d="M14 11h1" />
      <path d="M9 15h1" />
      <path d="M14 15h1" />
    </IconBase>
  );
}
function ScaleIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M6 7l-3 7h6L6 7Z" />
      <path d="M18 7l-3 7h6l-3-7Z" />
      <path d="M4 21h16" />
    </IconBase>
  );
}
function CalculatorIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </IconBase>
  );
}
function TrendingUpIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </IconBase>
  );
}
function DollarIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </IconBase>
  );
}
function BarChartIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17v-5" />
      <path d="M12 17V8" />
      <path d="M16 17v-7" />
    </IconBase>
  );
}
function CarIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M5 17h14" />
      <path d="M6 17l1.5-6h9L18 17" />
      <path d="M8 11l1.2-3h5.6L16 11" />
      <path d="M7 17v2" />
      <path d="M17 17v2" />
      <path d="M8 15h.01" />
      <path d="M16 15h.01" />
    </IconBase>
  );
}
function GraduationIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
      <path d="M22 10v6" />
    </IconBase>
  );
}
function GiftIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M20 12v9H4v-9" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
      <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
    </IconBase>
  );
}
function MedicalIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="M4 21h16" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M10 7h4" />
      <path d="M12 5v4" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M9 16h.01" />
      <path d="M15 16h.01" />
      <path d="M11 21v-4h2v4" />
    </IconBase>
  );
}
function ChevronDownIcon({ className = "" }) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
function AdditionalCostsSection({ children }) {
  return (
    <div className="mt-auto pt-6">
      <div className="border-t border-neutral-200 pt-6">
        <h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-950">
          Additional Costs
        </h3>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex min-w-0 items-start gap-3">
      <div className="mt-1 shrink-0 rounded-xl bg-neutral-100 p-2">
        <Icon className="h-4 w-4 text-neutral-800" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-full break-words text-sm leading-6 text-neutral-600">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
function MoneyInput({
  label,
  value,
  onChange,
  min = 0,
  max = 5000000,
  step = 1000,
  helperText,
  displayValue,
}) {
  const safeValue = clampNumber(parseNumber(value), min, max);
  const setSafeValue = (nextValue) =>
    onChange(clampNumber(parseNumber(nextValue), min, max));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-800">{label}</label>
        <div className="flex min-w-[128px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950">
          <span className="text-neutral-400">$</span>
          <input
            value={displayValue ?? numberFormatter.format(safeValue)}
            onChange={(event) => setSafeValue(event.target.value)}
            className="w-full bg-transparent px-2 text-right text-sm font-semibold outline-none"
            inputMode="decimal"
          />
        </div>
      </div>
      {helperText && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(event) => setSafeValue(event.target.value)}
        className="mt-2 w-full accent-neutral-950"
      />
    </div>
  );
}
function PercentInput({
  label,
  value,
  onChange,
  min = -10,
  max = 20,
  step = 0.1,
  helperText,
  formatDisplayValue,
}) {
  const safeValue = clampNumber(parseNumber(value), min, max);
  const formatDraftValue = (nextValue) =>
    formatDisplayValue ? formatDisplayValue(nextValue) : String(nextValue);
  const [draft, setDraft] = useState(formatDraftValue(safeValue));
  useEffect(() => setDraft(formatDraftValue(safeValue)), [safeValue]);
  const partial = (text) =>
    text === "" ||
    text === "-" ||
    text === "." ||
    text === "-." ||
    /^-?[0-9]+[.]$/.test(text);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-800">{label}</label>
        <div className="flex min-w-[96px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950">
          <input
            value={draft}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              if (!partial(next))
                onChange(clampNumber(parseNumber(next), min, max));
            }}
            onBlur={() => {
              const parsed = clampNumber(parseNumber(draft), min, max);
              onChange(parsed);
              setDraft(formatDraftValue(parsed));
            }}
            className="w-full bg-transparent text-right text-sm font-semibold outline-none"
            inputMode="decimal"
          />
          <span className="ml-1 text-neutral-400">%</span>
        </div>
      </div>
      {helperText && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(event) => {
          const next = parseNumber(event.target.value);
          onChange(next);
          setDraft(formatDraftValue(next));
        }}
        className="mt-2 w-full accent-neutral-950"
      />
    </div>
  );
}
function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  helperText,
}) {
  const safeValue = clampNumber(parseNumber(value), min, max);
  const [draft, setDraft] = useState(String(safeValue));
  useEffect(() => setDraft(String(safeValue)), [safeValue]);
  const setSafeValue = (nextValue) => {
    const parsed = clampNumber(parseNumber(nextValue), min, max);
    onChange(parsed);
    setDraft(String(parsed));
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-800">{label}</label>
        <div className="flex min-w-[96px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950">
          <input
            value={draft}
            onFocus={(event) => event.target.select()}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setSafeValue(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="w-full bg-transparent text-right text-sm font-semibold outline-none"
            inputMode="numeric"
          />
          {suffix && <span className="ml-1 text-neutral-400">{suffix}</span>}
        </div>
      </div>
      {helperText && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(event) => setSafeValue(event.target.value)}
        className="mt-2 w-full accent-neutral-950"
      />
    </div>
  );
}
function MarketReturnPicker({ value, onChange }) {
  const activePreset = MARKET_RETURN_PRESETS.find(
    (preset) => Math.abs(preset.value - value) < 0.05,
  );
  return (
    <div className="space-y-3">
      <PercentInput
        label="Estimated market return"
        value={value}
        onChange={onChange}
        min={MARKET_RETURN_RANGE.min}
        max={MARKET_RETURN_RANGE.max}
        helperText={
          activePreset
            ? `${activePreset.label} preset selected`
            : "Custom return"
        }
      />
      <div className="relative -mt-2 h-3">
        <span
          className="absolute top-0 h-3 w-px bg-neutral-500"
          style={{ left: `${MARKET_ZERO_PCT}%` }}
        />
        <span
          className="absolute top-2 -translate-x-1/2 text-[10px] font-semibold text-neutral-500"
          style={{ left: `${MARKET_ZERO_PCT}%` }}
        >
          0
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MARKET_RETURN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`rounded-xl border px-3 py-2 text-center text-xs font-bold transition ${activePreset?.id === preset.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}
          >
            <span className="block">{preset.label}</span>
            <span className="mt-0.5 block font-semibold">
              {formatPercent(preset.value)}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs leading-5 text-neutral-500">
        {MARKET_RETURN_CAVEAT}
      </p>
    </div>
  );
}
function SmallStat({ label, value, tone = "neutral", detail, alignValue = false }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "blue"
        ? "border-sky-200 bg-sky-50"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50"
          : tone === "red"
            ? "border-red-200 bg-red-50"
            : tone === "teal"
              ? "border-teal-200 bg-teal-50"
              : tone === "magenta"
                ? "border-fuchsia-200 bg-fuchsia-50"
                : "border-neutral-200 bg-neutral-50";
  return (
    <div
      className={`rounded-2xl border p-4 ${
        alignValue ? "flex min-h-28 flex-col" : ""
      } ${toneClass}`}
    >
      <div
        className={`text-xs font-medium uppercase tracking-wide text-neutral-500 ${
          alignValue ? "min-h-8" : ""
        }`}
      >
        {label}
      </div>
      <div
        className={`text-xl font-bold text-neutral-950 ${
          alignValue ? "mt-auto" : "mt-2"
        }`}
      >
        {value}
      </div>
      {detail && (
        <div className="mt-1 text-sm font-semibold leading-5 text-neutral-700">
          {detail}
        </div>
      )}
    </div>
  );
}
function OwnershipCostSummary({
  title,
  subtitle,
  startingLabel,
  startingAmount,
  items,
  totalLabel,
  totalAmount,
  remainingLabel,
  remainingAmount,
  note,
}) {
  return (
    <Card>
      <SectionTitle icon={DollarIcon} title={title} subtitle={subtitle} />
      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-neutral-50">
        {Number.isFinite(startingAmount) && (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-950">
              {startingLabel}
            </span>
            <span className="text-sm font-bold text-neutral-950">
              {formatMoney(startingAmount)}
            </span>
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <span className="text-sm text-neutral-600">{item.label}</span>
            <span className="text-sm font-semibold text-neutral-950">
              -{formatMoney(item.amount)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-neutral-950">
            {totalLabel}
          </span>
          <span className="text-sm font-bold text-neutral-950">
            {formatMoney(totalAmount)}
          </span>
        </div>
        {Number.isFinite(remainingAmount) && (
          <div className="flex items-center justify-between gap-4 rounded-b-xl bg-emerald-50 px-4 py-3">
            <span className="text-sm font-semibold text-emerald-900">
              {remainingLabel}
            </span>
            <span className="text-sm font-bold text-emerald-900">
              {formatMoney(remainingAmount)}
            </span>
          </div>
        )}
      </div>
      {note && (
        <p className="mt-3 text-xs leading-5 text-neutral-500">{note}</p>
      )}
    </Card>
  );
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const milestoneDetails = payload[0]?.payload?.milestoneDetails || [];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-2 text-[10.2px] font-semibold text-neutral-500">
        Year {label}
      </div>
      {payload.map((item) => {
        const color = item.color || item.stroke || "#171717";
        return (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-6 text-[11.9px]"
          >
            <span className="font-semibold" style={{ color }}>
              {item.name}
            </span>
            <strong style={{ color }}>{formatCompactMoney(item.value)}</strong>
          </div>
        );
      })}
      {milestoneDetails.length > 0 && (
        <div className="mt-3 border-t border-neutral-200 pt-2">
          <div className="mb-1 text-[10.2px] font-semibold uppercase tracking-wide text-neutral-500">
            Milestones
          </div>
          {milestoneDetails.map((milestone, index) => (
            <div
              key={`${milestone.label}-${index}`}
              className="flex items-center justify-between gap-6 text-[11.9px]"
            >
              <span className="font-semibold text-fuchsia-700">
                {milestone.label}
              </span>
              <strong className="text-fuchsia-700">
                {formatMoney(milestone.cost)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ExportMenu({ title, exportData }) {
  const [open, setOpen] = useState(false);
  const hasCsv = Boolean(
    exportData?.columns?.length && exportData?.rows?.length,
  );
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
      >
        Export
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1 text-sm shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.print();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Print / save PDF
          </button>
          <button
            type="button"
            disabled={!hasCsv}
            onClick={() => {
              setOpen(false);
              downloadCsv({
                title,
                columns: exportData.columns,
                rows: exportData.rows,
              });
            }}
            className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
function CalculatorFrame({
  title,
  description,
  children,
  exportData,
  badge,
  headerClassName = "",
}) {
  return (
    <motion.div
      key={title}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className={`mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${headerClassName}`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-[#d21e7c] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            {description}
          </p>
        </div>
        {exportData && <ExportMenu title={title} exportData={exportData} />}
      </div>
      {children}
    </motion.div>
  );
}

function calculateRentVsBuyScenario({
  homePrice,
  downPaymentPct,
  rate,
  loanYears,
  rent,
  monthlyCashBeforeHousing,
  appreciation,
  marketReturn,
  rentInflation,
  propertyTaxPct,
  annualInsurance,
  maintenancePct,
  renovations,
  buyingClosingCostPct,
  transferTaxPct = 0,
  recordationTaxPct = 0,
  additionalCosts = 0,
  sellingCostPct,
  years,
  incomeTaxRate,
  standardDeduction,
  includeTaxBenefit,
}) {
  const downPayment = homePrice * (downPaymentPct / 100);
  const buyingClosingCosts = homePrice * (buyingClosingCostPct / 100);
  const transferTax = homePrice * (transferTaxPct / 100);
  const recordationTax = homePrice * (recordationTaxPct / 100);
  const initialCashNeeded =
    downPayment +
    buyingClosingCosts +
    transferTax +
    recordationTax +
    additionalCosts +
    renovations;
  const loanAmount = Math.max(0, homePrice - downPayment);
  const mortgage = calculateMonthlyPayment(loanAmount, rate, loanYears * 12);
  const monthlyRate = rate / 100 / 12;
  const monthlyTaxes = (homePrice * (propertyTaxPct / 100)) / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyMaintenance = (homePrice * (maintenancePct / 100)) / 12;
  const monthlyOwnershipCost =
    mortgage + monthlyTaxes + monthlyInsurance + monthlyMaintenance;
  let loanBalance = loanAmount;
  let renterPortfolio = initialCashNeeded;
  let buyerSurplusPortfolio = 0;
  let renterCumulativeInvested = initialCashNeeded;
  let buyerCumulativeInvested = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalTaxBenefit = 0;
  const yearZeroEquityAfterSale = Math.max(
    0,
    homePrice - loanAmount - homePrice * (sellingCostPct / 100),
  );
  const rows = [
    {
      year: 0,
      renterRentExpense: 0,
      renterInvested: 0,
      renterCumulative: Math.round(initialCashNeeded),
      renterEnding: Math.round(initialCashNeeded),
      buyerOutlay: Math.round(initialCashNeeded),
      buyerInvested: 0,
      buyerCumulative: 0,
      buyerEquity: Math.round(yearZeroEquityAfterSale),
      buyerEnding: Math.round(yearZeroEquityAfterSale),
      homeValue: Math.round(homePrice),
      loanBalance: Math.round(loanAmount),
      equityAfterSale: Math.round(yearZeroEquityAfterSale),
      buyerSurplusPortfolio: 0,
      buyingNetWorth: Math.round(yearZeroEquityAfterSale),
      rentingNetWorth: Math.round(initialCashNeeded),
    },
  ];
  for (let year = 1; year <= years; year++) {
    const currentRent = rent * safePow(1 + rentInflation / 100, year - 1);
    let annualRentPaid = 0;
    let annualInterest = 0;
    let annualPrincipal = 0;
    let annualTaxBenefit = 0;
    let annualOwnershipCost = 0;
    let renterAnnualInvested = 0;
    let buyerAnnualInvested = 0;
    for (let month = 1; month <= 12; month++) {
      const interest = loanBalance > 0 ? loanBalance * monthlyRate : 0;
      const principal =
        loanBalance > 0
          ? Math.min(Math.max(0, mortgage - interest), loanBalance)
          : 0;
      loanBalance = Math.max(0, loanBalance - principal);
      annualInterest += interest;
      annualPrincipal += principal;
      annualRentPaid += currentRent;
      annualOwnershipCost += monthlyOwnershipCost;
      const estimatedDeductible = annualInterest + monthlyTaxes * 12;
      const taxBenefit = includeTaxBenefit
        ? Math.max(0, estimatedDeductible - standardDeduction) *
          (incomeTaxRate / 100)
        : 0;
      annualTaxBenefit = taxBenefit;
      const buyerMonthlyOutflow = monthlyOwnershipCost - taxBenefit / 12;
      const renterContribution = Math.max(
        0,
        monthlyCashBeforeHousing - currentRent,
      );
      const buyerContribution = Math.max(
        0,
        monthlyCashBeforeHousing - buyerMonthlyOutflow,
      );
      renterAnnualInvested += renterContribution;
      buyerAnnualInvested += buyerContribution;
      renterPortfolio =
        renterPortfolio * (1 + marketReturn / 100 / 12) + renterContribution;
      buyerSurplusPortfolio =
        buyerSurplusPortfolio * (1 + marketReturn / 100 / 12) +
        buyerContribution;
    }
    totalPrincipalPaid += annualPrincipal;
    totalInterestPaid += annualInterest;
    totalTaxBenefit += annualTaxBenefit;
    renterCumulativeInvested += renterAnnualInvested;
    buyerCumulativeInvested += buyerAnnualInvested;
    const homeValue = homePrice * safePow(1 + appreciation / 100, year);
    const equityAfterSale = Math.max(
      0,
      homeValue - loanBalance - homeValue * (sellingCostPct / 100),
    );
    const buyingNetWorth = equityAfterSale + buyerSurplusPortfolio;
    rows.push({
      year,
      renterRentExpense: Math.round(annualRentPaid),
      renterInvested: Math.round(renterAnnualInvested),
      renterCumulative: Math.round(renterCumulativeInvested),
      renterEnding: Math.round(renterPortfolio),
      buyerOutlay: Math.round(annualOwnershipCost),
      buyerInvested: Math.round(buyerAnnualInvested),
      buyerCumulative: Math.round(buyerCumulativeInvested),
      buyerEquity: Math.round(equityAfterSale),
      buyerEnding: Math.round(buyingNetWorth),
      homeValue: Math.round(homeValue),
      loanBalance: Math.round(loanBalance),
      equityAfterSale: Math.round(equityAfterSale),
      buyerSurplusPortfolio: Math.round(buyerSurplusPortfolio),
      buyingNetWorth: Math.round(buyingNetWorth),
      rentingNetWorth: Math.round(renterPortfolio),
    });
  }
  const last = rows[rows.length - 1];
  const winner =
    last.buyingNetWorth > last.rentingNetWorth ? "Buying" : "Rent + Invest";
  return {
    rows,
    downPayment,
    buyingClosingCosts,
    transferTax,
    recordationTax,
    additionalCosts,
    initialCashNeeded,
    loanAmount,
    mortgage,
    monthlyTaxes,
    monthlyInsurance,
    monthlyMaintenance,
    monthlyOwnershipCost,
    totalPrincipalPaid,
    totalInterestPaid,
    totalTaxBenefit,
    winner,
    gap: Math.abs(last.buyingNetWorth - last.rentingNetWorth),
    buyingNetWorth: last.buyingNetWorth,
    rentingNetWorth: last.rentingNetWorth,
    equityAfterSale: last.equityAfterSale,
    buyerSurplusPortfolio: last.buyerSurplusPortfolio,
    endingHomeValue: last.homeValue,
    endingLoanBalance: last.loanBalance,
  };
}

function RentVsBuyCalculator() {
  const [homePrice, setHomePrice] = useCalculatorState(
    "rent-vs-buy",
    "homePrice",
    1000000,
  );
  const [downPaymentPct, setDownPaymentPct] = useCalculatorState(
    "rent-vs-buy",
    "downPaymentPct",
    20,
  );
  const [rate, setRate] = useCalculatorState("rent-vs-buy", "rate", 5.5);
  const [loanYears, setLoanYears] = useCalculatorState(
    "rent-vs-buy",
    "loanYears",
    30,
  );
  const [rent, setRent] = useCalculatorState("rent-vs-buy", "rent", 5000);
  const [monthlyCashBeforeHousing, setMonthlyCashBeforeHousing] =
    useCalculatorState("rent-vs-buy", "monthlyCashBeforeHousing", 10000);
  const [appreciation, setAppreciation] = useCalculatorState(
    "rent-vs-buy",
    "appreciation",
    4,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "rent-vs-buy",
    "marketReturn",
    10,
  );
  const [rentInflation, setRentInflation] = useCalculatorState(
    "rent-vs-buy",
    "rentInflation",
    2,
  );
  const [propertyTaxPct, setPropertyTaxPct] = useCalculatorState(
    "rent-vs-buy",
    "propertyTaxPct",
    1.1,
  );
  const [annualInsurance, setAnnualInsurance] = useCalculatorState(
    "rent-vs-buy",
    "annualInsurance",
    3600,
  );
  const [maintenancePct, setMaintenancePct] = useCalculatorState(
    "rent-vs-buy",
    "maintenancePct",
    1,
  );
  const [renovations, setRenovations] = useCalculatorState(
    "rent-vs-buy",
    "renovations",
    0,
  );
  const [buyingClosingCostPct, setBuyingClosingCostPct] = useCalculatorState(
    "rent-vs-buy",
    "buyingClosingCostPct",
    2.5,
  );
  const [transferTaxPct, setTransferTaxPct] = useCalculatorState(
    "rent-vs-buy",
    "transferTaxPct",
    0,
  );
  const [recordationTaxPct, setRecordationTaxPct] = useCalculatorState(
    "rent-vs-buy",
    "recordationTaxPct",
    0,
  );
  const [additionalCosts, setAdditionalCosts] = useCalculatorState(
    "rent-vs-buy",
    "additionalCosts",
    0,
  );
  const [sellingCostPct, setSellingCostPct] = useCalculatorState(
    "rent-vs-buy",
    "sellingCostPct",
    6,
  );
  const [years, setYears] = useCalculatorState("rent-vs-buy", "years", 30);
  const [incomeTaxRate, setIncomeTaxRate] = useCalculatorState(
    "rent-vs-buy",
    "incomeTaxRate",
    35,
  );
  const [standardDeduction, setStandardDeduction] = useCalculatorState(
    "rent-vs-buy",
    "standardDeduction",
    30000,
  );
  const [includeTaxBenefit, setIncludeTaxBenefit] = useCalculatorState(
    "rent-vs-buy",
    "includeTaxBenefit",
    true,
  );
  const [showEquityLine, setShowEquityLine] = useCalculatorState(
    "rent-vs-buy",
    "showEquityLine",
    false,
  );
  const [showHomeValueLine, setShowHomeValueLine] = useCalculatorState(
    "rent-vs-buy",
    "showHomeValueLine",
    false,
  );
  const [showCashFlowLine, setShowCashFlowLine] = useCalculatorState(
    "rent-vs-buy",
    "showCashFlowLine",
    false,
  );
  const [showTable, setShowTable] = useCalculatorState(
    "rent-vs-buy",
    "showTable",
    false,
  );
  const result = useMemo(
    () =>
      calculateRentVsBuyScenario({
        homePrice,
        downPaymentPct,
        rate,
        loanYears,
        rent,
        monthlyCashBeforeHousing,
        appreciation,
        marketReturn,
        rentInflation,
        propertyTaxPct,
        annualInsurance,
        maintenancePct,
        renovations,
        buyingClosingCostPct,
        transferTaxPct,
        recordationTaxPct,
        additionalCosts,
        sellingCostPct,
        years,
        incomeTaxRate,
        standardDeduction,
        includeTaxBenefit,
      }),
    [
      homePrice,
      downPaymentPct,
      rate,
      loanYears,
      rent,
      monthlyCashBeforeHousing,
      appreciation,
      marketReturn,
      rentInflation,
      propertyTaxPct,
      annualInsurance,
      maintenancePct,
      renovations,
      buyingClosingCostPct,
      transferTaxPct,
      recordationTaxPct,
      additionalCosts,
      sellingCostPct,
      years,
      incomeTaxRate,
      standardDeduction,
      includeTaxBenefit,
    ],
  );
  const chartData = result.rows.map((row) => ({
    year: row.year,
    "Rent + Invest": row.rentingNetWorth,
    Buying: row.buyingNetWorth,
    "Home Value": row.homeValue,
    "Equity After Sale": row.equityAfterSale,
    "Reinvested Buyer Surplus": row.buyerSurplusPortfolio,
  }));
  const winnerDetail =
    result.winner === "Buying"
      ? `by ${formatMoney(result.gap)} more than renting.`
      : `by ${formatMoney(result.gap)} more than buying.`;
  return (
    <CalculatorFrame
      title="Rent vs. Buy Calculator"
      description="A full rent-vs-buy model with transaction costs, ownership costs, tax assumptions, reinvested cash flow, payoff logic, and a year-by-year table."
      exportData={{ columns: RENT_VS_BUY_EXPORT_COLUMNS, rows: result.rows }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <SmallStat
            label="Winner"
            value={`${result.winner} wins`}
            detail={winnerDetail}
            tone={result.winner === "Buying" ? "green" : "blue"}
          />
          <SmallStat
            label="Buying result"
            value={formatCompactMoney(result.buyingNetWorth)}
            tone="green"
          />
          <SmallStat
            label="Rent + invest result"
            value={formatCompactMoney(result.rentingNetWorth)}
            tone="blue"
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={HomeIcon}
              title="Home purchase inputs"
              subtitle="Core purchase and mortgage assumptions."
            />
            <div className="space-y-4">
              <MoneyInput
                label="Home price"
                value={homePrice}
                onChange={setHomePrice}
                max={5000000}
                step={10000}
              />
              <PercentInput
                label="Down payment"
                value={downPaymentPct}
                onChange={setDownPaymentPct}
                min={0}
                max={60}
                helperText={`${formatMoney(result.downPayment)} cash into property`}
              />
              <PercentInput
                label="Mortgage rate"
                value={rate}
                onChange={setRate}
                min={0}
                max={12}
                helperText={`Monthly mortgage = ${formatMoney(result.mortgage)}`}
              />
              <PercentInput
                label="Home appreciation"
                value={appreciation}
                onChange={setAppreciation}
                min={-5}
                max={12}
                helperText={`Projected sale price: ${formatMoney(result.endingHomeValue)}`}
              />
              <RangeInput
                label="Loan term"
                value={loanYears}
                onChange={setLoanYears}
                min={10}
                max={30}
                step={5}
                suffix="yrs"
              />
              <RangeInput
                label="Comparison period"
                value={years}
                onChange={setYears}
                min={1}
                max={30}
                suffix="yrs"
              />
            </div>
          </Card>
          <Card className="min-h-[600px]">
            <SectionTitle
              icon={BarChartIcon}
              title="Long-term outcome"
              subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${years} years.`}
            />
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="Rent + Invest"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Buying"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  {showHomeValueLine && (
                    <Line
                      type="monotone"
                      dataKey="Home Value"
                      stroke="#d946ef"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {showEquityLine && (
                    <Line
                      type="monotone"
                      dataKey="Equity After Sale"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 4"
                    />
                  )}
                  {showCashFlowLine && (
                    <Line
                      type="monotone"
                      dataKey="Reinvested Buyer Surplus"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="3 5"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowEquityLine((value) => !value)}
                className={`rounded-full border px-3 py-2 ${showEquityLine ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-500"}`}
              >
                Equity after sale
              </button>
              <button
                type="button"
                onClick={() => setShowHomeValueLine((value) => !value)}
                className={`rounded-full border px-3 py-2 ${showHomeValueLine ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800" : "border-neutral-200 bg-white text-neutral-500"}`}
              >
                Home value
              </button>
              <button
                type="button"
                onClick={() => setShowCashFlowLine((value) => !value)}
                className={`rounded-full border px-3 py-2 ${showCashFlowLine ? "border-neutral-300 bg-neutral-100 text-neutral-900" : "border-neutral-200 bg-white text-neutral-500"}`}
              >
                Reinvested surplus cash flow
              </button>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={DollarIcon}
              title="Transaction & ownership costs"
              subtitle="Grouped separately so depth is preserved inside this calculator."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PercentInput
                label="Buying closing costs"
                value={buyingClosingCostPct}
                onChange={setBuyingClosingCostPct}
                min={0}
                max={10}
                helperText={formatMoney(result.buyingClosingCosts)}
              />
              <PercentInput
                label="Transfer tax"
                value={transferTaxPct}
                onChange={setTransferTaxPct}
                min={0}
                max={5}
                helperText={formatMoney(result.transferTax)}
              />
              <PercentInput
                label="Recordation tax"
                value={recordationTaxPct}
                onChange={setRecordationTaxPct}
                min={0}
                max={5}
                helperText={formatMoney(result.recordationTax)}
              />
              <MoneyInput
                label="Additional costs"
                value={additionalCosts}
                onChange={setAdditionalCosts}
                max={100000}
                step={1000}
              />
              <PercentInput
                label="Selling costs"
                value={sellingCostPct}
                onChange={setSellingCostPct}
                min={0}
                max={12}
                helperText={formatMoney(
                  result.endingHomeValue * (sellingCostPct / 100),
                )}
              />
              <PercentInput
                label="Property taxes"
                value={propertyTaxPct}
                onChange={setPropertyTaxPct}
                min={0}
                max={3}
                helperText={`${formatMoney(result.monthlyTaxes)} / month`}
              />
              <MoneyInput
                label="Annual insurance"
                value={annualInsurance}
                onChange={setAnnualInsurance}
                max={30000}
                step={100}
                helperText={`${formatMoney(result.monthlyInsurance)} / month`}
              />
              <PercentInput
                label="Maintenance"
                value={maintenancePct}
                onChange={setMaintenancePct}
                min={0}
                max={5}
                helperText={`${formatMoney(result.monthlyMaintenance)} / month`}
              />
              <MoneyInput
                label="Renovations"
                value={renovations}
                onChange={setRenovations}
                max={1000000}
                step={5000}
              />
            </div>
          </Card>
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Rent & market alternative"
              subtitle="Rental path and alternate investment assumptions."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Monthly rent"
                value={rent}
                onChange={setRent}
                max={30000}
                step={100}
              />
              <MoneyInput
                label="Monthly cash before housing costs"
                value={monthlyCashBeforeHousing}
                onChange={setMonthlyCashBeforeHousing}
                max={50000}
                step={500}
              />
              <PercentInput
                label="Rent inflation"
                value={rentInflation}
                onChange={setRentInflation}
                min={0}
                max={10}
              />
              <div className="md:col-span-2">
                <MarketReturnPicker
                  value={marketReturn}
                  onChange={setMarketReturn}
                />
              </div>
            </div>
          </Card>
        </div>
        <OwnershipCostSummary
          title="Ownership cost"
          subtitle="Today's monthly cash waterfall for the buyer path."
          startingLabel="Starting monthly cash before housing"
          startingAmount={monthlyCashBeforeHousing}
          items={[
            { label: "Less monthly mortgage", amount: result.mortgage },
            { label: "Less property taxes", amount: result.monthlyTaxes },
            { label: "Less insurance", amount: result.monthlyInsurance },
            { label: "Less maintenance", amount: result.monthlyMaintenance },
          ]}
          totalLabel="Monthly ownership cost"
          totalAmount={result.monthlyOwnershipCost}
          remainingLabel="Buyer cash left to invest today"
          remainingAmount={Math.max(
            0,
            monthlyCashBeforeHousing - result.monthlyOwnershipCost,
          )}
          note="This is a current-month view. The year-by-year table still uses the full model."
        />
        <Card>
          <SectionTitle
            icon={CalculatorIcon}
            title="Advanced assumptions"
            subtitle="Tax benefit assumptions."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <PercentInput
              label="Estimated marginal tax rate"
              value={incomeTaxRate}
              onChange={setIncomeTaxRate}
              min={0}
              max={55}
            />
            <MoneyInput
              label="Standard deduction estimate"
              value={standardDeduction}
              onChange={setStandardDeduction}
              max={100000}
              step={500}
            />
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
              <input
                type="checkbox"
                checked={includeTaxBenefit}
                onChange={(event) => setIncludeTaxBenefit(event.target.checked)}
                className="mt-1 h-4 w-4 accent-neutral-950"
              />
              <span>
                <strong className="text-neutral-950">
                  Include estimated tax benefit
                </strong>
                <br />
                Uses mortgage interest plus property tax above the standard
                deduction as a simplified estimate.
              </span>
            </label>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SectionTitle
              icon={BarChartIcon}
              title="Year-by-year comparison"
              subtitle="Full yearly output for buyer vs. renter."
            />
            <button
              type="button"
              onClick={() => setShowTable((value) => !value)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {showTable ? "Hide table" : "Show table"}
            </button>
          </div>
          {showTable && (
            <div className="mt-2 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200">
              <table className="w-full table-fixed border-separate border-spacing-0 text-left text-[11px] leading-tight">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-xs uppercase tracking-wide text-neutral-500">
                    <th
                      rowSpan={2}
                      className="border-b border-neutral-200 bg-neutral-50 px-2 py-2 align-middle text-neutral-700"
                    >
                      Year
                    </th>
                    <th
                      colSpan={4}
                      className="border-b border-l border-neutral-200 bg-sky-50 px-2 py-2 text-sky-800"
                    >
                      Renter path
                    </th>
                    <th
                      colSpan={5}
                      className="border-b border-l border-neutral-200 bg-emerald-50 px-2 py-2 text-emerald-800"
                    >
                      Buyer path
                    </th>
                  </tr>
                  <tr>
                    {RENT_VS_BUY_TABLE_COLUMNS.map((column, columnIndex) => (
                      <th
                        key={column}
                        className={`break-words border-b border-neutral-200 px-2 py-2 text-right ${columnIndex === 0 || columnIndex === 4 ? "border-l" : ""}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.year}>
                      <td className="border-b border-neutral-100 px-2 py-2 font-semibold">
                        {row.year}
                      </td>
                      <td className="border-b border-l border-neutral-200 px-2 py-2 text-right">
                        {formatCompactMoney(row.renterRentExpense)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.renterInvested)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.renterCumulative)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.renterEnding)}
                      </td>
                      <td className="border-b border-l border-neutral-200 px-2 py-2 text-right">
                        {formatCompactMoney(row.buyerOutlay)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.buyerInvested)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.buyerCumulative)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.buyerEquity)}
                      </td>
                      <td className="border-b border-neutral-100 px-2 py-2 text-right">
                        {formatCompactMoney(row.buyerEnding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function calculateRentalPropertyScenario({
  purchasePrice,
  monthlyRent,
  downPaymentPct,
  rate,
  appreciation,
  marketReturn,
  rentGrowth,
  vacancyPct,
  propertyTaxPct,
  annualInsurance,
  maintenancePct,
  managementPct,
  closingCostPct,
  sellingCostPct,
  years,
  cashFlowStrategy,
  reinvestLossCoverage,
  capexReserveMonthly = 0,
  expenseInflation = 0,
}) {
  const downPayment = purchasePrice * (downPaymentPct / 100);
  const closingCosts = purchasePrice * (closingCostPct / 100);
  const initialCashNeeded = downPayment + closingCosts;
  const loanAmount = Math.max(0, purchasePrice - downPayment);
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, rate, 360);
  const monthlyPropertyTax = (purchasePrice * (propertyTaxPct / 100)) / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyMaintenance = (purchasePrice * (maintenancePct / 100)) / 12;
  const managementMonthly = monthlyRent * (managementPct / 100);
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyPct / 100);
  const monthlyOperatingExpenses =
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyMaintenance +
    managementMonthly +
    capexReserveMonthly;
  const monthlyCashFlow =
    effectiveMonthlyRent - monthlyOperatingExpenses - monthlyMortgage;
  const annualNOI = (effectiveMonthlyRent - monthlyOperatingExpenses) * 12;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash =
    initialCashNeeded === 0 ? 0 : (annualCashFlow / initialCashNeeded) * 100;
  const capRate = purchasePrice === 0 ? 0 : (annualNOI / purchasePrice) * 100;
  const breakEvenRent =
    (monthlyMortgage +
      monthlyPropertyTax +
      monthlyInsurance +
      monthlyMaintenance +
      capexReserveMonthly) /
    Math.max(0.01, 1 - vacancyPct / 100 - managementPct / 100);
  let loanBalance = loanAmount;
  let cumulativeCashFlow = 0;
  let reinvestedCashFlow = 0;
  let marketInvestmentResult = initialCashNeeded;
  const rows = [];
  for (let year = 1; year <= years; year++) {
    const currentRent = monthlyRent * safePow(1 + rentGrowth / 100, year - 1);
    const currentEffectiveRent = currentRent * (1 - vacancyPct / 100);
    const currentOperatingExpenses =
      (monthlyPropertyTax +
        monthlyInsurance +
        monthlyMaintenance +
        capexReserveMonthly) *
        safePow(1 + expenseInflation / 100, year - 1) +
      currentRent * (managementPct / 100);
    const currentMonthlyCashFlow =
      currentEffectiveRent - currentOperatingExpenses - monthlyMortgage;
    for (let month = 1; month <= 12; month++) {
      const monthlyRate = rate / 100 / 12;
      const interest = loanBalance > 0 ? loanBalance * monthlyRate : 0;
      const principal =
        loanBalance > 0
          ? Math.min(Math.max(0, monthlyMortgage - interest), loanBalance)
          : 0;
      const positiveCashFlow = Math.max(0, currentMonthlyCashFlow);
      const lossCoverage = Math.max(0, -currentMonthlyCashFlow);
      const extraPrincipal =
        cashFlowStrategy === "paydown"
          ? Math.min(positiveCashFlow, Math.max(0, loanBalance - principal))
          : 0;
      loanBalance = Math.max(0, loanBalance - principal - extraPrincipal);
      reinvestedCashFlow =
        reinvestedCashFlow * (1 + marketReturn / 100 / 12) +
        (cashFlowStrategy === "reinvest" ? positiveCashFlow : 0);
      marketInvestmentResult =
        marketInvestmentResult * (1 + marketReturn / 100 / 12) +
        (reinvestLossCoverage ? lossCoverage : 0);
    }
    cumulativeCashFlow += currentMonthlyCashFlow * 12;
    const propertyValue = purchasePrice * safePow(1 + appreciation / 100, year);
    const equityAfterSale = Math.max(
      0,
      propertyValue * (1 - sellingCostPct / 100) - loanBalance,
    );
    const rentalPropertyProfit =
      equityAfterSale + cumulativeCashFlow + reinvestedCashFlow;
    rows.push({
      year,
      rentalPropertyProfit: Math.round(rentalPropertyProfit),
      marketInvestmentResult: Math.round(marketInvestmentResult),
      propertyValue: Math.round(propertyValue),
      equityAfterSale: Math.round(equityAfterSale),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      reinvestedCashFlow: Math.round(reinvestedCashFlow),
    });
  }
  const last = rows[rows.length - 1] || {
    rentalPropertyProfit: 0,
    marketInvestmentResult: 0,
    propertyValue: 0,
    equityAfterSale: 0,
    cumulativeCashFlow: 0,
    reinvestedCashFlow: 0,
  };
  const winner =
    last.rentalPropertyProfit > last.marketInvestmentResult
      ? "Rental Property Profit"
      : "Market Investment Result";
  const gap = Math.abs(last.rentalPropertyProfit - last.marketInvestmentResult);
  return {
    rows,
    downPayment,
    closingCosts,
    initialCashNeeded,
    loanAmount,
    monthlyMortgage,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyMaintenance,
    managementMonthly,
    effectiveMonthlyRent,
    monthlyOperatingExpenses,
    monthlyCashFlow,
    annualCashFlow,
    annualNOI,
    cashOnCash,
    capRate,
    breakEvenRent,
    endingPropertyValue: last.propertyValue,
    equityAfterSale: last.equityAfterSale,
    cumulativeCashFlow: last.cumulativeCashFlow,
    reinvestedCashFlow: last.reinvestedCashFlow,
    rentalPropertyProfit: last.rentalPropertyProfit,
    marketInvestmentResult: last.marketInvestmentResult,
    rentalVsAlt: last.rentalPropertyProfit - last.marketInvestmentResult,
    rentalAnnualized:
      initialCashNeeded > 0 && years > 0
        ? (safePow(
            Math.max(0, last.rentalPropertyProfit) / initialCashNeeded,
            1 / years,
          ) -
            1) *
          100
        : 0,
    winner,
    gap,
  };
}
function RentalPropertyCalculator({
  title = "Rental Property vs. Market Investment Calculator",
  description = "A cleaner grouped-layout version of the rental property calculator.",
}) {
  const [purchasePrice, setPurchasePrice] = useCalculatorState(
    "rental-property-2",
    "purchasePrice",
    750000,
  );
  const [monthlyRent, setMonthlyRent] = useCalculatorState(
    "rental-property-2",
    "monthlyRent",
    4500,
  );
  const [downPaymentPct, setDownPaymentPct] = useCalculatorState(
    "rental-property-2",
    "downPaymentPct",
    25,
  );
  const [rate, setRate] = useCalculatorState("rental-property-2", "rate", 6.75);
  const [appreciation, setAppreciation] = useCalculatorState(
    "rental-property-2",
    "appreciation",
    4,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "rental-property-2",
    "marketReturn",
    10,
  );
  const [rentGrowth, setRentGrowth] = useCalculatorState(
    "rental-property-2",
    "rentGrowth",
    2,
  );
  const [vacancyPct, setVacancyPct] = useCalculatorState(
    "rental-property-2",
    "vacancyPct",
    5,
  );
  const [propertyTaxPct, setPropertyTaxPct] = useCalculatorState(
    "rental-property-2",
    "propertyTaxPct",
    1.1,
  );
  const [annualInsurance, setAnnualInsurance] = useCalculatorState(
    "rental-property-2",
    "annualInsurance",
    3000,
  );
  const [maintenancePct, setMaintenancePct] = useCalculatorState(
    "rental-property-2",
    "maintenancePct",
    1,
  );
  const [managementPct, setManagementPct] = useCalculatorState(
    "rental-property-2",
    "managementPct",
    8,
  );
  const [closingCostPct, setClosingCostPct] = useCalculatorState(
    "rental-property-2",
    "closingCostPct",
    2.5,
  );
  const [sellingCostPct, setSellingCostPct] = useCalculatorState(
    "rental-property-2",
    "sellingCostPct",
    6,
  );
  const [years, setYears] = useCalculatorState(
    "rental-property-2",
    "years",
    30,
  );
  const [cashFlowStrategy, setCashFlowStrategy] = useCalculatorState(
    "rental-property-2",
    "cashFlowStrategy",
    "reinvest",
  );
  const [reinvestLossCoverage, setReinvestLossCoverage] = useCalculatorState(
    "rental-property-2",
    "reinvestLossCoverage",
    true,
  );
  const result = useMemo(
    () =>
      calculateRentalPropertyScenario({
        purchasePrice,
        monthlyRent,
        downPaymentPct,
        rate,
        appreciation,
        marketReturn,
        rentGrowth,
        vacancyPct,
        propertyTaxPct,
        annualInsurance,
        maintenancePct,
        managementPct,
        closingCostPct,
        sellingCostPct,
        years,
        cashFlowStrategy,
        reinvestLossCoverage,
      }),
    [
      purchasePrice,
      monthlyRent,
      downPaymentPct,
      rate,
      appreciation,
      marketReturn,
      rentGrowth,
      vacancyPct,
      propertyTaxPct,
      annualInsurance,
      maintenancePct,
      managementPct,
      closingCostPct,
      sellingCostPct,
      years,
      cashFlowStrategy,
      reinvestLossCoverage,
    ],
  );
  const winnerDetail =
    result.winner === "Rental Property Profit"
      ? `by ${formatMoney(result.gap)} more than market investing.`
      : `by ${formatMoney(result.gap)} more than the rental property.`;
  return (
    <CalculatorFrame
      title={title}
      description={description}
      exportData={{
        columns: RENTAL_PROPERTY_EXPORT_COLUMNS,
        rows: result.rows,
      }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <SmallStat
            label="Winner"
            value={`${result.winner} wins`}
            detail={winnerDetail}
            tone={result.winner === "Rental Property Profit" ? "green" : "blue"}
          />
          <SmallStat
            label="Rental Property Profit"
            value={formatCompactMoney(result.rentalPropertyProfit)}
            tone="green"
          />
          <SmallStat
            label="Market Investment Result"
            value={formatCompactMoney(result.marketInvestmentResult)}
            tone="blue"
          />
        </div>
        <div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={BuildingIcon}
              title="Main Assumptions"
              subtitle="Core purchase, financing, rent, timeline, and cash-flow strategy."
            />
            <div className="space-y-4">
              <MoneyInput
                label="Purchase price"
                value={purchasePrice}
                onChange={setPurchasePrice}
                max={2500000}
                step={10000}
              />
              <PercentInput
                label="Down payment"
                value={downPaymentPct}
                onChange={setDownPaymentPct}
                min={0}
                max={60}
                helperText={`${formatMoney(result.downPayment)} cash into property`}
              />
              <PercentInput
                label="Mortgage rate"
                value={rate}
                onChange={setRate}
                min={0}
                max={12}
                helperText={`Monthly mortgage = ${formatMoney(result.monthlyMortgage)}`}
              />
              <RangeInput
                label="Time horizon"
                value={years}
                onChange={setYears}
                min={1}
                max={30}
                suffix="yrs"
              />
              <MoneyInput
                label="Monthly rent"
                value={monthlyRent}
                onChange={setMonthlyRent}
                max={20000}
                step={100}
                helperText={`Break Even amount: ${formatMoney(result.breakEvenRent)}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashFlowStrategy("reinvest")}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${cashFlowStrategy === "reinvest" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}
                >
                  Reinvest cash flow
                </button>
                <button
                  type="button"
                  onClick={() => setCashFlowStrategy("paydown")}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${cashFlowStrategy === "paydown" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}
                >
                  Pay off loan
                </button>
              </div>
            </div>
          </Card>
          <Card className="flex min-h-[560px] flex-col">
            <SectionTitle
              icon={TrendingUpIcon}
              title="Rental property vs. market investment"
              subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${years} years.`}
            />
            <div className="min-h-[360px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="rentalPropertyProfit"
                    name="Rental Property Profit"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketInvestmentResult"
                    name="Market Investment Result"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={DollarIcon}
              title="Rental Expenses & Transaction Costs"
              subtitle="Operating costs, taxes, closing costs, and sale costs."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PercentInput
                label="Vacancy allowance"
                value={vacancyPct}
                onChange={setVacancyPct}
                min={0}
                max={25}
              />
              <PercentInput
                label="Property tax"
                value={propertyTaxPct}
                onChange={setPropertyTaxPct}
                min={0}
                max={3}
                helperText={`${formatMoney(result.monthlyPropertyTax)} / month`}
              />
              <MoneyInput
                label="Annual insurance"
                value={annualInsurance}
                onChange={setAnnualInsurance}
                max={20000}
                step={100}
                helperText={`${formatMoney(result.monthlyInsurance)} / month`}
              />
              <PercentInput
                label="Maintenance"
                value={maintenancePct}
                onChange={setMaintenancePct}
                min={0}
                max={5}
                helperText={`${formatMoney(result.monthlyMaintenance)} / month`}
              />
              <PercentInput
                label="Management"
                value={managementPct}
                onChange={setManagementPct}
                min={0}
                max={15}
                helperText={`${formatMoney(result.managementMonthly)} / month`}
              />
              <PercentInput
                label="Buying closing costs"
                value={closingCostPct}
                onChange={setClosingCostPct}
                min={0}
                max={10}
                helperText={formatMoney(result.closingCosts)}
              />
              <PercentInput
                label="Selling costs"
                value={sellingCostPct}
                onChange={setSellingCostPct}
                min={0}
                max={12}
              />
            </div>
          </Card>
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Investment & Growth Assumptions"
              subtitle="Market alternative, appreciation, rent growth, and loss coverage."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PercentInput
                label="Appreciation"
                value={appreciation}
                onChange={setAppreciation}
                min={-2}
                max={10}
              />
              <PercentInput
                label="Rent growth"
                value={rentGrowth}
                onChange={setRentGrowth}
                min={0}
                max={8}
              />
              <div className="md:col-span-2">
                <MarketReturnPicker
                  value={marketReturn}
                  onChange={setMarketReturn}
                />
              </div>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
              <input
                type="checkbox"
                checked={reinvestLossCoverage}
                onChange={(event) =>
                  setReinvestLossCoverage(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-neutral-950"
              />
              <span>
                <strong className="text-neutral-950">
                  Reinvest loss coverage
                </strong>
                <br />
                Treat negative cash flow coverage as part of the market
                alternative comparison.
              </span>
            </label>
          </Card>
        </div>
        <OwnershipCostSummary
          title="Ownership cost summary"
          subtitle="Today's monthly rent and expense waterfall for the rental property."
          startingLabel="Effective monthly rent"
          startingAmount={result.effectiveMonthlyRent}
          items={[
            { label: "Less monthly mortgage", amount: result.monthlyMortgage },
            { label: "Less property taxes", amount: result.monthlyPropertyTax },
            { label: "Less insurance", amount: result.monthlyInsurance },
            { label: "Less maintenance", amount: result.monthlyMaintenance },
            { label: "Less management", amount: result.managementMonthly },
          ]}
          totalLabel="Monthly ownership and operating costs"
          totalAmount={result.monthlyMortgage + result.monthlyOperatingExpenses}
          remainingLabel="Monthly cash flow today"
          remainingAmount={result.monthlyCashFlow}
          note="This is a current-month view. The full model still applies future rent growth, appreciation, and loan amortization."
        />
        <Card>
          <SectionTitle
            icon={BarChartIcon}
            title="Return Metrics"
            subtitle="Supporting metrics from the rental property path."
          />
          <div className="grid gap-4 md:grid-cols-4">
            <SmallStat
              label="Monthly cash flow"
              value={formatMoney(result.monthlyCashFlow)}
              tone={result.monthlyCashFlow >= 0 ? "green" : "amber"}
            />
            <SmallStat
              label="Break-even rent"
              value={formatMoney(result.breakEvenRent)}
            />
            <SmallStat
              label="Cash-on-cash"
              value={formatPercent(result.cashOnCash)}
            />
            <SmallStat label="Cap rate" value={formatPercent(result.capRate)} />
            <SmallStat
              label="Effective monthly rent"
              value={formatMoney(result.effectiveMonthlyRent)}
            />
            <SmallStat
              label="Net operating income"
              value={formatMoney(result.annualNOI)}
            />
            <SmallStat
              label="Equity after sale"
              value={formatCompactMoney(result.equityAfterSale)}
              tone="green"
            />
            <SmallStat
              label="Ending property value"
              value={formatCompactMoney(result.endingPropertyValue)}
              tone="green"
            />
          </div>
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function AutoCostCalculator() {
  const [yearsOwned, setYearsOwned] = useCalculatorState(
    "auto-cost",
    "yearsOwned",
    10,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "auto-cost",
    "marketReturn",
    10,
  );
  const [equalizedPrice, setEqualizedPrice] = useCalculatorState(
    "auto-cost",
    "equalizedPrice",
    45000,
  );
  const [usedPrice, setUsedPrice] = useCalculatorState(
    "auto-cost",
    "usedPrice",
    28000,
  );
  const [usedDownPayment, setUsedDownPayment] = useCalculatorState(
    "auto-cost",
    "usedDownPayment",
    20,
  );
  const [usedTradeInValue, setUsedTradeInValue] = useCalculatorState(
    "auto-cost",
    "usedTradeInValue",
    0,
  );
  const [usedRate, setUsedRate] = useCalculatorState(
    "auto-cost",
    "usedRate",
    6.5,
  );
  const [usedLoanMonths, setUsedLoanMonths] = useCalculatorState(
    "auto-cost",
    "usedLoanMonths",
    60,
  );
  const [usedDepreciation, setUsedDepreciation] = useCalculatorState(
    "auto-cost",
    "usedDepreciation",
    10,
  );
  const [usedInsurance, setUsedInsurance] = useCalculatorState(
    "auto-cost",
    "usedInsurance",
    1800,
  );
  const [usedMaintenance, setUsedMaintenance] = useCalculatorState(
    "auto-cost",
    "usedMaintenance",
    1600,
  );
  const [usedRegistration, setUsedRegistration] = useCalculatorState(
    "auto-cost",
    "usedRegistration",
    350,
  );
  const [usedFuel, setUsedFuel] = useCalculatorState(
    "auto-cost",
    "usedFuel",
    2400,
  );
  const [newPrice, setNewPrice] = useCalculatorState(
    "auto-cost",
    "newPrice",
    48000,
  );
  const [newDownPayment, setNewDownPayment] = useCalculatorState(
    "auto-cost",
    "newDownPayment",
    20,
  );
  const [newTradeInValue, setNewTradeInValue] = useCalculatorState(
    "auto-cost",
    "newTradeInValue",
    0,
  );
  const [newRate, setNewRate] = useCalculatorState("auto-cost", "newRate", 6.5);
  const [newLoanMonths, setNewLoanMonths] = useCalculatorState(
    "auto-cost",
    "newLoanMonths",
    60,
  );
  const [newDepreciation, setNewDepreciation] = useCalculatorState(
    "auto-cost",
    "newDepreciation",
    15,
  );
  const [newInsurance, setNewInsurance] = useCalculatorState(
    "auto-cost",
    "newInsurance",
    2400,
  );
  const [newMaintenance, setNewMaintenance] = useCalculatorState(
    "auto-cost",
    "newMaintenance",
    900,
  );
  const [newRegistration, setNewRegistration] = useCalculatorState(
    "auto-cost",
    "newRegistration",
    550,
  );
  const [newFuel, setNewFuel] = useCalculatorState(
    "auto-cost",
    "newFuel",
    2400,
  );
  const [leaseCarValue, setLeaseCarValue] = useCalculatorState(
    "auto-cost",
    "leaseCarValue",
    45000,
  );
  const [leaseDueAtSigning, setLeaseDueAtSigning] = useCalculatorState(
    "auto-cost",
    "leaseDueAtSigning",
    4000,
  );
  const [leaseMonthlyPayment, setLeaseMonthlyPayment] = useCalculatorState(
    "auto-cost",
    "leaseMonthlyPayment",
    550,
  );
  const [leaseInsurance, setLeaseInsurance] = useCalculatorState(
    "auto-cost",
    "leaseInsurance",
    2400,
  );
  const [leaseMaintenance, setLeaseMaintenance] = useCalculatorState(
    "auto-cost",
    "leaseMaintenance",
    500,
  );
  const [leaseRegistration, setLeaseRegistration] = useCalculatorState(
    "auto-cost",
    "leaseRegistration",
    550,
  );
  const [leaseFuel, setLeaseFuel] = useCalculatorState(
    "auto-cost",
    "leaseFuel",
    2400,
  );
  const [leaseDispositionFee, setLeaseDispositionFee] = useCalculatorState(
    "auto-cost",
    "leaseDispositionFee",
    500,
  );
  const [leaseResidualPct, setLeaseResidualPct] = useCalculatorState(
    "auto-cost",
    "leaseResidualPct",
    55,
  );
  const [leasePostBuyoutDepreciation, setLeasePostBuyoutDepreciation] =
    useCalculatorState("auto-cost", "leasePostBuyoutDepreciation", 10);
  const [leaseBuyoutAtEnd, setLeaseBuyoutAtEnd] = useCalculatorState(
    "auto-cost",
    "leaseBuyoutAtEnd",
    false,
  );
  const used = useMemo(
    () =>
      calculateAutoScenario({
        price: usedPrice,
        downPaymentPct: usedDownPayment,
        tradeInValue: usedTradeInValue,
        rate: usedRate,
        loanTermMonths: usedLoanMonths,
        yearsOwned,
        depreciationPct: usedDepreciation,
        annualInsurance: usedInsurance,
        annualMaintenance: usedMaintenance,
        annualRegistration: usedRegistration,
        annualFuel: usedFuel,
      }),
    [
      usedPrice,
      usedDownPayment,
      usedTradeInValue,
      usedRate,
      usedLoanMonths,
      yearsOwned,
      usedDepreciation,
      usedInsurance,
      usedMaintenance,
      usedRegistration,
      usedFuel,
    ],
  );
  const newer = useMemo(
    () =>
      calculateAutoScenario({
        price: newPrice,
        downPaymentPct: newDownPayment,
        tradeInValue: newTradeInValue,
        rate: newRate,
        loanTermMonths: newLoanMonths,
        yearsOwned,
        depreciationPct: newDepreciation,
        annualInsurance: newInsurance,
        annualMaintenance: newMaintenance,
        annualRegistration: newRegistration,
        annualFuel: newFuel,
      }),
    [
      newPrice,
      newDownPayment,
      newTradeInValue,
      newRate,
      newLoanMonths,
      yearsOwned,
      newDepreciation,
      newInsurance,
      newMaintenance,
      newRegistration,
      newFuel,
    ],
  );
  const lease = useMemo(
    () =>
      calculateLeaseScenario({
        carValue: leaseCarValue,
        dueAtSigning: leaseDueAtSigning,
        monthlyPayment: leaseMonthlyPayment,
        yearsOwned,
        annualInsurance: leaseInsurance,
        annualMaintenance: leaseMaintenance,
        annualRegistration: leaseRegistration,
        annualFuel: leaseFuel,
        dispositionFee: leaseDispositionFee,
        residualPct: leaseResidualPct,
        buyoutAtEnd: leaseBuyoutAtEnd,
        postBuyoutDepreciationPct: leasePostBuyoutDepreciation,
      }),
    [
      leaseCarValue,
      leaseDueAtSigning,
      leaseMonthlyPayment,
      yearsOwned,
      leaseInsurance,
      leaseMaintenance,
      leaseRegistration,
      leaseFuel,
      leaseDispositionFee,
      leaseResidualPct,
      leasePostBuyoutDepreciation,
      leaseBuyoutAtEnd,
    ],
  );
  const comparison = useMemo(
    () =>
      calculateAutoInvestmentComparison({
        used,
        newer,
        lease,
        yearsOwned,
        marketReturn,
      }),
    [used, newer, lease, yearsOwned, marketReturn],
  );
  const autoCostRows = useMemo(
    () =>
      AUTO_COST_TABLE_YEARS.map((yearOption) => {
        const usedRow = calculateAutoScenario({
          price: usedPrice,
          downPaymentPct: usedDownPayment,
          tradeInValue: usedTradeInValue,
          rate: usedRate,
          loanTermMonths: usedLoanMonths,
          yearsOwned: yearOption,
          depreciationPct: usedDepreciation,
          annualInsurance: usedInsurance,
          annualMaintenance: usedMaintenance,
          annualRegistration: usedRegistration,
          annualFuel: usedFuel,
        });
        const newRow = calculateAutoScenario({
          price: newPrice,
          downPaymentPct: newDownPayment,
          tradeInValue: newTradeInValue,
          rate: newRate,
          loanTermMonths: newLoanMonths,
          yearsOwned: yearOption,
          depreciationPct: newDepreciation,
          annualInsurance: newInsurance,
          annualMaintenance: newMaintenance,
          annualRegistration: newRegistration,
          annualFuel: newFuel,
        });
        const leaseRow = calculateLeaseScenario({
          carValue: leaseCarValue,
          dueAtSigning: leaseDueAtSigning,
          monthlyPayment: leaseMonthlyPayment,
          yearsOwned: yearOption,
          annualInsurance: leaseInsurance,
          annualMaintenance: leaseMaintenance,
          annualRegistration: leaseRegistration,
          annualFuel: leaseFuel,
          dispositionFee: leaseDispositionFee,
          residualPct: leaseResidualPct,
          buyoutAtEnd: leaseBuyoutAtEnd,
          postBuyoutDepreciationPct: leasePostBuyoutDepreciation,
        });
        const investment = calculateAutoInvestmentComparison({
          used: usedRow,
          newer: newRow,
          lease: leaseRow,
          yearsOwned: yearOption,
          marketReturn,
        });
        return {
          years: yearOption,
          used: usedRow,
          newer: newRow,
          lease: leaseRow,
          investment,
        };
      }),
    [
      usedPrice,
      usedDownPayment,
      usedTradeInValue,
      usedRate,
      usedLoanMonths,
      usedDepreciation,
      usedInsurance,
      usedMaintenance,
      usedRegistration,
      usedFuel,
      newPrice,
      newDownPayment,
      newTradeInValue,
      newRate,
      newLoanMonths,
      newDepreciation,
      newInsurance,
      newMaintenance,
      newRegistration,
      newFuel,
      leaseCarValue,
      leaseDueAtSigning,
      leaseMonthlyPayment,
      leaseInsurance,
      leaseMaintenance,
      leaseRegistration,
      leaseFuel,
      leaseDispositionFee,
      leaseResidualPct,
      leasePostBuyoutDepreciation,
      leaseBuyoutAtEnd,
      marketReturn,
    ],
  );
  const autoCostExportRows = useMemo(
    () =>
      autoCostRows.flatMap((row) => [
        {
          years: row.years,
          option: "Used",
          totalCashOut: Math.round(row.used.totalCashOut),
          resaleValue: Math.round(row.used.resaleValue),
          netCost: Math.round(row.used.netCost),
          savedCashInvested: Math.round(row.investment.used.savedCashInvested),
          investmentGrowth: Math.round(row.investment.used.investmentGrowth),
          investmentValue: Math.round(row.investment.used.investmentValue),
          outcome: Math.round(row.investment.used.outcome),
        },
        {
          years: row.years,
          option: "New",
          totalCashOut: Math.round(row.newer.totalCashOut),
          resaleValue: Math.round(row.newer.resaleValue),
          netCost: Math.round(row.newer.netCost),
          savedCashInvested: Math.round(row.investment.newer.savedCashInvested),
          investmentGrowth: Math.round(row.investment.newer.investmentGrowth),
          investmentValue: Math.round(row.investment.newer.investmentValue),
          outcome: Math.round(row.investment.newer.outcome),
        },
        {
          years: row.years,
          option: "Lease",
          totalCashOut: Math.round(row.lease.totalCashOut),
          resaleValue: Math.round(row.lease.resaleValue),
          netCost: Math.round(row.lease.netCost),
          savedCashInvested: Math.round(row.investment.lease.savedCashInvested),
          investmentGrowth: Math.round(row.investment.lease.investmentGrowth),
          investmentValue: Math.round(row.investment.lease.investmentValue),
          outcome: Math.round(row.investment.lease.outcome),
        },
      ]),
    [autoCostRows],
  );
  const winner = comparison.winner;
  const equalizePurchasePrices = () => {
    setUsedPrice(equalizedPrice);
    setNewPrice(equalizedPrice);
    setLeaseCarValue(equalizedPrice);
  };
  return (
    <CalculatorFrame
      title="New Car vs. Used Car vs. Leased Car Calculator"
      description="Compare the estimated cost of buying a used car, buying a new car, or leasing."
      exportData={{
        columns: AUTO_COST_EXPORT_COLUMNS,
        rows: autoCostExportRows,
      }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <SmallStat
            label="Better outcome"
            value={`${winner.label} wins`}
            detail={`by ${formatMoney(comparison.gap)} after investing savings.`}
            tone={
              winner.id === "used"
                ? "blue"
                : winner.id === "new"
                  ? "green"
                  : "amber"
            }
          />
          <SmallStat
            label="Used car outcome"
            value={formatCompactMoney(comparison.used.outcome)}
            detail={`${formatMoney(comparison.used.investedSavings)} invested savings`}
            tone="blue"
          />
          <SmallStat
            label="New car outcome"
            value={formatCompactMoney(comparison.newer.outcome)}
            detail={`${formatMoney(comparison.newer.investedSavings)} invested savings`}
            tone="green"
          />
          <SmallStat
            label="Lease outcome"
            value={formatCompactMoney(comparison.lease.outcome)}
            detail={`${formatMoney(comparison.lease.investedSavings)} invested savings`}
            tone="amber"
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={CarIcon}
              title="Comparison period"
              subtitle="Choose how long you plan to own the vehicle."
            />
            <RangeInput
              label="Years owned"
              value={yearsOwned}
              onChange={setYearsOwned}
              min={1}
              max={12}
              suffix="yrs"
              helperText="Defaults to a 10-year comparison period."
            />
          </Card>
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Index fund alternative"
              subtitle="Any monthly savings from the cheaper car are invested at this return."
            />
            <MarketReturnPicker
              value={marketReturn}
              onChange={setMarketReturn}
            />
          </Card>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <AutoInputCard
            title="Used car"
            color="blue"
            price={usedPrice}
            setPrice={setUsedPrice}
            downPayment={usedDownPayment}
            setDownPayment={setUsedDownPayment}
            tradeInValue={usedTradeInValue}
            setTradeInValue={setUsedTradeInValue}
            rate={usedRate}
            setRate={setUsedRate}
            loanMonths={usedLoanMonths}
            setLoanMonths={setUsedLoanMonths}
            depreciation={usedDepreciation}
            setDepreciation={setUsedDepreciation}
            insurance={usedInsurance}
            setInsurance={setUsedInsurance}
            maintenance={usedMaintenance}
            setMaintenance={setUsedMaintenance}
            registration={usedRegistration}
            setRegistration={setUsedRegistration}
            fuel={usedFuel}
            setFuel={setUsedFuel}
            result={used}
          />
          <AutoInputCard
            title="New car"
            color="green"
            price={newPrice}
            setPrice={setNewPrice}
            downPayment={newDownPayment}
            setDownPayment={setNewDownPayment}
            tradeInValue={newTradeInValue}
            setTradeInValue={setNewTradeInValue}
            rate={newRate}
            setRate={setNewRate}
            loanMonths={newLoanMonths}
            setLoanMonths={setNewLoanMonths}
            depreciation={newDepreciation}
            setDepreciation={setNewDepreciation}
            insurance={newInsurance}
            setInsurance={setNewInsurance}
            maintenance={newMaintenance}
            setMaintenance={setNewMaintenance}
            registration={newRegistration}
            setRegistration={setNewRegistration}
            fuel={newFuel}
            setFuel={setNewFuel}
            result={newer}
          />
          <LeaseInputCard
            carValue={leaseCarValue}
            setCarValue={setLeaseCarValue}
            dueAtSigning={leaseDueAtSigning}
            setDueAtSigning={setLeaseDueAtSigning}
            monthlyPayment={leaseMonthlyPayment}
            setMonthlyPayment={setLeaseMonthlyPayment}
            insurance={leaseInsurance}
            setInsurance={setLeaseInsurance}
            maintenance={leaseMaintenance}
            setMaintenance={setLeaseMaintenance}
            registration={leaseRegistration}
            setRegistration={setLeaseRegistration}
            fuel={leaseFuel}
            setFuel={setLeaseFuel}
            dispositionFee={leaseDispositionFee}
            setDispositionFee={setLeaseDispositionFee}
            residualPct={leaseResidualPct}
            setResidualPct={setLeaseResidualPct}
            postBuyoutDepreciation={leasePostBuyoutDepreciation}
            setPostBuyoutDepreciation={setLeasePostBuyoutDepreciation}
            buyoutAtEnd={leaseBuyoutAtEnd}
            setBuyoutAtEnd={setLeaseBuyoutAtEnd}
            result={lease}
          />
        </div>
        <Card>
          <SectionTitle
            icon={CarIcon}
            title="Equalize vehicle price"
            subtitle="Set a common vehicle price for Used, New, and Lease before reviewing the 3, 5, and 10 year table."
          />
          <MoneyInput
            label="Equalized vehicle price"
            value={equalizedPrice}
            onChange={setEqualizedPrice}
            max={200000}
            step={1000}
          />
          <button
            type="button"
            onClick={equalizePurchasePrices}
            className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-50"
          >
            Apply equalized price to all auto options
          </button>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Sets the used purchase price, new purchase price, and lease car
            value to the selected amount.
          </p>
        </Card>
        <AutoCostTimelineTable rows={autoCostRows} />
      </div>
    </CalculatorFrame>
  );
}
function AutoCostTimelineTable({ rows }) {
  const options = [
    { key: "used", label: "Used" },
    { key: "newer", label: "New" },
    { key: "lease", label: "Lease" },
  ];
  return (
    <Card>
      <SectionTitle
        icon={BarChartIcon}
        title="3, 5, and 10 Year Cost Comparison"
        subtitle="Estimated total cash out, resale value, and net cost for each auto option."
      />
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0 text-left text-xs leading-tight">
          <thead className="bg-white">
            <tr className="uppercase tracking-wide text-neutral-500">
              <th className="w-[8%] border-b border-neutral-200 px-3 py-2">
                Years
              </th>
              <th className="w-[12%] border-b border-neutral-200 px-3 py-2">
                Option
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Total Cash Out
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Resale
              </th>
              <th className="w-[13.33%] border-b border-r border-neutral-300 px-3 py-2 text-right">
                Net Cost
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Saved Cash Invested
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Investment Growth
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Investment Value
              </th>
              <th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">
                Net Outcome
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row) => {
              const bestNetCost = Math.min(
                ...options.map((option) => row[option.key].netCost),
              );
              return [
                <tr key={`${row.years}-group`}>
                  <td
                    colSpan={9}
                    className="bg-neutral-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-600"
                  >
                    {row.years} year comparison
                  </td>
                </tr>,
                ...options.map((option) => {
                  const data = row[option.key];
                  const investment =
                    option.key === "used"
                      ? row.investment.used
                      : option.key === "newer"
                        ? row.investment.newer
                        : row.investment.lease;
                  const isBest = data.netCost === bestNetCost;
                  const bestOutcome =
                    row.investment.winner.id === investment.id;
                  return (
                    <tr key={`${row.years}-${option.key}`}>
                      <td className="border-b border-neutral-100 px-3 py-2 font-semibold text-neutral-400"></td>
                      <td className="border-b border-neutral-100 px-3 py-2 font-semibold text-neutral-950">
                        {option.label}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatCost(data.totalCashOut)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(data.resaleValue)}
                      </td>
                      <td
                        className={`border-b border-r border-neutral-300 px-3 py-2 text-right font-bold ${isBest ? "bg-emerald-50 text-emerald-800" : "text-neutral-950"}`}
                      >
                        {formatCost(data.netCost)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(investment.savedCashInvested)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(investment.investmentGrowth)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(investment.investmentValue)}
                      </td>
                      <td
                        className={`border-b px-3 py-2 text-right font-bold ${bestOutcome ? "border-sky-200 bg-sky-50 text-sky-800" : "border-neutral-100 text-neutral-950"}`}
                      >
                        {formatMoney(investment.outcome)}
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
function AutoInputCard({
  title,
  color,
  price,
  setPrice,
  downPayment,
  setDownPayment,
  tradeInValue,
  setTradeInValue,
  rate,
  setRate,
  loanMonths,
  setLoanMonths,
  depreciation,
  setDepreciation,
  insurance,
  setInsurance,
  maintenance,
  setMaintenance,
  registration,
  setRegistration,
  fuel,
  setFuel,
  result,
}) {
  return (
    <Card className="flex h-full flex-col">
      <SectionTitle
        icon={CarIcon}
        title={title}
        subtitle="Purchase, financing, depreciation, and annual ownership costs."
      />
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <MoneyInput
            label="Purchase price"
            value={price}
            onChange={setPrice}
            max={200000}
            step={1000}
          />
          <PercentInput
            label="Down payment"
            value={downPayment}
            onChange={setDownPayment}
            min={0}
            max={100}
            helperText={`${formatMoney(result.downPayment)} cash down; ${formatMoney(result.effectiveDownPayment)} total down incl. trade-in`}
          />
          <MoneyInput
            label="Trade-in value"
            value={tradeInValue}
            onChange={setTradeInValue}
            max={100000}
            step={500}
            helperText={`${formatMoney(result.loanAmount)} financed`}
          />
          <PercentInput
            label="Loan rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={25}
            helperText={`${formatMoney(result.monthlyPayment)} / month`}
          />
          <RangeInput
            label="Loan term"
            value={loanMonths}
            onChange={setLoanMonths}
            min={12}
            max={84}
            step={12}
            suffix="mo"
          />
        </div>
        <AdditionalCostsSection>
          <PercentInput
            label="Annual depreciation"
            value={depreciation}
            onChange={setDepreciation}
            min={0}
            max={40}
            helperText={`${formatMoney(result.resaleValue)} estimated resale value`}
          />
          <MoneyInput
            label="Annual insurance"
            value={insurance}
            onChange={setInsurance}
            max={10000}
            step={100}
          />
          <MoneyInput
            label="Annual maintenance"
            value={maintenance}
            onChange={setMaintenance}
            max={15000}
            step={100}
          />
          <MoneyInput
            label="Annual registration / taxes"
            value={registration}
            onChange={setRegistration}
            max={5000}
            step={50}
          />
          <MoneyInput
            label="Annual fuel / charging"
            value={fuel}
            onChange={setFuel}
            max={12000}
            step={100}
          />
        </AdditionalCostsSection>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SmallStat
          label="Total cash out"
          value={formatMoney(result.totalCashOut)}
        />
        <SmallStat
          label="Estimated resale"
          value={formatMoney(result.resaleValue)}
        />
        <SmallStat
          label="Net cost"
          value={formatMoney(result.netCost)}
          tone={color}
        />
        <SmallStat
          label="Monthly payment"
          value={formatMoney(result.monthlyPayment)}
        />
      </div>
    </Card>
  );
}
function LeaseInputCard({
  carValue,
  setCarValue,
  dueAtSigning,
  setDueAtSigning,
  monthlyPayment,
  setMonthlyPayment,
  insurance,
  setInsurance,
  maintenance,
  setMaintenance,
  registration,
  setRegistration,
  fuel,
  setFuel,
  dispositionFee,
  setDispositionFee,
  residualPct,
  setResidualPct,
  postBuyoutDepreciation,
  setPostBuyoutDepreciation,
  buyoutAtEnd,
  setBuyoutAtEnd,
  result,
}) {
  return (
    <Card className="flex h-full flex-col">
      <SectionTitle
        icon={CarIcon}
        title="Lease"
        subtitle="Due at signing, monthly lease payment, annual lease costs, and optional buyout."
      />
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <MoneyInput
            label="Car value"
            value={carValue}
            onChange={setCarValue}
            max={200000}
            step={1000}
          />
          <MoneyInput
            label="Due at signing"
            value={dueAtSigning}
            onChange={setDueAtSigning}
            max={50000}
            step={500}
          />
          <MoneyInput
            label="Monthly lease payment"
            value={monthlyPayment}
            onChange={setMonthlyPayment}
            max={3000}
            step={25}
          />
          <MoneyInput
            label="Lease disposition fee"
            value={dispositionFee}
            onChange={setDispositionFee}
            max={3000}
            step={50}
          />
          <PercentInput
            label="Residual value"
            value={residualPct}
            onChange={setResidualPct}
            min={10}
            max={90}
            helperText={`${formatMoney(result.residualValue)} estimated buyout price at lease end`}
          />
          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
            <input
              type="checkbox"
              checked={buyoutAtEnd}
              onChange={(event) => setBuyoutAtEnd(event.target.checked)}
              className="mt-1 h-4 w-4 accent-neutral-950"
            />
            <span>
              <strong className="text-neutral-950">
                Buy out lease at residual value
              </strong>
              <br />
              Adds the residual as a buyout cost, then assumes the bought-out
              vehicle depreciates and is sold at the end of the comparison
              period.
            </span>
          </label>
        </div>
        <AdditionalCostsSection>
          <PercentInput
            label="Annual depreciation"
            value={postBuyoutDepreciation}
            onChange={setPostBuyoutDepreciation}
            min={0}
            max={40}
            helperText={`${formatMoney(result.buyoutResaleValue)} estimated resale after buyout`}
          />
          <MoneyInput
            label="Annual insurance"
            value={insurance}
            onChange={setInsurance}
            max={10000}
            step={100}
          />
          <MoneyInput
            label="Annual maintenance"
            value={maintenance}
            onChange={setMaintenance}
            max={15000}
            step={100}
          />
          <MoneyInput
            label="Annual registration / taxes"
            value={registration}
            onChange={setRegistration}
            max={5000}
            step={50}
          />
          <MoneyInput
            label="Annual fuel / charging"
            value={fuel}
            onChange={setFuel}
            max={12000}
            step={100}
          />
        </AdditionalCostsSection>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SmallStat
          label="Total cash out"
          value={formatMoney(result.totalCashOut)}
        />
        <SmallStat
          label="Estimated resale"
          value={formatMoney(result.resaleValue)}
        />
        <SmallStat
          label="Net cost"
          value={formatMoney(result.netCost)}
          tone="amber"
        />
        <SmallStat label="Buyout cost" value={formatMoney(result.buyoutCost)} />
      </div>
    </Card>
  );
}

function calculateHomeValueScenario({
  homePrice,
  salePrice,
  downPaymentPct,
  rate,
  loanTerm,
  yearsHeld,
  monthlyRent,
  marketReturn,
  rentInflation,
  propertyTaxPct,
  insuranceAnnual,
  maintenancePct,
  renovations,
  closingCostPct,
  transferTaxPct = 0,
  recordationTaxPct = 0,
  additionalCosts = 0,
  sellingCostPct,
}) {
  const downPayment = homePrice * (downPaymentPct / 100);
  const buyingClosingCosts = homePrice * (closingCostPct / 100);
  const transferTax = homePrice * (transferTaxPct / 100);
  const recordationTax = homePrice * (recordationTaxPct / 100);
  const initialCash =
    downPayment +
    buyingClosingCosts +
    transferTax +
    recordationTax +
    additionalCosts +
    renovations;
  const loanAmount = Math.max(0, homePrice - downPayment);
  const mortgage = calculateMonthlyPayment(loanAmount, rate, loanTerm * 12);
  const monthlyRate = rate / 100 / 12;
  const monthlyPropertyTax = (homePrice * (propertyTaxPct / 100)) / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = (homePrice * (maintenancePct / 100)) / 12;
  const monthlyOwnershipCost =
    mortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance;
  const impliedAnnualAppreciation =
    yearsHeld > 0 && homePrice > 0
      ? safePow(salePrice / homePrice, 1 / yearsHeld) - 1
      : 0;
  let mortgageBalance = loanAmount;
  let marketPortfolio = initialCash;
  let renterSurplusPortfolio = 0;
  let buyerSurplusPortfolio = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  const rows = [
    {
      year: 0,
      homeValueResult: Math.round(initialCash),
      marketInvestmentResult: Math.round(initialCash),
      homeValue: Math.round(homePrice),
      equityAfterSale: Math.round(
        Math.max(
          0,
          homePrice - homePrice * (sellingCostPct / 100) - loanAmount,
        ),
      ),
      mortgageBalance: Math.round(loanAmount),
      annualRentAvoided: 0,
      houseAdvantage: 0,
    },
  ];
  for (let year = 1; year <= yearsHeld; year++) {
    const currentRent =
      monthlyRent * safePow(1 + rentInflation / 100, year - 1);
    let annualPrincipal = 0;
    let annualInterest = 0;
    let annualRentAvoided = 0;
    for (let month = 1; month <= 12; month++) {
      const interest = mortgageBalance > 0 ? mortgageBalance * monthlyRate : 0;
      const principal =
        mortgageBalance > 0
          ? Math.min(Math.max(0, mortgage - interest), mortgageBalance)
          : 0;
      mortgageBalance = Math.max(0, mortgageBalance - principal);
      annualPrincipal += principal;
      annualInterest += interest;
      annualRentAvoided += currentRent;
      marketPortfolio *= 1 + marketReturn / 100 / 12;
      renterSurplusPortfolio =
        renterSurplusPortfolio * (1 + marketReturn / 100 / 12) +
        Math.max(0, monthlyOwnershipCost - currentRent);
      buyerSurplusPortfolio =
        buyerSurplusPortfolio * (1 + marketReturn / 100 / 12) +
        Math.max(0, currentRent - monthlyOwnershipCost);
    }
    totalPrincipalPaid += annualPrincipal;
    totalInterestPaid += annualInterest;
    const homeValue = homePrice * safePow(1 + impliedAnnualAppreciation, year);
    const equityAfterSale = Math.max(
      0,
      homeValue - homeValue * (sellingCostPct / 100) - mortgageBalance,
    );
    const homeValueResult = equityAfterSale + buyerSurplusPortfolio;
    const marketInvestmentResult = marketPortfolio + renterSurplusPortfolio;
    rows.push({
      year,
      homeValueResult: Math.round(homeValueResult),
      marketInvestmentResult: Math.round(marketInvestmentResult),
      homeValue: Math.round(homeValue),
      equityAfterSale: Math.round(equityAfterSale),
      mortgageBalance: Math.round(mortgageBalance),
      annualRentAvoided: Math.round(annualRentAvoided),
      houseAdvantage: Math.round(homeValueResult - marketInvestmentResult),
    });
  }
  const last = rows[rows.length - 1];
  const winner =
    last.homeValueResult > last.marketInvestmentResult ? "House" : "Market";
  return {
    rows,
    downPayment,
    buyingClosingCosts,
    transferTax,
    recordationTax,
    additionalCosts,
    initialCash,
    loanAmount,
    mortgage,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyMaintenance,
    monthlyOwnershipCost,
    sellingCosts: last.homeValue * (sellingCostPct / 100),
    totalTransactionAndOwnershipCosts:
      buyingClosingCosts +
      transferTax +
      recordationTax +
      additionalCosts +
      last.homeValue * (sellingCostPct / 100) +
      (monthlyPropertyTax + monthlyInsurance + monthlyMaintenance) * 12 +
      renovations,
    totalPrincipalPaid,
    totalInterestPaid,
    netSaleProceeds: last.equityAfterSale,
    mortgageBalance: last.mortgageBalance,
    winner,
    gap: Math.abs(last.homeValueResult - last.marketInvestmentResult),
    houseResult: last.homeValueResult,
    marketResult: last.marketInvestmentResult,
    homeValue: last.homeValue,
    impliedAnnualAppreciation: impliedAnnualAppreciation * 100,
  };
}
function HomeValueCalculator() {
  const [homePrice, setHomePrice] = useCalculatorState(
    "home-value-vs-market",
    "homePrice",
    1800000,
  );
  const [salePrice, setSalePrice] = useCalculatorState(
    "home-value-vs-market",
    "salePrice",
    3000000,
  );
  const [downPaymentPct, setDownPaymentPct] = useCalculatorState(
    "home-value-vs-market",
    "downPaymentPct",
    20,
  );
  const [rate, setRate] = useCalculatorState(
    "home-value-vs-market",
    "rate",
    5.65,
  );
  const [loanTerm, setLoanTerm] = useCalculatorState(
    "home-value-vs-market",
    "loanTerm",
    30,
  );
  const [yearsHeld, setYearsHeld] = useCalculatorState(
    "home-value-vs-market",
    "yearsHeld",
    30,
  );
  const [monthlyRent, setMonthlyRent] = useCalculatorState(
    "home-value-vs-market",
    "monthlyRent",
    6200,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "home-value-vs-market",
    "marketReturn",
    10,
  );
  const [rentInflation, setRentInflation] = useCalculatorState(
    "home-value-vs-market",
    "rentInflation",
    2,
  );
  const [propertyTaxPct, setPropertyTaxPct] = useCalculatorState(
    "home-value-vs-market",
    "propertyTaxPct",
    1.1,
  );
  const [insuranceAnnual, setInsuranceAnnual] = useCalculatorState(
    "home-value-vs-market",
    "insuranceAnnual",
    3600,
  );
  const [maintenancePct, setMaintenancePct] = useCalculatorState(
    "home-value-vs-market",
    "maintenancePct",
    1,
  );
  const [renovations, setRenovations] = useCalculatorState(
    "home-value-vs-market",
    "renovations",
    0,
  );
  const [closingCostPct, setClosingCostPct] = useCalculatorState(
    "home-value-vs-market",
    "closingCostPct",
    2.5,
  );
  const [transferTaxPct, setTransferTaxPct] = useCalculatorState(
    "home-value-vs-market",
    "transferTaxPct",
    0,
  );
  const [recordationTaxPct, setRecordationTaxPct] = useCalculatorState(
    "home-value-vs-market",
    "recordationTaxPct",
    0,
  );
  const [additionalCosts, setAdditionalCosts] = useCalculatorState(
    "home-value-vs-market",
    "additionalCosts",
    0,
  );
  const [sellingCostPct, setSellingCostPct] = useCalculatorState(
    "home-value-vs-market",
    "sellingCostPct",
    6,
  );
  const result = useMemo(
    () =>
      calculateHomeValueScenario({
        homePrice,
        salePrice,
        downPaymentPct,
        rate,
        loanTerm,
        yearsHeld,
        monthlyRent,
        marketReturn,
        rentInflation,
        propertyTaxPct,
        insuranceAnnual,
        maintenancePct,
        renovations,
        closingCostPct,
        transferTaxPct,
        recordationTaxPct,
        additionalCosts,
        sellingCostPct,
      }),
    [
      homePrice,
      salePrice,
      downPaymentPct,
      rate,
      loanTerm,
      yearsHeld,
      monthlyRent,
      marketReturn,
      rentInflation,
      propertyTaxPct,
      insuranceAnnual,
      maintenancePct,
      renovations,
      closingCostPct,
      transferTaxPct,
      recordationTaxPct,
      additionalCosts,
      sellingCostPct,
    ],
  );
  const winnerDetail =
    result.winner === "House"
      ? `by ${formatMoney(result.gap)} more than market investing.`
      : `by ${formatMoney(result.gap)} more than the house.`;
  return (
    <CalculatorFrame
      title="Home Value vs. Market Investment Calculator"
      description="Compare buying a home against putting the same starting cash and monthly savings into the market."
      exportData={{ columns: HOME_VALUE_EXPORT_COLUMNS, rows: result.rows }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <SmallStat
            label="Winner"
            value={`${result.winner} wins`}
            detail={winnerDetail}
            tone={result.winner === "House" ? "green" : "blue"}
          />
          <SmallStat
            label="Home Value Result"
            value={formatCompactMoney(result.houseResult)}
            tone="green"
          />
          <SmallStat
            label="Market Investment Result"
            value={formatCompactMoney(result.marketResult)}
            tone="blue"
          />
        </div>
        <div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={ScaleIcon}
              title="Main Assumptions"
              subtitle="Home price, expected sale price, financing, and hold period."
            />
            <div className="space-y-4">
              <MoneyInput
                label="Home price"
                value={homePrice}
                onChange={setHomePrice}
                max={5000000}
                step={10000}
              />
              <MoneyInput
                label="Sale price"
                value={salePrice}
                onChange={setSalePrice}
                max={8000000}
                step={10000}
                helperText={`Implied appreciation: ${formatPercent(result.impliedAnnualAppreciation)} / year`}
              />
              <PercentInput
                label="Down payment"
                value={downPaymentPct}
                onChange={setDownPaymentPct}
                min={0}
                max={50}
                helperText={`${formatMoney(result.downPayment)} cash into property`}
              />
              <PercentInput
                label="Mortgage rate"
                value={rate}
                onChange={setRate}
                min={0}
                max={10}
                helperText={`Monthly mortgage = ${formatMoney(result.mortgage)}`}
              />
              <RangeInput
                label="Years held"
                value={yearsHeld}
                onChange={setYearsHeld}
                min={1}
                max={30}
                suffix="yrs"
              />
              <RangeInput
                label="Loan term"
                value={loanTerm}
                onChange={setLoanTerm}
                min={10}
                max={30}
                step={5}
                suffix="yrs"
              />
            </div>
          </Card>
          <Card className="flex min-h-[560px] flex-col">
            <SectionTitle
              icon={BarChartIcon}
              title="Home value vs. market investment"
              subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${yearsHeld} years.`}
            />
            <div className="min-h-[360px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="homeValueResult"
                    name="Home Value Result"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketInvestmentResult"
                    name="Market Investment Result"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={DollarIcon}
              title="Transaction & Ownership Costs"
              subtitle="Closing costs, sale costs, maintenance, taxes, insurance, and improvements."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PercentInput
                label="Buying closing costs"
                value={closingCostPct}
                onChange={setClosingCostPct}
                min={0}
                max={8}
                helperText={formatMoney(result.buyingClosingCosts)}
              />
              <PercentInput
                label="Transfer tax"
                value={transferTaxPct}
                onChange={setTransferTaxPct}
                min={0}
                max={5}
                helperText={formatMoney(result.transferTax)}
              />
              <PercentInput
                label="Recordation tax"
                value={recordationTaxPct}
                onChange={setRecordationTaxPct}
                min={0}
                max={5}
                helperText={formatMoney(result.recordationTax)}
              />
              <MoneyInput
                label="Additional costs"
                value={additionalCosts}
                onChange={setAdditionalCosts}
                max={100000}
                step={1000}
              />
              <PercentInput
                label="Selling costs"
                value={sellingCostPct}
                onChange={setSellingCostPct}
                min={0}
                max={10}
                helperText={formatMoney(result.sellingCosts)}
              />
              <PercentInput
                label="Maintenance"
                value={maintenancePct}
                onChange={setMaintenancePct}
                min={0}
                max={4}
                helperText={`${formatMoney(result.monthlyMaintenance)} / month`}
              />
              <PercentInput
                label="Property taxes"
                value={propertyTaxPct}
                onChange={setPropertyTaxPct}
                min={0}
                max={3}
                helperText={`${formatMoney(result.monthlyPropertyTax)} / month`}
              />
              <MoneyInput
                label="Annual insurance"
                value={insuranceAnnual}
                onChange={setInsuranceAnnual}
                max={20000}
                step={100}
                helperText={`${formatMoney(result.monthlyInsurance)} / month`}
              />
              <MoneyInput
                label="Renovations / improvements"
                value={renovations}
                onChange={setRenovations}
                max={1000000}
                step={5000}
              />
            </div>
          </Card>
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Rent & Market Investment Alternative"
              subtitle="Rent avoided by owning and alternate market return assumptions."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Monthly rent if you did not own"
                value={monthlyRent}
                onChange={setMonthlyRent}
                max={20000}
                step={100}
              />
              <PercentInput
                label="Annual rent inflation"
                value={rentInflation}
                onChange={setRentInflation}
                min={0}
                max={8}
              />
              <div className="md:col-span-2">
                <MarketReturnPicker
                  value={marketReturn}
                  onChange={setMarketReturn}
                />
              </div>
            </div>
          </Card>
        </div>
        <OwnershipCostSummary
          title="Ownership cost summary"
          subtitle="Today's monthly cash waterfall for the home value path."
          startingLabel="Monthly rent if you did not own"
          startingAmount={monthlyRent}
          items={[
            { label: "Less monthly mortgage", amount: result.mortgage },
            { label: "Less property taxes", amount: result.monthlyPropertyTax },
            { label: "Less insurance", amount: result.monthlyInsurance },
            { label: "Less maintenance", amount: result.monthlyMaintenance },
          ]}
          totalLabel="Monthly ownership cost"
          totalAmount={result.monthlyOwnershipCost}
          remainingLabel="Buyer surplus vs. renting today"
          remainingAmount={Math.max(
            0,
            monthlyRent - result.monthlyOwnershipCost,
          )}
          note="This is a current-month comparison."
        />
        <Card>
          <SectionTitle
            icon={BarChartIcon}
            title="Year-by-Year Comparison"
            subtitle="This shows estimated equity after sale versus the rent-and-invest alternative each year."
          />
          <div className="mt-2 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-tight">
              <thead className="sticky top-0 bg-white">
                <tr className="uppercase tracking-wide text-neutral-500">
                  {HOME_VALUE_YEAR_TABLE_COLUMNS.map((column) => (
                    <th
                      key={column}
                      className="break-words border-b border-neutral-200 px-3 py-2"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year}>
                    <td className="border-b border-neutral-100 px-3 py-2 font-semibold">
                      {row.year}
                    </td>
                    <td>{formatCompactMoney(row.homeValue)}</td>
                    <td>{formatCompactMoney(row.mortgageBalance)}</td>
                    <td>{formatCompactMoney(row.equityAfterSale)}</td>
                    <td>{formatCompactMoney(row.annualRentAvoided)}</td>
                    <td>{formatCompactMoney(row.marketInvestmentResult)}</td>
                    <td>{formatCompactMoney(row.houseAdvantage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function makeCollegeChildren(count, currentChildren = []) {
  return Array.from(
    { length: count },
    (_, index) =>
      currentChildren[index] || {
        id: `child-${index + 1}`,
        currentGrade:
          index === 0 ? 0 : index === 1 ? 2 : Math.max(-1, 2 - index * 2),
      },
  );
}
function calculateCollegeSavingsScenario({
  children,
  startingAmount,
  monthlyContribution,
  annualTuition,
  annualBoard,
  marketReturn,
  inflation,
}) {
  const monthlyRate = marketReturn / 100 / 12;
  const annualCollegeCost = annualTuition + annualBoard;
  const childPlans = children.map((child, index) => {
    const firstJulyMonth = 2 + Math.max(0, 12 - child.currentGrade) * 12;
    return {
      ...child,
      id: child.id || `child-${index + 1}`,
      name: `Child ${index + 1}`,
      firstJulyMonth,
      finalMonth: firstJulyMonth + 36,
    };
  });
  const horizonMonths = Math.max(
    12,
    ...childPlans.map((child) => child.finalMonth),
  );
  const accounts = childPlans.map((child) => ({
    ...child,
    balance: startingAmount,
    contributions: startingAmount,
    interest: 0,
    withdrawn: 0,
    shortfall: 0,
  }));
  const rows = [
    {
      year: 0,
      month: 0,
      combinedBalance: Math.round(startingAmount * accounts.length),
      combinedWithdrawn: 0,
      combinedContributions: Math.round(startingAmount * accounts.length),
      combinedInterest: 0,
      yearlySchoolCost: 0,
      shortfall: 0,
      ...Object.fromEntries(
        accounts.map((account) => [account.name, Math.round(account.balance)]),
      ),
      ...Object.fromEntries(
        accounts.map((account) => [`${account.name} School Cost`, 0]),
      ),
    },
  ];

  for (let month = 1; month <= horizonMonths; month++) {
    const schoolCosts = {};
    accounts.forEach((account) => {
      if (month <= account.finalMonth) {
        account.balance += monthlyContribution;
        account.contributions += monthlyContribution;
      }
      const interest = account.balance * monthlyRate;
      account.balance = Math.max(0, account.balance + interest);
      account.interest += interest;
      const collegeYear = [0, 12, 24, 36].findIndex(
        (offset) => month === account.firstJulyMonth + offset,
      );
      if (collegeYear >= 0) {
        const inflatedCost =
          annualCollegeCost * safePow(1 + inflation / 100, month / 12);
        schoolCosts[account.name] = inflatedCost;
        let remainingCost = inflatedCost;
        const ownWithdrawal = Math.min(account.balance, remainingCost);
        account.balance -= ownWithdrawal;
        account.withdrawn += ownWithdrawal;
        remainingCost -= ownWithdrawal;
        if (remainingCost > 0) {
          accounts.forEach((sourceAccount) => {
            if (sourceAccount.id === account.id || remainingCost <= 0) return;
            const sharedWithdrawal = Math.min(
              sourceAccount.balance,
              remainingCost,
            );
            sourceAccount.balance -= sharedWithdrawal;
            sourceAccount.withdrawn += sharedWithdrawal;
            remainingCost -= sharedWithdrawal;
          });
        }
        account.shortfall += Math.max(0, remainingCost);
      }
    });
    const combinedBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    const combinedWithdrawn = accounts.reduce(
      (sum, account) => sum + account.withdrawn,
      0,
    );
    const combinedContributions = accounts.reduce(
      (sum, account) => sum + account.contributions,
      0,
    );
    const combinedInterest = accounts.reduce(
      (sum, account) => sum + account.interest,
      0,
    );
    const yearlySchoolCost = Object.values(schoolCosts).reduce(
      (sum, cost) => sum + cost,
      0,
    );
    const shortfall = accounts.reduce(
      (sum, account) => sum + account.shortfall,
      0,
    );
    rows.push({
      year: Number((month / 12).toFixed(1)),
      month,
      combinedBalance: Math.round(combinedBalance),
      combinedWithdrawn: Math.round(combinedWithdrawn),
      combinedContributions: Math.round(combinedContributions),
      combinedInterest: Math.round(combinedInterest),
      yearlySchoolCost: Math.round(yearlySchoolCost),
      shortfall: Math.round(shortfall),
      ...Object.fromEntries(
        accounts.map((account) => [account.name, Math.round(account.balance)]),
      ),
      ...Object.fromEntries(
        accounts.map((account) => [
          `${account.name} School Cost`,
          Math.round(schoolCosts[account.name] || 0),
        ]),
      ),
    });
  }
  const last = rows[rows.length - 1];
  const peakBalance = Math.max(...rows.map((row) => row.combinedBalance));
  const rawEndingBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const rawShortfall = accounts.reduce(
    (sum, account) => sum + account.shortfall,
    0,
  );
  return {
    rows,
    accounts: accounts.map((account) => ({
      ...account,
      balance: Math.round(account.balance),
      contributions: Math.round(account.contributions),
      interest: Math.round(account.interest),
      withdrawn: Math.round(account.withdrawn),
      shortfall: Math.round(account.shortfall),
    })),
    endingBalance: last.combinedBalance,
    peakBalance: Math.round(peakBalance),
    totalWithdrawn: last.combinedWithdrawn,
    totalContributions: last.combinedContributions,
    totalInterest: last.combinedInterest,
    shortfall: last.shortfall,
    rawEndingBalance,
    rawShortfall,
    horizonYears: Number((horizonMonths / 12).toFixed(1)),
  };
}
function findCollegeZeroBalanceContribution({
  children,
  startingAmount,
  annualTuition,
  annualBoard,
  marketReturn,
  inflation,
}) {
  const scenarioFor = (monthlyContribution) =>
    calculateCollegeSavingsScenario({
      children,
      startingAmount,
      monthlyContribution,
      annualTuition,
      annualBoard,
      marketReturn,
      inflation,
    });
  const isFunded = (scenario) => scenario.rawShortfall <= 0.01;
  const zeroContributionScenario = scenarioFor(0);
  if (isFunded(zeroContributionScenario)) return 0;
  let low = 0;
  let high = 100;
  while (!isFunded(scenarioFor(high)) && high < 100000) high *= 2;
  for (let index = 0; index < 48; index++) {
    const mid = (low + high) / 2;
    if (isFunded(scenarioFor(mid))) high = mid;
    else low = mid;
  }
  return Math.ceil(high * 10000) / 10000;
}
function SchoolYearSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-800">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(parseNumber(event.target.value))}
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-950"
      >
        {SCHOOL_YEAR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
function CollegeSavingsCalculator() {
  const [childCount, setChildCount] = useCalculatorState(
    "college-savings",
    "childCount",
    2,
  );
  const [children, setChildren] = useCalculatorState(
    "college-savings",
    "children",
    () => makeCollegeChildren(2),
  );
  const [annualTuition, setAnnualTuition] = useCalculatorState(
    "college-savings",
    "annualTuition",
    35000,
  );
  const [annualBoard, setAnnualBoard] = useCalculatorState(
    "college-savings",
    "annualBoard",
    18000,
  );
  const [startingAmount, setStartingAmount] = useCalculatorState(
    "college-savings",
    "startingAmount",
    25000,
  );
  const [monthlyContribution, setMonthlyContribution] = useCalculatorState(
    "college-savings",
    "monthlyContribution",
    750,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "college-savings",
    "marketReturn",
    10,
  );
  const [inflation, setInflation] = useCalculatorState(
    "college-savings",
    "inflation",
    4,
  );
  const [showTable, setShowTable] = useCalculatorState(
    "college-savings",
    "showTable",
    false,
  );
  const setSafeChildCount = (nextCount) => {
    const count = clampNumber(parseNumber(nextCount), 1, 6);
    setChildCount(count);
    setChildren((current) => makeCollegeChildren(count, current));
  };
  const updateChildGrade = (index, currentGrade) =>
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index ? { ...child, currentGrade } : child,
      ),
    );
  const setZeroEndingContribution = () =>
    setMonthlyContribution(
      findCollegeZeroBalanceContribution({
        children,
        startingAmount,
        annualTuition,
        annualBoard,
        marketReturn,
        inflation,
      }),
    );
  const result = useMemo(
    () =>
      calculateCollegeSavingsScenario({
        children,
        startingAmount,
        monthlyContribution,
        annualTuition,
        annualBoard,
        marketReturn,
        inflation,
      }),
    [
      children,
      startingAmount,
      monthlyContribution,
      annualTuition,
      annualBoard,
      marketReturn,
      inflation,
    ],
  );
  const exportColumns = useMemo(
    () => [
      ...COLLEGE_SAVINGS_EXPORT_COLUMNS,
      ...result.accounts.map((account) => ({
        header: `${account.name} Balance`,
        key: account.name,
      })),
    ],
    [result.accounts],
  );
  return (
    <CalculatorFrame
      title="College Savings Calculator"
      description="Project education savings by child, with monthly contributions, index-return assumptions, tuition and board inflation, and lump-sum July withdrawals for each college year."
      exportData={{ columns: exportColumns, rows: result.rows }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <SmallStat
            label="Ending combined balance"
            value={formatCompactMoney(result.endingBalance)}
            tone={result.shortfall > 0 ? "amber" : "green"}
          />
          <SmallStat
            label="College costs paid"
            value={formatCompactMoney(result.totalWithdrawn)}
            tone="blue"
          />
          <SmallStat
            label="Investment growth"
            value={formatCompactMoney(result.totalInterest)}
            tone="green"
          />
          <SmallStat
            label="Uncovered shortfall"
            value={formatCompactMoney(result.shortfall)}
            tone={result.shortfall > 0 ? "amber" : "neutral"}
          />
        </div>
        <div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={GraduationIcon}
              title="Family & school timing"
              subtitle="Each child gets a separate account, using the same starting amount and monthly contribution."
            />
            <div className="space-y-4">
              <RangeInput
                label="# of children"
                value={childCount}
                onChange={setSafeChildCount}
                min={1}
                max={6}
                suffix=""
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {children.map((child, index) => (
                  <SchoolYearSelect
                    key={child.id}
                    label={`Child ${index + 1} current year`}
                    value={child.currentGrade}
                    onChange={(grade) => updateChildGrade(index, grade)}
                  />
                ))}
              </div>
              <MoneyInput
                label="Starting amount per child"
                value={startingAmount}
                onChange={setStartingAmount}
                max={500000}
                step={1000}
              />
              <MoneyInput
                label="Monthly contribution per child"
                value={monthlyContribution}
                onChange={setMonthlyContribution}
                max={10000}
                step={50}
                displayValue={numberFormatter.format(
                  Math.round(monthlyContribution),
                )}
              />
              <button
                type="button"
                onClick={setZeroEndingContribution}
                className="w-full rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
              >
                End account with $0
              </button>
            </div>
          </Card>
          <Card className="flex min-h-[560px] flex-col">
            <SectionTitle
              icon={BarChartIcon}
              title="Combined account value"
              subtitle={`Combined balances across ${childCount} ${childCount === 1 ? "child" : "children"} over ${result.horizonYears} years.`}
            />
            <div className="h-[360px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="combinedBalance"
                    name="Combined Balance"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="combinedWithdrawn"
                    name="Cumulative Withdrawals"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="yearlySchoolCost"
                    name="Yearly School Cost"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                  {result.shortfall > 0 && (
                    <Line
                      type="monotone"
                      dataKey="shortfall"
                      name="Shortfall"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={false}
                      strokeOpacity={0.6}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={DollarIcon}
              title="College cost assumptions"
              subtitle="Enter tuition and board in today's dollars. Future July withdrawals inflate from these current costs."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Annual tuition"
                value={annualTuition}
                onChange={setAnnualTuition}
                max={150000}
                step={1000}
              />
              <MoneyInput
                label="Annual board"
                value={annualBoard}
                onChange={setAnnualBoard}
                max={75000}
                step={500}
              />
              <PercentInput
                label="Education inflation"
                value={inflation}
                onChange={setInflation}
                min={0}
                max={12}
                helperText="Applied to each future July withdrawal."
              />
              <div>
                <div className="text-sm font-medium text-neutral-800">
                  Current annual cost
                </div>
                <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-950">
                  {formatMoney(annualTuition + annualBoard)}
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Investment assumptions"
            />
            <MarketReturnPicker
              value={marketReturn}
              onChange={setMarketReturn}
            />
          </Card>
        </div>
        <Card>
          <SectionTitle
            icon={BarChartIcon}
            title="Individual account values"
            subtitle="Separate balance lines show each child's savings rising with contributions and falling after July withdrawals."
          />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={CHART_AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  tickFormatter={formatCompactMoney}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                {result.accounts.map((account, index) => (
                  <Line
                    key={account.name}
                    type="monotone"
                    dataKey={account.name}
                    name={account.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                  />
                ))}
                {result.accounts.map((account, index) => (
                  <Line
                    key={`${account.name}-school-cost`}
                    type="stepAfter"
                    dataKey={`${account.name} School Cost`}
                    name={`${account.name} School Cost`}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SectionTitle
              icon={CalculatorIcon}
              title="Child account summary"
              subtitle="Balances, contributions, earnings, withdrawals, and any uncovered college cost."
            />
            <button
              type="button"
              onClick={() => setShowTable((value) => !value)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {showTable ? "Hide monthly table" : "Show monthly table"}
            </button>
          </div>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {result.accounts.map((account) => (
              <div
                key={account.name}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="text-sm font-bold text-neutral-950">
                  {account.name}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <span className="text-neutral-500">Ending balance</span>
                  <strong className="text-right">
                    {formatMoney(account.balance)}
                  </strong>
                  <span className="text-neutral-500">Contributed</span>
                  <strong className="text-right">
                    {formatMoney(account.contributions)}
                  </strong>
                  <span className="text-neutral-500">Interest earned</span>
                  <strong className="text-right">
                    {formatMoney(account.interest)}
                  </strong>
                  <span className="text-neutral-500">Withdrawn</span>
                  <strong className="text-right">
                    {formatMoney(account.withdrawn)}
                  </strong>
                  <span className="text-neutral-500">Shortfall</span>
                  <strong className="text-right">
                    {formatMoney(account.shortfall)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          {showTable && (
            <div className="mt-4 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200">
              <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-tight">
                <thead className="sticky top-0 bg-white">
                  <tr className="uppercase tracking-wide text-neutral-500">
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Year
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Combined
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Withdrawn
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Interest
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Shortfall
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows
                    .filter((row) => row.month % 12 === 0 || row.month === 0)
                    .map((row) => (
                      <tr key={row.month}>
                        <td className="border-b border-neutral-100 px-3 py-2 font-semibold">
                          {row.year}
                        </td>
                        <td className="border-b border-neutral-100 px-3 py-2">
                          {formatCompactMoney(row.combinedBalance)}
                        </td>
                        <td className="border-b border-neutral-100 px-3 py-2">
                          {formatCompactMoney(row.combinedWithdrawn)}
                        </td>
                        <td className="border-b border-neutral-100 px-3 py-2">
                          {formatCompactMoney(row.combinedInterest)}
                        </td>
                        <td className="border-b border-neutral-100 px-3 py-2">
                          {formatCompactMoney(row.shortfall)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function makeGenerationalChildren(count, currentChildren = []) {
  return Array.from(
    { length: count },
    (_, index) =>
      currentChildren[index] || {
        id: `gen-child-${index + 1}`,
        age: index === 0 ? 7 : index === 1 ? 5 : Math.max(0, 7 - index * 2),
        currentGrade: index === 0 ? 2 : index === 1 ? 0 : Math.max(-1, index),
      },
  );
}
function calculateGenerationalSavingsScenario({
  children,
  startingAmount,
  monthlyContribution,
  marketReturn,
  inflation,
  carCost,
  annualTuition,
  annualBoard,
  annualPostgradTuition,
  annualPostgradBoard,
  postgradYears,
  downPayment,
  downPaymentAge = 25,
  advancedTracking = false,
  startingAmount529Pct = 100,
  monthlyContribution529Pct = 100,
  plan529Return = marketReturn,
  currentAge = 40,
  currentSalary = 120000,
  retirementAge = 65,
  retirementSalary = 80000,
}) {
  const brokerageMonthlyRate = marketReturn / 100 / 12;
  const plan529MonthlyRate =
    (advancedTracking ? plan529Return : marketReturn) / 100 / 12;
  const starting529Share = advancedTracking
    ? clampNumber(startingAmount529Pct, 0, 100) / 100
    : 0;
  const contribution529Share = advancedTracking
    ? clampNumber(monthlyContribution529Pct, 0, 100) / 100
    : 0;
  const childPlans = children.map((child, index) => {
    const name = `Child ${index + 1}`;
    const carMonth = Math.max(0, (16 - child.age) * 12);
    const collegeStartMonth = Math.max(0, (12 - child.currentGrade) * 12 + 2);
    const postgradStartMonth = collegeStartMonth + 48;
    const homeMonth = Math.max(0, (downPaymentAge - child.age) * 12);
    const educationEvents = [
      ...[0, 12, 24, 36].map((offset, year) => ({
        key: "College",
        label: `College: Year ${year + 1}`,
        month: collegeStartMonth + offset,
        cost: annualTuition + annualBoard,
      })),
      ...Array.from({ length: postgradYears }, (_, year) => ({
        key: "Postgrad",
        label: `Postgrad: Year ${year + 1}`,
        month: postgradStartMonth + year * 12,
        cost: annualPostgradTuition + annualPostgradBoard,
      })),
    ];
    const events = [
      { key: "Car", label: "Car", month: carMonth, cost: carCost },
      ...educationEvents,
      {
        key: "Down Payment",
        label: "Home down payment",
        month: homeMonth,
        cost: downPayment,
      },
    ];
    return {
      ...child,
      id: child.id || `gen-child-${index + 1}`,
      name,
      events,
      finalEducationMonth: Math.max(
        ...educationEvents.map((event) => event.month),
      ),
      finalMonth: Math.max(...events.map((event) => event.month)),
    };
  });
  const finalEducationMonth = Math.max(
    ...childPlans.map((child) => child.finalEducationMonth),
  );
  const horizonMonths = Math.max(
    12,
    ...childPlans.map((child) => child.finalMonth),
  );
  const accounts = childPlans.map((child) => ({
    ...child,
    plan529Balance: startingAmount * starting529Share,
    brokerageBalance: startingAmount * (1 - starting529Share),
    balance: startingAmount,
    contributions: startingAmount,
    interest: 0,
    withdrawn: 0,
    brokerageTaxPaid: 0,
    shortfall: 0,
    carPaid: 0,
    collegePaid: 0,
    postgradPaid: 0,
    downPaymentPaid: 0,
  }));
  const yearlyAccountRows = [];
  let activeYear = 1;
  let yearlyAccounts = accounts.map((account) => ({
    name: account.name,
    startingBalance: account.balance,
    contributions: 0,
    earnings: 0,
    milestoneExpenses: 0,
    withdrawals: 0,
  }));
  const pushYearlyAccountRows = () => {
    yearlyAccounts.forEach((yearlyAccount, index) => {
      yearlyAccountRows.push({
        year: activeYear,
        child: yearlyAccount.name,
        startingBalance: Math.round(yearlyAccount.startingBalance),
        contributions: Math.round(yearlyAccount.contributions),
        earnings: Math.round(yearlyAccount.earnings),
        milestoneExpenses: Math.round(yearlyAccount.milestoneExpenses),
        withdrawals: Math.round(yearlyAccount.withdrawals),
        endingBalance: Math.round(accounts[index].balance),
      });
    });
  };
  const rows = [
    {
      year: 0,
      month: 0,
      combinedBalance: Math.round(startingAmount * accounts.length),
      combined529Balance: Math.round(
        startingAmount * starting529Share * accounts.length,
      ),
      combinedBrokerageBalance: Math.round(
        startingAmount * (1 - starting529Share) * accounts.length,
      ),
      milestoneCost: 0,
      milestoneDetails: [],
      combinedWithdrawn: 0,
      combinedContributions: Math.round(startingAmount * accounts.length),
      combinedInterest: 0,
      shortfall: 0,
      brokerageGrossWithdrawal: 0,
      brokerageNetWithdrawal: 0,
      brokerageWithdrawalTax: 0,
      ...Object.fromEntries(
        accounts.map((account) => [account.name, Math.round(account.balance)]),
      ),
      ...Object.fromEntries(
        accounts.map((account) => [`${account.name} Milestone Cost`, 0]),
      ),
    },
  ];
  const withdrawFromAccountBalance = (account, amount, key) => {
    const payment = Math.min(account[key], amount);
    account[key] -= payment;
    account.balance = account.plan529Balance + account.brokerageBalance;
    return payment;
  };
  let educationBrokerageUsed = 0;
  let educationShortfall = 0;
  let totalBrokerageGrossWithdrawal = 0;
  let totalBrokerageNetWithdrawal = 0;
  let totalBrokerageWithdrawalTax = 0;
  let raw529BalanceAfterFinalEducation = null;
  for (let month = 1; month <= horizonMonths; month++) {
    const yearNumber = Math.floor((month - 1) / 12) + 1;
    if (yearNumber !== activeYear) {
      pushYearlyAccountRows();
      activeYear = yearNumber;
      yearlyAccounts = accounts.map((account) => ({
        name: account.name,
        startingBalance: account.balance,
        contributions: 0,
        earnings: 0,
        milestoneExpenses: 0,
        withdrawals: 0,
      }));
    }
    const milestoneCosts = {};
    const milestoneDetails = [];
    let monthBrokerageGrossWithdrawal = 0;
    let monthBrokerageNetWithdrawal = 0;
    let monthBrokerageWithdrawalTax = 0;
    accounts.forEach((account, accountIndex) => {
      if (month <= account.finalMonth) {
        const contribution529 =
          month <= account.finalEducationMonth
            ? monthlyContribution * contribution529Share
            : 0;
        account.plan529Balance += contribution529;
        account.brokerageBalance += monthlyContribution - contribution529;
        account.balance = account.plan529Balance + account.brokerageBalance;
        account.contributions += monthlyContribution;
        yearlyAccounts[accountIndex].contributions += monthlyContribution;
      }
      const interest529 = account.plan529Balance * plan529MonthlyRate;
      const interestBrokerage = account.brokerageBalance * brokerageMonthlyRate;
      const interest = interest529 + interestBrokerage;
      account.plan529Balance = Math.max(
        0,
        account.plan529Balance + interest529,
      );
      account.brokerageBalance = Math.max(
        0,
        account.brokerageBalance + interestBrokerage,
      );
      account.balance = account.plan529Balance + account.brokerageBalance;
      account.interest += interest;
      yearlyAccounts[accountIndex].earnings += interest;
      account.events
        .filter((event) => event.month === month)
        .forEach((event) => {
          const inflatedCost =
            event.cost * safePow(1 + inflation / 100, month / 12);
          milestoneCosts[account.name] =
            (milestoneCosts[account.name] || 0) + inflatedCost;
          milestoneDetails.push({
            label: `${account.name} ${event.label || event.key}`,
            cost: inflatedCost,
          });
          yearlyAccounts[accountIndex].milestoneExpenses += inflatedCost;
          let remainingCost = inflatedCost;
          let educationBrokerageUsedForEvent = 0;
          const isEducationEvent =
            event.key === "College" || event.key === "Postgrad";
          let paid = 0;
          const recordWithdrawal = (sourceIndex, key) => {
            if (remainingCost <= 0) return;
            const sourceAccount = accounts[sourceIndex];
            if (advancedTracking && key === "brokerageBalance") {
              const taxRate = clampNumber(
                getGenerationalBrokerageTaxRate({
                  month,
                  currentAge,
                  currentSalary,
                  retirementAge,
                  retirementSalary,
                }),
                0,
                0.99,
              );
              const grossNeeded = remainingCost / (1 - taxRate);
              const grossPayment = withdrawFromAccountBalance(
                sourceAccount,
                grossNeeded,
                key,
              );
              const taxPayment = grossPayment * taxRate;
              const netPayment = grossPayment - taxPayment;
              sourceAccount.withdrawn += grossPayment;
              sourceAccount.brokerageTaxPaid += taxPayment;
              yearlyAccounts[sourceIndex].withdrawals += grossPayment;
              paid += netPayment;
              monthBrokerageGrossWithdrawal += grossPayment;
              monthBrokerageNetWithdrawal += netPayment;
              monthBrokerageWithdrawalTax += taxPayment;
              totalBrokerageGrossWithdrawal += grossPayment;
              totalBrokerageNetWithdrawal += netPayment;
              totalBrokerageWithdrawalTax += taxPayment;
              if (isEducationEvent)
                educationBrokerageUsedForEvent += netPayment;
              remainingCost -= netPayment;
              return;
            }
            const payment = withdrawFromAccountBalance(
              sourceAccount,
              remainingCost,
              key,
            );
            sourceAccount.withdrawn += payment;
            yearlyAccounts[sourceIndex].withdrawals += payment;
            paid += payment;
            if (isEducationEvent && key === "brokerageBalance")
              educationBrokerageUsedForEvent += payment;
            remainingCost -= payment;
          };
          if (isEducationEvent) {
            accounts
              .map((sourceAccount, sourceIndex) => ({
                sourceAccount,
                sourceIndex,
              }))
              .sort(
                (left, right) =>
                  left.sourceAccount.finalEducationMonth -
                  right.sourceAccount.finalEducationMonth,
              )
              .forEach(({ sourceIndex }) =>
                recordWithdrawal(sourceIndex, "plan529Balance"),
              );
          }
          [
            accountIndex,
            ...accounts
              .map((sourceAccount, sourceIndex) => sourceIndex)
              .filter((sourceIndex) => sourceIndex !== accountIndex),
          ].forEach((sourceIndex) =>
            recordWithdrawal(sourceIndex, "brokerageBalance"),
          );
          if (isEducationEvent) {
            educationBrokerageUsed += educationBrokerageUsedForEvent;
            educationShortfall += Math.max(0, remainingCost);
          }
          account.shortfall += Math.max(0, remainingCost);
          if (event.key === "Car") account.carPaid += paid;
          if (event.key === "College") account.collegePaid += paid;
          if (event.key === "Postgrad") account.postgradPaid += paid;
          if (event.key === "Down Payment") account.downPaymentPaid += paid;
        });
    });
    const combinedBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    const combined529Balance = accounts.reduce(
      (sum, account) => sum + account.plan529Balance,
      0,
    );
    const combinedBrokerageBalance = accounts.reduce(
      (sum, account) => sum + account.brokerageBalance,
      0,
    );
    if (month === finalEducationMonth)
      raw529BalanceAfterFinalEducation = combined529Balance;
    const combinedWithdrawn = accounts.reduce(
      (sum, account) => sum + account.withdrawn,
      0,
    );
    const combinedContributions = accounts.reduce(
      (sum, account) => sum + account.contributions,
      0,
    );
    const combinedInterest = accounts.reduce(
      (sum, account) => sum + account.interest,
      0,
    );
    const milestoneCost = Object.values(milestoneCosts).reduce(
      (sum, cost) => sum + cost,
      0,
    );
    const shortfall = accounts.reduce(
      (sum, account) => sum + account.shortfall,
      0,
    );
    rows.push({
      year: Number((month / 12).toFixed(1)),
      month,
      combinedBalance: Math.round(combinedBalance),
      combined529Balance: Math.round(combined529Balance),
      combinedBrokerageBalance: Math.round(combinedBrokerageBalance),
      milestoneCost: Math.round(milestoneCost),
      milestoneDetails,
      combinedWithdrawn: Math.round(combinedWithdrawn),
      combinedContributions: Math.round(combinedContributions),
      combinedInterest: Math.round(combinedInterest),
      shortfall: Math.round(shortfall),
      brokerageGrossWithdrawal: Math.round(monthBrokerageGrossWithdrawal),
      brokerageNetWithdrawal: Math.round(monthBrokerageNetWithdrawal),
      brokerageWithdrawalTax: Math.round(monthBrokerageWithdrawalTax),
      ...Object.fromEntries(
        accounts.map((account) => [account.name, Math.round(account.balance)]),
      ),
      ...Object.fromEntries(
        accounts.map((account) => [
          `${account.name} Milestone Cost`,
          Math.round(milestoneCosts[account.name] || 0),
        ]),
      ),
    });
  }
  pushYearlyAccountRows();
  const last = rows[rows.length - 1];
  const rawEndingBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const rawEnding529Balance = accounts.reduce(
    (sum, account) => sum + account.plan529Balance,
    0,
  );
  const rawEndingBrokerageBalance = accounts.reduce(
    (sum, account) => sum + account.brokerageBalance,
    0,
  );
  const rawShortfall = accounts.reduce(
    (sum, account) => sum + account.shortfall,
    0,
  );
  return {
    rows,
    accounts: accounts.map((account) => ({
      ...account,
      balance: Math.round(account.balance),
      plan529Balance: Math.round(account.plan529Balance),
      brokerageBalance: Math.round(account.brokerageBalance),
      contributions: Math.round(account.contributions),
      interest: Math.round(account.interest),
      withdrawn: Math.round(account.withdrawn),
      brokerageTaxPaid: Math.round(account.brokerageTaxPaid),
      shortfall: Math.round(account.shortfall),
      carPaid: Math.round(account.carPaid),
      collegePaid: Math.round(account.collegePaid),
      postgradPaid: Math.round(account.postgradPaid),
      downPaymentPaid: Math.round(account.downPaymentPaid),
    })),
    endingBalance: last.combinedBalance,
    totalContributions: last.combinedContributions,
    totalInterest: last.combinedInterest,
    totalWithdrawn: last.combinedWithdrawn,
    totalBrokerageGrossWithdrawal,
    totalBrokerageNetWithdrawal,
    totalBrokerageWithdrawalTax,
    yearlyAccountRows,
    shortfall: last.shortfall,
    rawEndingBalance,
    rawEnding529Balance,
    rawEndingBrokerageBalance,
    raw529BalanceAfterFinalEducation:
      raw529BalanceAfterFinalEducation ?? rawEnding529Balance,
    rawShortfall,
    educationBrokerageUsed,
    educationShortfall,
    educationNotPaidBy529: educationBrokerageUsed + educationShortfall,
    horizonYears: Number((horizonMonths / 12).toFixed(1)),
  };
}
function findGenerationalZeroBalanceContribution({
  children,
  startingAmount,
  marketReturn,
  inflation,
  carCost,
  annualTuition,
  annualBoard,
  annualPostgradTuition,
  annualPostgradBoard,
  postgradYears,
  downPayment,
  downPaymentAge,
  advancedTracking,
  startingAmount529Pct,
  monthlyContribution529Pct,
  plan529Return,
  currentAge,
  currentSalary,
  retirementAge,
  retirementSalary,
}) {
  const scenarioFor = (monthlyContribution) =>
    calculateGenerationalSavingsScenario({
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      advancedTracking,
      startingAmount529Pct,
      monthlyContribution529Pct,
      plan529Return,
      currentAge,
      currentSalary,
      retirementAge,
      retirementSalary,
    });
  const isFunded = (scenario) => scenario.rawShortfall <= 0.01;
  const zeroContributionScenario = scenarioFor(0);
  if (isFunded(zeroContributionScenario)) return 0;
  let low = 0;
  let high = 100;
  while (!isFunded(scenarioFor(high)) && high < 100000) high *= 2;
  for (let index = 0; index < 48; index++) {
    const mid = (low + high) / 2;
    if (isFunded(scenarioFor(mid))) high = mid;
    else low = mid;
  }
  return Math.ceil(high * 10000) / 10000;
}
function findGenerationalOptimizedAdvancedContributions({
  children,
  startingAmount,
  marketReturn,
  inflation,
  carCost,
  annualTuition,
  annualBoard,
  annualPostgradTuition,
  annualPostgradBoard,
  postgradYears,
  downPayment,
  downPaymentAge,
  plan529Return,
  currentAge,
  currentSalary,
  retirementAge,
  retirementSalary,
}) {
  const scenarioFor = (
    monthlyContribution,
    monthlyContribution529Pct,
    optimizedStartingAmount529Pct,
  ) =>
    calculateGenerationalSavingsScenario({
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: optimizedStartingAmount529Pct,
      monthlyContribution529Pct,
      plan529Return,
      currentAge,
      currentSalary,
      retirementAge,
      retirementSalary,
    });
  const isFunded = (scenario) =>
    scenario.rawShortfall <= 0.01 && scenario.educationNotPaidBy529 <= 0.01;
  const solvedCandidates = new Map();
  const solveMonthlyContribution = (
    monthlyContribution529Pct,
    optimizedStartingAmount529Pct,
  ) => {
    const cacheKey = `${Math.round(optimizedStartingAmount529Pct * 10000)}:${Math.round(monthlyContribution529Pct * 10000)}`;
    if (solvedCandidates.has(cacheKey)) return solvedCandidates.get(cacheKey);
    const zeroScenario = scenarioFor(
      0,
      monthlyContribution529Pct,
      optimizedStartingAmount529Pct,
    );
    if (isFunded(zeroScenario)) {
      const result = { monthlyContribution: 0, scenario: zeroScenario };
      solvedCandidates.set(cacheKey, result);
      return result;
    }
    let low = 0;
    let high = 100;
    let highScenario = scenarioFor(
      high,
      monthlyContribution529Pct,
      optimizedStartingAmount529Pct,
    );
    while (!isFunded(highScenario) && high < 100000) {
      low = high;
      high *= 2;
      highScenario = scenarioFor(
        high,
        monthlyContribution529Pct,
        optimizedStartingAmount529Pct,
      );
    }
    if (!isFunded(highScenario)) {
      solvedCandidates.set(cacheKey, null);
      return null;
    }
    for (let index = 0; index < 28; index++) {
      const mid = (low + high) / 2;
      const midScenario = scenarioFor(
        mid,
        monthlyContribution529Pct,
        optimizedStartingAmount529Pct,
      );
      if (isFunded(midScenario)) {
        high = mid;
        highScenario = midScenario;
      } else {
        low = mid;
      }
    }
    const roundedMonthlyContribution = Math.ceil(high * 10000) / 10000;
    const result = {
      monthlyContribution: roundedMonthlyContribution,
      scenario: scenarioFor(
        roundedMonthlyContribution,
        monthlyContribution529Pct,
        optimizedStartingAmount529Pct,
      ),
    };
    solvedCandidates.set(cacheKey, result);
    return result;
  };
  const scoreCandidate = (candidate) =>
    candidate.scenario.raw529BalanceAfterFinalEducation +
    candidate.scenario.rawEnding529Balance +
    candidate.scenario.rawEndingBrokerageBalance;
  let best = null;
  const consider = (
    optimizedStartingAmount529Pct,
    monthlyContribution529Pct,
  ) => {
    const safeStartingAmount529Pct = clampNumber(
      optimizedStartingAmount529Pct,
      0,
      100,
    );
    const safeMonthlyContribution529Pct = clampNumber(
      monthlyContribution529Pct,
      0,
      100,
    );
    const candidate = solveMonthlyContribution(
      safeMonthlyContribution529Pct,
      safeStartingAmount529Pct,
    );
    if (!candidate) return;
    const score = scoreCandidate(candidate);
    if (!best || score < best.score)
      best = {
        ...candidate,
        startingAmount529Pct: safeStartingAmount529Pct,
        monthlyContribution529Pct: safeMonthlyContribution529Pct,
        score,
      };
  };
  for (let startingPct = 0; startingPct <= 100; startingPct += 10) {
    for (let monthlyPct = 0; monthlyPct <= 100; monthlyPct += 10)
      consider(startingPct, monthlyPct);
  }
  const refineAroundBest = (step) => {
    let improved = true;
    while (best && improved) {
      improved = false;
      const startingCenter = best.startingAmount529Pct;
      const monthlyCenter = best.monthlyContribution529Pct;
      const previousScore = best.score;
      [-1, 0, 1].forEach((startingStep) => {
        [-1, 0, 1].forEach((monthlyStep) => {
          if (startingStep === 0 && monthlyStep === 0) return;
          consider(
            startingCenter + startingStep * step,
            monthlyCenter + monthlyStep * step,
          );
        });
      });
      improved = best.score + 0.0001 < previousScore;
      if (
        Math.abs(best.startingAmount529Pct - startingCenter) > step * 1.5 ||
        Math.abs(best.monthlyContribution529Pct - monthlyCenter) > step * 1.5
      ) {
        improved = false;
      }
    }
  };
  [2, 0.5, 0.1, 0.02, 0.005, 0.001, 0.0002].forEach(refineAroundBest);
  if (!best)
    return {
      monthlyContribution: 0,
      startingAmount529Pct: 0,
      monthlyContribution529Pct: 0,
    };
  const roundedStarting529Pct =
    Math.round(best.startingAmount529Pct * 10000) / 10000;
  const rounded529Pct =
    Math.round(best.monthlyContribution529Pct * 10000) / 10000;
  const roundedCandidate = solveMonthlyContribution(
    rounded529Pct,
    roundedStarting529Pct,
  );
  return {
    monthlyContribution:
      roundedCandidate?.monthlyContribution ?? best.monthlyContribution,
    startingAmount529Pct: roundedStarting529Pct,
    monthlyContribution529Pct: rounded529Pct,
  };
}

function AdvancedGenerationalTrackingPanel({
  result,
  brokerageOnlyResult,
  startingAmount,
  setStartingAmount,
  marketReturn,
  setMarketReturn,
  plan529Return,
  setPlan529Return,
  currentAge,
  setCurrentAge,
  currentSalary,
  setCurrentSalary,
  retirementAge,
  setRetirementAge,
  retirementSalary,
  setRetirementSalary,
  advancedMonthlyContributionNeeded,
  advancedStartingAmount529Pct,
  advancedMonthlyContribution529Pct,
  brokerageOnlyMonthlyContributionNeeded,
  areContributionResultsCalculating,
}) {
  const [comparisonSeriesVisibility, setComparisonSeriesVisibility] = useState({
    balance529Brokerage: true,
    balanceBrokerageOnly: true,
    balance529: false,
    balanceBrokerage: false,
    tax529Brokerage: false,
    taxBrokerageOnly: false,
  });
  const toggleComparisonSeries = (key) =>
    setComparisonSeriesVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  const currentCapitalGainsBracket =
    getCapitalGainsTaxBracket2025(currentSalary);
  const retirementCapitalGainsBracket =
    getCapitalGainsTaxBracket2025(retirementSalary);
  const brokerageOnlyRowsByMonth = new Map(
    brokerageOnlyResult.rows.map((row) => [row.month, row]),
  );
  const balanceComparisonChartData = result.rows.map((row) => ({
    year: row.year,
    "529 and brokerage": row.combinedBalance,
    "529 balance": row.combined529Balance,
    "Brokerage balance": row.combinedBrokerageBalance,
    "Brokerage only":
      brokerageOnlyRowsByMonth.get(row.month)?.combinedBalance ?? 0,
    "529 + brokerage tax": row.brokerageWithdrawalTax,
    "Brokerage-only tax":
      brokerageOnlyRowsByMonth.get(row.month)?.brokerageWithdrawalTax ?? 0,
  }));
  const comparisonSeriesControls = [
    {
      key: "balance529Brokerage",
      label: "529 + brokerage balance",
      color: "#2563eb",
    },
    {
      key: "balanceBrokerageOnly",
      label: "Brokerage-only balance",
      color: "#0f172a",
    },
    {
      key: "balance529",
      label: "529 balance",
      color: "#7c3aed",
    },
    {
      key: "balanceBrokerage",
      label: "Brokerage balance",
      color: "#d97706",
    },
    {
      key: "tax529Brokerage",
      label: "529 + brokerage tax",
      color: "#93c5fd",
    },
    {
      key: "taxBrokerageOnly",
      label: "Brokerage-only tax",
      color: "#64748b",
    },
  ];
  const hasContributionResults =
    Number.isFinite(advancedMonthlyContributionNeeded) &&
    Number.isFinite(brokerageOnlyMonthlyContributionNeeded);
  const advancedResultIsLower =
    hasContributionResults &&
    advancedMonthlyContributionNeeded < brokerageOnlyMonthlyContributionNeeded;
  const brokerageOnlyResultIsLower =
    hasContributionResults &&
    brokerageOnlyMonthlyContributionNeeded < advancedMonthlyContributionNeeded;
  const formatContributionResult = (value) =>
    areContributionResultsCalculating || !Number.isFinite(value)
      ? "Calculating..."
      : formatMoney(value);
  const resultCardClass = (isLower) =>
    `rounded-xl border p-4 ${
      isLower
        ? "border-emerald-200 bg-emerald-50"
        : "border-neutral-200 bg-neutral-50"
    }`;
  const advancedStarting529Amount = Number.isFinite(
    advancedStartingAmount529Pct,
  )
    ? startingAmount * (advancedStartingAmount529Pct / 100)
    : NaN;
  const advancedMonthly529Amount =
    Number.isFinite(advancedMonthlyContributionNeeded) &&
    Number.isFinite(advancedMonthlyContribution529Pct)
      ? advancedMonthlyContributionNeeded *
        (advancedMonthlyContribution529Pct / 100)
      : NaN;
  const resultDetailRows = [
    {
      label: "Starting amount in brokerage",
      advancedValue: Number.isFinite(advancedStarting529Amount)
        ? startingAmount - advancedStarting529Amount
        : NaN,
      brokerageOnlyValue: startingAmount,
    },
    {
      label: "Starting amount in 529",
      advancedValue: advancedStarting529Amount,
      brokerageOnlyValue: 0,
    },
    {
      label: "Monthly contribution for 529",
      advancedValue: advancedMonthly529Amount,
      brokerageOnlyValue: 0,
    },
    {
      label: "Monthly contribution for brokerage",
      advancedValue:
        Number.isFinite(advancedMonthlyContributionNeeded) &&
        Number.isFinite(advancedMonthly529Amount)
          ? advancedMonthlyContributionNeeded - advancedMonthly529Amount
          : NaN,
      brokerageOnlyValue: brokerageOnlyMonthlyContributionNeeded,
    },
  ];
  return (
    <div className="mt-5 space-y-5">
      <div>
        <p className="mb-3 text-sm leading-6 text-neutral-600">
          <strong className="font-bold text-neutral-700">Step 1:</strong> Enter
          the starting amount per child.
        </p>
        <MoneyInput
          label="Starting amount per child"
          value={startingAmount}
          onChange={setStartingAmount}
          max={250000}
          step={1000}
        />
      </div>
      <p className="border-t border-neutral-200 pt-5 text-sm leading-6 text-neutral-600">
        <strong className="font-bold text-neutral-700">Step 2:</strong> Enter
        information into both sections below.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
            529 and Brokerage information
          </h3>
          <div className="space-y-4 lg:min-h-[360px]">
            <PercentInput
              label="529 rate of return"
              value={plan529Return}
              onChange={setPlan529Return}
              min={-10}
              max={20}
              helperText="Used only for 529 account growth."
            />
          </div>
        </div>
        <div className="lg:border-l lg:border-neutral-200 lg:pl-5 lg:pb-5">
          <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
            Brokerage only option
          </h3>
          <div className="space-y-4 lg:min-h-[360px]">
            <p className="text-sm leading-6 text-neutral-600">
              Uses the same milestone and brokerage tax settings, with the
              investment assumptions below.
            </p>
            <MarketReturnPicker
              value={marketReturn}
              onChange={setMarketReturn}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-200 pt-5">
        <p className="mb-3 text-sm leading-6 text-neutral-600">
          <strong className="font-bold text-neutral-700">Step 3:</strong> Enter
          your Salary and retirement information below so we can determine a
          proper capital gains tax for brokerage withdrawals
        </p>
        <div>
          <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
            Capital gains tax information for brokerage withdrawal
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <RangeInput
                label="Current age"
                value={currentAge}
                onChange={setCurrentAge}
                min={18}
                max={90}
                suffix="yrs"
              />
              <MoneyInput
                label="Current salary"
                value={currentSalary}
                onChange={setCurrentSalary}
                max={1000000}
                step={5000}
                helperText={`${formatPercent(currentCapitalGainsBracket.rate)} long-term capital gains before retirement`}
              />
            </div>
            <div className="space-y-4">
              <RangeInput
                label="Retirement age"
                value={retirementAge}
                onChange={setRetirementAge}
                min={currentAge}
                max={95}
                suffix="yrs"
              />
              <MoneyInput
                label="Retirement salary"
                value={retirementSalary}
                onChange={setRetirementSalary}
                max={1000000}
                step={5000}
                helperText={`${formatPercent(retirementCapitalGainsBracket.rate)} long-term capital gains after retirement`}
              />
            </div>
          </div>
        </div>
      </div>
      <p className="border-t border-neutral-200 pt-5 text-sm leading-6 text-neutral-600">
        <strong className="font-bold text-neutral-700">Step 4:</strong> The more
        effective option will appear in green below.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className={resultCardClass(advancedResultIsLower)}>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Monthly contribution per child needed for 529+Brokerage
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-950">
              {formatContributionResult(advancedMonthlyContributionNeeded)}
            </div>
            <div className="mt-4 space-y-2">
              {resultDetailRows.map((row) => (
                <div
                  key={`advanced-${row.label}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-neutral-600">{row.label}</span>
                  <strong className="text-neutral-950">
                    {formatContributionResult(row.advancedValue)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:border-l lg:border-neutral-200 lg:pl-5">
          <div className={resultCardClass(brokerageOnlyResultIsLower)}>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Monthly contribution per child needed for Brokerage Only
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-950">
              {formatContributionResult(brokerageOnlyMonthlyContributionNeeded)}
            </div>
            <div className="mt-4 space-y-2">
              {resultDetailRows.map((row) => (
                <div
                  key={`brokerage-${row.label}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-neutral-600">{row.label}</span>
                  <strong className="text-neutral-950">
                    {formatContributionResult(row.brokerageOnlyValue)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
          529 + Brokerage vs. Only Brokerage
        </h3>
        <div className="h-[420px] rounded-xl border border-neutral-200 bg-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={balanceComparisonChartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0, Math.ceil(result.horizonYears)]}
                allowDecimals={false}
                tick={CHART_AXIS_TICK}
                tickLine={false}
                axisLine={false}
                height={56}
                label={{
                  ...CHART_AXIS_LABEL,
                  value: "Years from today",
                  position: "insideBottom",
                  offset: 10,
                }}
              />
              <YAxis
                yAxisId="balance"
                tick={CHART_AXIS_TICK}
                tickFormatter={formatCompactMoney}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <YAxis
                yAxisId="tax"
                orientation="right"
                tick={CHART_AXIS_TICK}
                tickFormatter={formatCompactMoney}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={CHART_BOTTOM_LEGEND_WRAPPER_STYLE}
              />
              {comparisonSeriesVisibility.tax529Brokerage && (
                <Bar
                  yAxisId="tax"
                  dataKey="529 + brokerage tax"
                  fill="#93c5fd"
                  barSize={16}
                />
              )}
              {comparisonSeriesVisibility.taxBrokerageOnly && (
                <Bar
                  yAxisId="tax"
                  dataKey="Brokerage-only tax"
                  fill="#64748b"
                  barSize={16}
                />
              )}
              {comparisonSeriesVisibility.balance529Brokerage && (
                <Line
                  yAxisId="balance"
                  type="monotone"
                  dataKey="529 and brokerage"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                />
              )}
              {comparisonSeriesVisibility.balanceBrokerageOnly && (
                <Line
                  yAxisId="balance"
                  type="monotone"
                  dataKey="Brokerage only"
                  stroke="#0f172a"
                  strokeDasharray="6 4"
                  strokeWidth={3}
                  dot={false}
                />
              )}
              {comparisonSeriesVisibility.balance529 && (
                <Line
                  yAxisId="balance"
                  type="monotone"
                  dataKey="529 balance"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={false}
                />
              )}
              {comparisonSeriesVisibility.balanceBrokerage && (
                <Line
                  yAxisId="balance"
                  type="monotone"
                  dataKey="Brokerage balance"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {comparisonSeriesControls.map((control) => {
            const isVisible = comparisonSeriesVisibility[control.key];
            return (
              <button
                key={control.key}
                type="button"
                onClick={() => toggleComparisonSeries(control.key)}
                aria-pressed={isVisible}
                className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold transition ${
                  isVisible
                    ? "border-neutral-300 bg-neutral-100 text-neutral-950"
                    : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: control.color }}
                />
                {control.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs italic leading-5 text-neutral-500">
        This feature is still in beta, we're attempting to get the values to $0,
        but there are some rounding errors still visible
      </p>
    </div>
  );
}

function GenerationalSavingsCalculator() {
  const [childCount, setChildCount] = useCalculatorState(
    "generational-savings",
    "childCount",
    2,
  );
  const [children, setChildren] = useCalculatorState(
    "generational-savings",
    "children",
    () => makeGenerationalChildren(2),
  );
  const [startingAmount, setStartingAmount] = useCalculatorState(
    "generational-savings",
    "startingAmount",
    10000,
  );
  const [monthlyContribution, setMonthlyContribution] = useCalculatorState(
    "generational-savings",
    "monthlyContribution",
    1000,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "generational-savings",
    "marketReturn",
    10,
  );
  const [inflation, setInflation] = useCalculatorState(
    "generational-savings",
    "inflation",
    3,
  );
  const [carCost, setCarCost] = useCalculatorState(
    "generational-savings",
    "carCost",
    30000,
  );
  const [annualTuition, setAnnualTuition] = useCalculatorState(
    "generational-savings",
    "annualTuition",
    35000,
  );
  const [annualBoard, setAnnualBoard] = useCalculatorState(
    "generational-savings",
    "annualBoard",
    18000,
  );
  const [annualPostgradTuition, setAnnualPostgradTuition] = useCalculatorState(
    "generational-savings",
    "annualPostgradTuition",
    60000,
  );
  const [annualPostgradBoard, setAnnualPostgradBoard] = useCalculatorState(
    "generational-savings",
    "annualPostgradBoard",
    24000,
  );
  const [postgradYears, setPostgradYears] = useCalculatorState(
    "generational-savings",
    "postgradYears",
    2,
  );
  const [downPayment, setDownPayment] = useCalculatorState(
    "generational-savings",
    "downPayment",
    150000,
  );
  const [downPaymentAge, setDownPaymentAge] = useCalculatorState(
    "generational-savings",
    "downPaymentAge",
    25,
  );
  const [showAdvancedInvestment, setShowAdvancedInvestment] =
    useCalculatorState("generational-savings", "showAdvancedInvestment", false);
  const [plan529Return, setPlan529Return] = useCalculatorState(
    "generational-savings",
    "plan529Return",
    7,
  );
  const [advancedCurrentAge, setAdvancedCurrentAge] = useCalculatorState(
    "generational-savings",
    "advancedCurrentAge",
    40,
  );
  const [advancedCurrentSalary, setAdvancedCurrentSalary] = useCalculatorState(
    "generational-savings",
    "advancedCurrentSalary",
    120000,
  );
  const [advancedRetirementAge, setAdvancedRetirementAge] = useCalculatorState(
    "generational-savings",
    "advancedRetirementAge",
    65,
  );
  const [advancedRetirementSalary, setAdvancedRetirementSalary] =
    useCalculatorState(
      "generational-savings",
      "advancedRetirementSalary",
      80000,
    );
  const [optimizedAdvancedContribution, setOptimizedAdvancedContribution] =
    useState(null);
  const [
    brokerageOnlyMonthlyContributionNeeded,
    setBrokerageOnlyMonthlyContributionNeeded,
  ] = useState(null);
  const [
    areContributionResultsCalculating,
    setAreContributionResultsCalculating,
  ] = useState(false);
  const generationalInputs = useMemo(
    () => ({
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      showAdvancedInvestment,
      plan529Return,
      advancedCurrentAge,
      advancedCurrentSalary,
      advancedRetirementAge,
      advancedRetirementSalary,
    }),
    [
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      showAdvancedInvestment,
      plan529Return,
      advancedCurrentAge,
      advancedCurrentSalary,
      advancedRetirementAge,
      advancedRetirementSalary,
    ],
  );
  const deferredGenerationalInputs = useDeferredValue(generationalInputs);
  const setSafeChildCount = (nextCount) => {
    const count = clampNumber(parseNumber(nextCount), 1, 6);
    setChildCount(count);
    setChildren((current) => makeGenerationalChildren(count, current));
  };
  const setSafeAdvancedCurrentAge = (value) => {
    const age = clampNumber(parseNumber(value), 18, 90);
    setAdvancedCurrentAge(age);
    if (advancedRetirementAge < age) setAdvancedRetirementAge(age);
  };
  const setSafeAdvancedRetirementAge = (value) =>
    setAdvancedRetirementAge(
      clampNumber(parseNumber(value), advancedCurrentAge, 95),
    );
  const updateChild = (index, updates) =>
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index ? { ...child, ...updates } : child,
      ),
    );
  const setZeroEndingContribution = () =>
    setMonthlyContribution(
      findGenerationalZeroBalanceContribution({
        children,
        startingAmount,
        marketReturn,
        inflation,
        carCost,
        annualTuition,
        annualBoard,
        annualPostgradTuition,
        annualPostgradBoard,
        postgradYears,
        downPayment,
        downPaymentAge,
        advancedTracking: showAdvancedInvestment,
        startingAmount529Pct: 100,
        monthlyContribution529Pct: 100,
        plan529Return,
        currentAge: advancedCurrentAge,
        currentSalary: advancedCurrentSalary,
        retirementAge: advancedRetirementAge,
        retirementSalary: advancedRetirementSalary,
      }),
    );
  useEffect(() => {
    if (!deferredGenerationalInputs.showAdvancedInvestment) return undefined;
    let isCancelled = false;
    setAreContributionResultsCalculating(true);
    const timeout = window.setTimeout(() => {
      const nextOptimizedAdvancedContribution =
        findGenerationalOptimizedAdvancedContributions({
          children: deferredGenerationalInputs.children,
          startingAmount: deferredGenerationalInputs.startingAmount,
          marketReturn: deferredGenerationalInputs.marketReturn,
          inflation: deferredGenerationalInputs.inflation,
          carCost: deferredGenerationalInputs.carCost,
          annualTuition: deferredGenerationalInputs.annualTuition,
          annualBoard: deferredGenerationalInputs.annualBoard,
          annualPostgradTuition:
            deferredGenerationalInputs.annualPostgradTuition,
          annualPostgradBoard: deferredGenerationalInputs.annualPostgradBoard,
          postgradYears: deferredGenerationalInputs.postgradYears,
          downPayment: deferredGenerationalInputs.downPayment,
          downPaymentAge: deferredGenerationalInputs.downPaymentAge,
          plan529Return: deferredGenerationalInputs.plan529Return,
          currentAge: deferredGenerationalInputs.advancedCurrentAge,
          currentSalary: deferredGenerationalInputs.advancedCurrentSalary,
          retirementAge: deferredGenerationalInputs.advancedRetirementAge,
          retirementSalary: deferredGenerationalInputs.advancedRetirementSalary,
        });
      const nextBrokerageOnlyMonthlyContribution =
        findGenerationalZeroBalanceContribution({
          children: deferredGenerationalInputs.children,
          startingAmount: deferredGenerationalInputs.startingAmount,
          marketReturn: deferredGenerationalInputs.marketReturn,
          inflation: deferredGenerationalInputs.inflation,
          carCost: deferredGenerationalInputs.carCost,
          annualTuition: deferredGenerationalInputs.annualTuition,
          annualBoard: deferredGenerationalInputs.annualBoard,
          annualPostgradTuition:
            deferredGenerationalInputs.annualPostgradTuition,
          annualPostgradBoard: deferredGenerationalInputs.annualPostgradBoard,
          postgradYears: deferredGenerationalInputs.postgradYears,
          downPayment: deferredGenerationalInputs.downPayment,
          downPaymentAge: deferredGenerationalInputs.downPaymentAge,
          advancedTracking: true,
          startingAmount529Pct: 0,
          monthlyContribution529Pct: 0,
          plan529Return: deferredGenerationalInputs.marketReturn,
          currentAge: deferredGenerationalInputs.advancedCurrentAge,
          currentSalary: deferredGenerationalInputs.advancedCurrentSalary,
          retirementAge: deferredGenerationalInputs.advancedRetirementAge,
          retirementSalary: deferredGenerationalInputs.advancedRetirementSalary,
        });
      if (isCancelled) return;
      setOptimizedAdvancedContribution(nextOptimizedAdvancedContribution);
      setBrokerageOnlyMonthlyContributionNeeded(
        nextBrokerageOnlyMonthlyContribution,
      );
      setAreContributionResultsCalculating(false);
    }, 500);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [deferredGenerationalInputs]);
  const result = useMemo(() => {
    const inputs = deferredGenerationalInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: inputs.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: inputs.showAdvancedInvestment,
      startingAmount529Pct: 100,
      monthlyContribution529Pct: 100,
      plan529Return: inputs.plan529Return,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [deferredGenerationalInputs]);
  const brokerageOnlyResult = useMemo(() => {
    if (!deferredGenerationalInputs.showAdvancedInvestment) return result;
    const inputs = deferredGenerationalInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: inputs.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: 0,
      monthlyContribution529Pct: 0,
      plan529Return: inputs.marketReturn,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [deferredGenerationalInputs, result]);
  const hasAutomaticOptimizedResults =
    showAdvancedInvestment &&
    !areContributionResultsCalculating &&
    Number.isFinite(optimizedAdvancedContribution?.monthlyContribution) &&
    Number.isFinite(brokerageOnlyMonthlyContributionNeeded);
  const automaticOptimization =
    hasAutomaticOptimizedResults &&
    brokerageOnlyMonthlyContributionNeeded <
      optimizedAdvancedContribution.monthlyContribution
      ? "brokerage-only"
      : hasAutomaticOptimizedResults
        ? "advanced"
        : null;
  const optimizedAdvancedResult = useMemo(() => {
    if (
      !deferredGenerationalInputs.showAdvancedInvestment ||
      !Number.isFinite(optimizedAdvancedContribution?.monthlyContribution)
    )
      return result;
    const inputs = deferredGenerationalInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: optimizedAdvancedContribution.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: optimizedAdvancedContribution.startingAmount529Pct,
      monthlyContribution529Pct:
        optimizedAdvancedContribution.monthlyContribution529Pct,
      plan529Return: inputs.plan529Return,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [deferredGenerationalInputs, optimizedAdvancedContribution, result]);
  const optimizedBrokerageOnlyResult = useMemo(() => {
    if (
      !deferredGenerationalInputs.showAdvancedInvestment ||
      !Number.isFinite(brokerageOnlyMonthlyContributionNeeded)
    )
      return brokerageOnlyResult;
    const inputs = deferredGenerationalInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: brokerageOnlyMonthlyContributionNeeded,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: 0,
      monthlyContribution529Pct: 0,
      plan529Return: inputs.marketReturn,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [
    brokerageOnlyMonthlyContributionNeeded,
    brokerageOnlyResult,
    deferredGenerationalInputs,
  ]);
  const activeGenerationalResult =
    showAdvancedInvestment && automaticOptimization === "brokerage-only"
      ? optimizedBrokerageOnlyResult
      : showAdvancedInvestment && automaticOptimization === "advanced"
        ? optimizedAdvancedResult
        : result;
  const activeMonthlyContribution =
    showAdvancedInvestment && automaticOptimization === "brokerage-only"
      ? brokerageOnlyMonthlyContributionNeeded
      : showAdvancedInvestment && automaticOptimization === "advanced"
        ? optimizedAdvancedContribution?.monthlyContribution
        : monthlyContribution;
  return (
    <CalculatorFrame
      title="Generational Savings Calculator"
      description={`Model savings accounts for kids' cars at 16, college after senior year, postgraduate degrees after college, and home down payments at age ${downPaymentAge}. Costs are entered in today's dollars and inflated to each milestone.`}
      exportData={{
        columns: GENERATIONAL_SAVINGS_EXPORT_COLUMNS,
        rows: activeGenerationalResult.yearlyAccountRows,
      }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SmallStat
            label="Starting Amount per child"
            value={formatMoney(startingAmount)}
            tone="blue"
          />
          <SmallStat
            label="Monthly contribution per child"
            value={formatMoney(
              Number.isFinite(activeMonthlyContribution)
                ? activeMonthlyContribution
                : monthlyContribution,
            )}
            tone="teal"
          />
          <SmallStat
            label="Ending balance"
            value={formatCompactMoney(activeGenerationalResult.endingBalance)}
            tone={activeGenerationalResult.shortfall > 0 ? "amber" : "green"}
          />
          <SmallStat
            label="Total invested"
            value={formatCompactMoney(
              activeGenerationalResult.totalContributions,
            )}
            tone="teal"
          />
          <SmallStat
            label="Investment growth"
            value={formatCompactMoney(activeGenerationalResult.totalInterest)}
            tone="green"
          />
          <SmallStat
            label="Shortfall"
            value={formatCompactMoney(activeGenerationalResult.shortfall)}
            tone={activeGenerationalResult.shortfall > 0 ? "red" : "neutral"}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={GiftIcon}
              title="Children Information"
              subtitle="Set age and current grade for milestone timing."
            />
            <div className="space-y-4">
              <RangeInput
                label="# of children"
                value={childCount}
                onChange={setSafeChildCount}
                min={1}
                max={6}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {children.map((child, index) => (
                  <div
                    key={child.id}
                    className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="text-sm font-bold text-neutral-950">
                      Child {index + 1}
                    </div>
                    <RangeInput
                      label="Age"
                      value={child.age}
                      onChange={(age) => updateChild(index, { age })}
                      min={0}
                      max={24}
                    />
                    <SchoolYearSelect
                      label="Current grade"
                      value={child.currentGrade}
                      onChange={(currentGrade) =>
                        updateChild(index, { currentGrade })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="flex min-h-[560px] flex-col">
            <SectionTitle
              icon={BarChartIcon}
              title="Generational savings path"
              subtitle={`Combined balances across ${childCount} ${childCount === 1 ? "child" : "children"} over ${activeGenerationalResult.horizonYears} years.`}
            />
            <div className="h-[420px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activeGenerationalResult.rows}
                  margin={{ top: 10, right: 20, left: 0, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[
                      0,
                      Math.ceil(activeGenerationalResult.horizonYears),
                    ]}
                    allowDecimals={false}
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    height={56}
                    label={{
                      ...CHART_AXIS_LABEL,
                      value: "Years from today",
                      position: "insideBottom",
                      offset: 10,
                    }}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={CHART_BOTTOM_LEGEND_WRAPPER_STYLE}
                  />
                  <Line
                    type="monotone"
                    dataKey="combinedBalance"
                    name="Combined Balance"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="milestoneCost"
                    name="Milestone Cost"
                    stroke="#d946ef"
                    strokeWidth={2}
                    dot={false}
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="combinedWithdrawn"
                    name="Cumulative Withdrawals"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                    strokeOpacity={0.6}
                  />
                  {activeGenerationalResult.shortfall > 0 && (
                    <Line
                      type="monotone"
                      dataKey="shortfall"
                      name="Shortfall"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={false}
                      strokeOpacity={0.6}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionTitle
                icon={CarIcon}
                title="Car milestone"
                subtitle="Assumes a car purchase at age 16."
              />
              <MoneyInput
                label="Car cost"
                value={carCost}
                onChange={setCarCost}
                max={150000}
                step={1000}
              />
            </Card>
            <Card>
              <SectionTitle
                icon={HomeIcon}
                title="Home down payment milestone"
                subtitle={`Assumes a down payment at age ${downPaymentAge}.`}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyInput
                  label="Home down payment"
                  value={downPayment}
                  onChange={setDownPayment}
                  max={1000000}
                  step={5000}
                />
                <RangeInput
                  label="Home down payment age"
                  value={downPaymentAge}
                  onChange={setDownPaymentAge}
                  min={25}
                  max={40}
                  suffix="yrs"
                />
              </div>
            </Card>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionTitle
                icon={DollarIcon}
                title="College cost assumptions"
                subtitle="Enter tuition and board in today's dollars. Future milestone withdrawals inflate from these current costs."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyInput
                  label="Annual tuition"
                  value={annualTuition}
                  onChange={setAnnualTuition}
                  max={150000}
                  step={1000}
                />
                <MoneyInput
                  label="Annual board"
                  value={annualBoard}
                  onChange={setAnnualBoard}
                  max={75000}
                  step={500}
                />
                <PercentInput
                  label="Education inflation"
                  value={inflation}
                  onChange={setInflation}
                  min={0}
                  max={12}
                  helperText="Applied to future milestone withdrawals."
                />
                <div>
                  <div className="text-sm font-medium text-neutral-800">
                    Current annual cost
                  </div>
                  <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-950">
                    {formatMoney(annualTuition + annualBoard)}
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <SectionTitle
                icon={GraduationIcon}
                title="Postgrad degree milestone"
                subtitle="Enter postgrad tuition and board in today's dollars. Future withdrawals inflate from these current costs."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyInput
                  label="Annual postgrad tuition"
                  value={annualPostgradTuition}
                  onChange={setAnnualPostgradTuition}
                  max={150000}
                  step={1000}
                />
                <MoneyInput
                  label="Annual postgrad board"
                  value={annualPostgradBoard}
                  onChange={setAnnualPostgradBoard}
                  max={75000}
                  step={500}
                />
                <RangeInput
                  label="Postgrad length"
                  value={postgradYears}
                  onChange={setPostgradYears}
                  min={1}
                  max={6}
                  suffix="yrs"
                />
                <div>
                  <div className="text-sm font-medium text-neutral-800">
                    Current annual postgrad cost
                  </div>
                  <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-950">
                    {formatMoney(annualPostgradTuition + annualPostgradBoard)}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionTitle
                icon={showAdvancedInvestment ? BarChartIcon : TrendingUpIcon}
                title={
                  showAdvancedInvestment
                    ? "Advanced tracking"
                    : "Simple Investment Assumptions"
                }
                subtitle={
                  showAdvancedInvestment
                    ? "A more realistic 529 and brokerage system with a rough tax model for brokerage withdrawal."
                    : "Use one starting amount, one monthly contribution, and one market return."
                }
              />
              <div className="flex shrink-0 items-center gap-3">
                {showAdvancedInvestment && (
                  <span className="rounded-full bg-[#d21e7c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Beta
                  </span>
                )}
                <span className="text-sm font-semibold text-neutral-700">
                  Advanced mode
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showAdvancedInvestment}
                  onClick={() => setShowAdvancedInvestment((value) => !value)}
                  className={`flex h-8 w-14 items-center rounded-full p-1 transition ${showAdvancedInvestment ? "bg-neutral-950" : "bg-neutral-300"}`}
                >
                  <span className="sr-only">Advanced tracking</span>
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${showAdvancedInvestment ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>
            {showAdvancedInvestment ? (
              <>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Let's figure out if a 529+brokerage account or just a
                  brokerage account will work best for your needs.
                </p>
                <AdvancedGenerationalTrackingPanel
                  result={optimizedAdvancedResult}
                  brokerageOnlyResult={optimizedBrokerageOnlyResult}
                  startingAmount={startingAmount}
                  setStartingAmount={setStartingAmount}
                  marketReturn={marketReturn}
                  setMarketReturn={setMarketReturn}
                  advancedMonthlyContributionNeeded={
                    optimizedAdvancedContribution?.monthlyContribution
                  }
                  advancedStartingAmount529Pct={
                    optimizedAdvancedContribution?.startingAmount529Pct
                  }
                  advancedMonthlyContribution529Pct={
                    optimizedAdvancedContribution?.monthlyContribution529Pct
                  }
                  brokerageOnlyMonthlyContributionNeeded={
                    brokerageOnlyMonthlyContributionNeeded
                  }
                  plan529Return={plan529Return}
                  setPlan529Return={setPlan529Return}
                  currentAge={advancedCurrentAge}
                  setCurrentAge={setSafeAdvancedCurrentAge}
                  currentSalary={advancedCurrentSalary}
                  setCurrentSalary={setAdvancedCurrentSalary}
                  retirementAge={advancedRetirementAge}
                  setRetirementAge={setSafeAdvancedRetirementAge}
                  retirementSalary={advancedRetirementSalary}
                  setRetirementSalary={setAdvancedRetirementSalary}
                  areContributionResultsCalculating={
                    areContributionResultsCalculating
                  }
                />
              </>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MoneyInput
                  label="Starting amount per child"
                  value={startingAmount}
                  onChange={setStartingAmount}
                  max={250000}
                  step={1000}
                />
                <MoneyInput
                  label="Monthly contribution per child"
                  value={monthlyContribution}
                  onChange={setMonthlyContribution}
                  max={15000}
                  step={100}
                  displayValue={numberFormatter.format(
                    Math.round(monthlyContribution),
                  )}
                  helperText={`Yearly contribution: ${formatMoney(monthlyContribution * 12)}`}
                />
                <div className="md:col-span-2">
                  <MarketReturnPicker
                    value={marketReturn}
                    onChange={setMarketReturn}
                  />
                </div>
                <button
                  type="button"
                  onClick={setZeroEndingContribution}
                  className="w-full rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800 md:col-span-2"
                >
                  End account with $0
                </button>
              </div>
            )}
          </Card>
        </div>
        <Card>
          <SectionTitle
            icon={BarChartIcon}
            title="Individual account balances"
            subtitle="Separate lines show each child's balance and milestone costs."
          />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeGenerationalResult.rows}
                margin={{ top: 10, right: 20, left: 0, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[0, Math.ceil(activeGenerationalResult.horizonYears)]}
                  allowDecimals={false}
                  tick={CHART_AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  height={56}
                  label={{
                    ...CHART_AXIS_LABEL,
                    value: "Years from today",
                    position: "insideBottom",
                    offset: 10,
                  }}
                />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  tickFormatter={formatCompactMoney}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={CHART_BOTTOM_LEGEND_WRAPPER_STYLE}
                />
                {activeGenerationalResult.accounts.map((account, index) => (
                  <Line
                    key={account.name}
                    type="monotone"
                    dataKey={account.name}
                    name={account.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                  />
                ))}
                {activeGenerationalResult.accounts.map((account, index) => (
                  <Line
                    key={`${account.name}-milestone-cost`}
                    type="stepAfter"
                    dataKey={`${account.name} Milestone Cost`}
                    name={`${account.name} Milestone Cost`}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    strokeOpacity={0.6}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionTitle
            icon={CalculatorIcon}
            title="Child account summary"
            subtitle="Balances, contributions, earnings, withdrawals, and milestone coverage by child."
          />
          <div className="grid gap-3 md:grid-cols-2">
            {activeGenerationalResult.accounts.map((account) => (
              <div
                key={account.name}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="text-sm font-bold text-neutral-950">
                  {account.name}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <span className="text-neutral-500">Ending balance</span>
                  <strong className="text-right">
                    {formatMoney(account.balance)}
                  </strong>
                  <span className="text-neutral-500">529 balance</span>
                  <strong className="text-right">
                    {formatMoney(account.plan529Balance)}
                  </strong>
                  <span className="text-neutral-500">Brokerage balance</span>
                  <strong className="text-right">
                    {formatMoney(account.brokerageBalance)}
                  </strong>
                  <span className="text-neutral-500">Contributed</span>
                  <strong className="text-right">
                    {formatMoney(account.contributions)}
                  </strong>
                  <span className="text-neutral-500">Interest earned</span>
                  <strong className="text-right">
                    {formatMoney(account.interest)}
                  </strong>
                  <span className="text-neutral-500">Car paid</span>
                  <strong className="text-right">
                    {formatMoney(account.carPaid)}
                  </strong>
                  <span className="text-neutral-500">College paid</span>
                  <strong className="text-right">
                    {formatMoney(account.collegePaid)}
                  </strong>
                  <span className="text-neutral-500">Postgrad paid</span>
                  <strong className="text-right">
                    {formatMoney(account.postgradPaid)}
                  </strong>
                  <span className="text-neutral-500">Down payment paid</span>
                  <strong className="text-right">
                    {formatMoney(account.downPaymentPaid)}
                  </strong>
                  <span className="text-neutral-500">Shortfall</span>
                  <strong className="text-right">
                    {formatMoney(account.shortfall)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle
            icon={CalculatorIcon}
            title="Year-by-year child table"
            subtitle="Starting balances, contributions, earnings, and milestone expenses by child for each year from today."
          />
          <div className="mt-2 max-h-[560px] overflow-y-auto rounded-2xl border border-neutral-200">
            <table className="w-full min-w-[860px] table-fixed border-separate border-spacing-0 text-left text-xs leading-tight">
              <thead className="sticky top-0 bg-white">
                <tr className="uppercase tracking-wide text-neutral-500">
                  <th className="border-b border-neutral-200 px-3 py-2">
                    Year
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2">
                    Child
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2 text-right">
                    Starting amount
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2 text-right">
                    Contributions
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2 text-right">
                    Earnings
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2 text-right">
                    Milestone expenses
                  </th>
                  <th className="border-b border-neutral-200 px-3 py-2 text-right">
                    Ending balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeGenerationalResult.yearlyAccountRows.map((row) => (
                  <tr key={`${row.year}-${row.child}`}>
                    <td className="border-b border-neutral-100 px-3 py-2 font-semibold">
                      {row.year}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 font-semibold">
                      {row.child}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 text-right">
                      {formatCompactMoney(row.startingBalance)}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 text-right">
                      {formatCompactMoney(row.contributions)}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 text-right">
                      {formatCompactMoney(row.earnings)}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 text-right">
                      {formatCompactMoney(row.milestoneExpenses)}
                    </td>
                    <td className="border-b border-neutral-100 px-3 py-2 text-right">
                      {formatCompactMoney(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function GenWizStep({ children, isActive, stepNumber, title, prompt }) {
  return (
    <motion.div
      className="mx-auto w-full sm:w-3/4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Card
        className={
          isActive ? "border-neutral-300 shadow-md" : "border-neutral-200"
        }
      >
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Step {stepNumber}
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{prompt}</p>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function GenWizNavigation({ activeStep, totalSteps, onBack }) {
  const isIntro = activeStep === 0;
  return (
    <div className="mx-auto mb-4 flex w-full items-start gap-4 sm:w-3/4">
      <div className="pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={activeStep === 0}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-current"
          />
          Back
        </button>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
          {isIntro ? "Intro" : `Step ${activeStep} of ${totalSteps}`}
        </div>
        <div className="mt-2 h-1.5 w-full min-w-[220px] overflow-hidden rounded-full bg-neutral-200 sm:w-72">
          <div
            className="h-full rounded-full bg-neutral-950 transition-all"
            style={{
              width: `${isIntro ? 0 : (activeStep / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function GenWizCalculator() {
  const [activeStep, setActiveStep] = useState(0);
  const [hasCompletedGenWiz, setHasCompletedGenWiz] = useCalculatorState(
    "genwiz",
    "hasCompleted",
    false,
  );
  const [childCount, setChildCount] = useCalculatorState(
    "genwiz",
    "childCount",
    2,
  );
  const [children, setChildren] = useCalculatorState("genwiz", "children", () =>
    makeGenerationalChildren(2),
  );
  const [startingAmount, setStartingAmount] = useCalculatorState(
    "genwiz",
    "startingAmount",
    10000,
  );
  const [monthlyContribution] = useCalculatorState(
    "genwiz",
    "monthlyContribution",
    1000,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "genwiz",
    "marketReturn",
    10,
  );
  const [inflation, setInflation] = useCalculatorState(
    "genwiz",
    "inflation",
    3,
  );
  const [carCost, setCarCost] = useCalculatorState("genwiz", "carCost", 30000);
  const [annualTuition, setAnnualTuition] = useCalculatorState(
    "genwiz",
    "annualTuition",
    35000,
  );
  const [annualBoard, setAnnualBoard] = useCalculatorState(
    "genwiz",
    "annualBoard",
    18000,
  );
  const [annualPostgradTuition, setAnnualPostgradTuition] = useCalculatorState(
    "genwiz",
    "annualPostgradTuition",
    60000,
  );
  const [annualPostgradBoard, setAnnualPostgradBoard] = useCalculatorState(
    "genwiz",
    "annualPostgradBoard",
    24000,
  );
  const [postgradYears, setPostgradYears] = useCalculatorState(
    "genwiz",
    "postgradYears",
    2,
  );
  const [downPayment, setDownPayment] = useCalculatorState(
    "genwiz",
    "downPayment",
    150000,
  );
  const [downPaymentAge, setDownPaymentAge] = useCalculatorState(
    "genwiz",
    "downPaymentAge",
    25,
  );
  const [plan529Return, setPlan529Return] = useCalculatorState(
    "genwiz",
    "plan529Return",
    7,
  );
  const [advancedCurrentAge, setAdvancedCurrentAge] = useCalculatorState(
    "genwiz",
    "advancedCurrentAge",
    40,
  );
  const [advancedCurrentSalary, setAdvancedCurrentSalary] = useCalculatorState(
    "genwiz",
    "advancedCurrentSalary",
    120000,
  );
  const [advancedRetirementAge, setAdvancedRetirementAge] = useCalculatorState(
    "genwiz",
    "advancedRetirementAge",
    65,
  );
  const [advancedRetirementSalary, setAdvancedRetirementSalary] =
    useCalculatorState("genwiz", "advancedRetirementSalary", 80000);
  const [optimizedAdvancedContribution, setOptimizedAdvancedContribution] =
    useState(null);
  const [
    brokerageOnlyMonthlyContributionNeeded,
    setBrokerageOnlyMonthlyContributionNeeded,
  ] = useState(null);
  const [
    areContributionResultsCalculating,
    setAreContributionResultsCalculating,
  ] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);
  const [calculationInputs, setCalculationInputs] = useState(null);
  const [childAccountLineVisibility, setChildAccountLineVisibility] = useState(
    {},
  );
  const maxStep = 9;
  const setSafeChildCount = (nextCount) => {
    const count = clampNumber(parseNumber(nextCount), 1, 6);
    setChildCount(count);
    setChildren((current) => makeGenerationalChildren(count, current));
  };
  const updateChild = (index, updates) =>
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index ? { ...child, ...updates } : child,
      ),
    );
  const setSafeAdvancedCurrentAge = (value) => {
    const age = clampNumber(parseNumber(value), 18, 90);
    setAdvancedCurrentAge(age);
    if (advancedRetirementAge < age) setAdvancedRetirementAge(age);
  };
  const setSafeAdvancedRetirementAge = (value) =>
    setAdvancedRetirementAge(
      clampNumber(parseNumber(value), advancedCurrentAge, 95),
    );
  const genWizInputs = useMemo(
    () => ({
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      plan529Return,
      advancedCurrentAge,
      advancedCurrentSalary,
      advancedRetirementAge,
      advancedRetirementSalary,
    }),
    [
      children,
      startingAmount,
      monthlyContribution,
      marketReturn,
      inflation,
      carCost,
      annualTuition,
      annualBoard,
      annualPostgradTuition,
      annualPostgradBoard,
      postgradYears,
      downPayment,
      downPaymentAge,
      plan529Return,
      advancedCurrentAge,
      advancedCurrentSalary,
      advancedRetirementAge,
      advancedRetirementSalary,
    ],
  );
  const confirmCalculationInputs = () => {
    setCalculationInputs(genWizInputs);
    setOptimizedAdvancedContribution(null);
    setBrokerageOnlyMonthlyContributionNeeded(null);
  };
  useEffect(() => {
    if (hasCompletedGenWiz) setActiveStep(maxStep);
  }, [hasCompletedGenWiz, maxStep]);
  useEffect(() => {
    if (activeStep === maxStep && !calculationInputs)
      confirmCalculationInputs();
  }, [activeStep, calculationInputs, genWizInputs, maxStep]);
  useEffect(() => {
    if (activeStep !== maxStep || editingChoice) return;
    confirmCalculationInputs();
  }, [activeStep, editingChoice, genWizInputs, maxStep]);
  const goToStep = (step) => {
    const safeStep = clampNumber(step, 0, maxStep);
    if (safeStep === maxStep) {
      confirmCalculationInputs();
      setHasCompletedGenWiz(true);
    }
    setActiveStep(safeStep);
  };
  const goBack = () => goToStep(activeStep - 1);
  const deferredCalculationInputs = useDeferredValue(calculationInputs);
  useEffect(() => {
    if (activeStep < maxStep || !deferredCalculationInputs) return undefined;
    let isCancelled = false;
    setAreContributionResultsCalculating(true);
    const timeout = window.setTimeout(() => {
      const nextOptimizedAdvancedContribution =
        findGenerationalOptimizedAdvancedContributions({
          children: deferredCalculationInputs.children,
          startingAmount: deferredCalculationInputs.startingAmount,
          marketReturn: deferredCalculationInputs.marketReturn,
          inflation: deferredCalculationInputs.inflation,
          carCost: deferredCalculationInputs.carCost,
          annualTuition: deferredCalculationInputs.annualTuition,
          annualBoard: deferredCalculationInputs.annualBoard,
          annualPostgradTuition:
            deferredCalculationInputs.annualPostgradTuition,
          annualPostgradBoard: deferredCalculationInputs.annualPostgradBoard,
          postgradYears: deferredCalculationInputs.postgradYears,
          downPayment: deferredCalculationInputs.downPayment,
          downPaymentAge: deferredCalculationInputs.downPaymentAge,
          plan529Return: deferredCalculationInputs.plan529Return,
          currentAge: deferredCalculationInputs.advancedCurrentAge,
          currentSalary: deferredCalculationInputs.advancedCurrentSalary,
          retirementAge: deferredCalculationInputs.advancedRetirementAge,
          retirementSalary: deferredCalculationInputs.advancedRetirementSalary,
        });
      const nextBrokerageOnlyMonthlyContribution =
        findGenerationalZeroBalanceContribution({
          children: deferredCalculationInputs.children,
          startingAmount: deferredCalculationInputs.startingAmount,
          marketReturn: deferredCalculationInputs.marketReturn,
          inflation: deferredCalculationInputs.inflation,
          carCost: deferredCalculationInputs.carCost,
          annualTuition: deferredCalculationInputs.annualTuition,
          annualBoard: deferredCalculationInputs.annualBoard,
          annualPostgradTuition:
            deferredCalculationInputs.annualPostgradTuition,
          annualPostgradBoard: deferredCalculationInputs.annualPostgradBoard,
          postgradYears: deferredCalculationInputs.postgradYears,
          downPayment: deferredCalculationInputs.downPayment,
          downPaymentAge: deferredCalculationInputs.downPaymentAge,
          advancedTracking: true,
          startingAmount529Pct: 0,
          monthlyContribution529Pct: 0,
          plan529Return: deferredCalculationInputs.marketReturn,
          currentAge: deferredCalculationInputs.advancedCurrentAge,
          currentSalary: deferredCalculationInputs.advancedCurrentSalary,
          retirementAge: deferredCalculationInputs.advancedRetirementAge,
          retirementSalary: deferredCalculationInputs.advancedRetirementSalary,
        });
      if (isCancelled) return;
      setOptimizedAdvancedContribution(nextOptimizedAdvancedContribution);
      setBrokerageOnlyMonthlyContributionNeeded(
        nextBrokerageOnlyMonthlyContribution,
      );
      setAreContributionResultsCalculating(false);
    }, 500);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeStep, deferredCalculationInputs]);
  const result = useMemo(() => {
    if (!deferredCalculationInputs) return null;
    const inputs = deferredCalculationInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: inputs.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
    });
  }, [deferredCalculationInputs]);
  const brokerageOnlyResult = useMemo(() => {
    if (!deferredCalculationInputs) return null;
    const inputs = deferredCalculationInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: inputs.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: 0,
      monthlyContribution529Pct: 0,
      plan529Return: inputs.marketReturn,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [deferredCalculationInputs]);
  const optimizedAdvancedResult = useMemo(() => {
    if (
      !result ||
      !deferredCalculationInputs ||
      !Number.isFinite(optimizedAdvancedContribution?.monthlyContribution)
    )
      return result;
    const inputs = deferredCalculationInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: optimizedAdvancedContribution.monthlyContribution,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: optimizedAdvancedContribution.startingAmount529Pct,
      monthlyContribution529Pct:
        optimizedAdvancedContribution.monthlyContribution529Pct,
      plan529Return: inputs.plan529Return,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [deferredCalculationInputs, optimizedAdvancedContribution, result]);
  const optimizedBrokerageOnlyResult = useMemo(() => {
    if (
      !brokerageOnlyResult ||
      !deferredCalculationInputs ||
      !Number.isFinite(brokerageOnlyMonthlyContributionNeeded)
    )
      return brokerageOnlyResult;
    const inputs = deferredCalculationInputs;
    return calculateGenerationalSavingsScenario({
      children: inputs.children,
      startingAmount: inputs.startingAmount,
      monthlyContribution: brokerageOnlyMonthlyContributionNeeded,
      marketReturn: inputs.marketReturn,
      inflation: inputs.inflation,
      carCost: inputs.carCost,
      annualTuition: inputs.annualTuition,
      annualBoard: inputs.annualBoard,
      annualPostgradTuition: inputs.annualPostgradTuition,
      annualPostgradBoard: inputs.annualPostgradBoard,
      postgradYears: inputs.postgradYears,
      downPayment: inputs.downPayment,
      downPaymentAge: inputs.downPaymentAge,
      advancedTracking: true,
      startingAmount529Pct: 0,
      monthlyContribution529Pct: 0,
      plan529Return: inputs.marketReturn,
      currentAge: inputs.advancedCurrentAge,
      currentSalary: inputs.advancedCurrentSalary,
      retirementAge: inputs.advancedRetirementAge,
      retirementSalary: inputs.advancedRetirementSalary,
    });
  }, [
    brokerageOnlyMonthlyContributionNeeded,
    brokerageOnlyResult,
    deferredCalculationInputs,
  ]);
  const hasAutomaticOptimizedResults =
    !areContributionResultsCalculating &&
    Number.isFinite(optimizedAdvancedContribution?.monthlyContribution) &&
    Number.isFinite(brokerageOnlyMonthlyContributionNeeded);
  const automaticOptimization =
    hasAutomaticOptimizedResults &&
    brokerageOnlyMonthlyContributionNeeded <
      optimizedAdvancedContribution.monthlyContribution
      ? "brokerage-only"
      : hasAutomaticOptimizedResults
        ? "advanced"
        : null;
  const advancedWinnerLabel =
    automaticOptimization === "brokerage-only"
      ? "Brokerage Only Option"
      : automaticOptimization === "advanced"
        ? "529+Brokerage Option"
        : "calculating";
  const activeAdvancedResult =
    automaticOptimization === "brokerage-only"
      ? optimizedBrokerageOnlyResult
      : automaticOptimization === "advanced"
        ? optimizedAdvancedResult
        : result;
  const childAccountLineColors = [
    "#f97316",
    "#0891b2",
    "#2563eb",
    "#7c3aed",
    "#f97316",
    "#0891b2",
    "#be123c",
    "#4d7c0f",
  ];
  const accountBalanceLineControls = [
    {
      key: "combined529Balance",
      label: "529 Balance",
      color: "#7c3aed",
    },
    {
      key: "combinedBrokerageBalance",
      label: "Brokerage Balance",
      color: "#2563eb",
    },
  ];
  const childAccountLineControls =
    activeAdvancedResult?.accounts.map((account, index) => ({
      key: account.name,
      label: `${account.name} Balance`,
      color: childAccountLineColors[index % childAccountLineColors.length],
    })) ?? [];
  const chartLineControls = [
    ...accountBalanceLineControls,
    ...childAccountLineControls,
  ];
  const toggleChildAccountLine = (key) =>
    setChildAccountLineVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  const advancedTotalMilestonesPaid =
    activeAdvancedResult?.rows.reduce(
      (sum, row) =>
        sum + (Number.isFinite(row.milestoneCost) ? row.milestoneCost : 0),
      0,
    ) ?? 0;
  const selectedMarketReturnPreset = MARKET_RETURN_PRESETS.find(
    (preset) => Math.abs(preset.value - marketReturn) < 0.05,
  );
  const marketReturnChoiceValue = selectedMarketReturnPreset
    ? `${formatPercent(marketReturn)} (${selectedMarketReturnPreset.label})`
    : formatPercent(marketReturn);
  const render529ReturnPicker = () => {
    const isAverageSelected = Math.abs(plan529Return - 7) < 0.05;
    return (
      <div className="space-y-3">
        <PercentInput
          label="529 rate of return"
          value={plan529Return}
          onChange={setPlan529Return}
          min={-10}
          max={20}
          helperText="Used only for 529 account growth."
        />
        <button
          type="button"
          onClick={() => setPlan529Return(7)}
          className={`w-full rounded-xl border px-3 py-2 text-center text-xs font-bold transition ${
            isAverageSelected
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          }`}
        >
          <span className="block">529 10-year average return</span>
          <span className="mt-0.5 block font-semibold">
            {formatPercent(7)}
          </span>
        </button>
        <p className="text-xs leading-5 text-neutral-500">
          10-year average based on approximate annualized historical return
          average for a moderate risk 529. This is a planning assumption, not a
          forecast.
        </p>
      </div>
    );
  };
  const currentCapitalGainsBracket = getCapitalGainsTaxBracket2025(
    advancedCurrentSalary,
  );
  const retirementCapitalGainsBracket = getCapitalGainsTaxBracket2025(
    advancedRetirementSalary,
  );
  const monthlyContributionCardClass = (isWinner) =>
    `rounded-xl border p-4 ${
      isWinner
        ? "border-2 border-emerald-500 bg-emerald-50 shadow-sm"
        : "border-neutral-200 bg-neutral-50"
    }`;
  const advancedStarting529Pct =
    Number.isFinite(optimizedAdvancedContribution?.startingAmount529Pct)
      ? optimizedAdvancedContribution.startingAmount529Pct
      : 0;
  const advancedMonthly529Pct =
    Number.isFinite(optimizedAdvancedContribution?.monthlyContribution529Pct)
      ? optimizedAdvancedContribution.monthlyContribution529Pct
      : 0;
  const advancedStarting529Amount =
    startingAmount * (advancedStarting529Pct / 100);
  const advancedStartingBrokerageAmount =
    startingAmount - advancedStarting529Amount;
  const advancedMonthly529Amount =
    Number.isFinite(optimizedAdvancedContribution?.monthlyContribution)
      ? optimizedAdvancedContribution.monthlyContribution *
        (advancedMonthly529Pct / 100)
      : 0;
  const advancedMonthlyBrokerageAmount =
    Number.isFinite(optimizedAdvancedContribution?.monthlyContribution)
      ? optimizedAdvancedContribution.monthlyContribution -
        advancedMonthly529Amount
      : 0;
  const renderAccountBreakdown = (rows) => (
    <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">{row.label}</dt>
          <dd className="font-semibold text-neutral-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
  const renderAdvancedResultCards = () => (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
          529+Brokerage Option
        </h3>
        <div
          className={monthlyContributionCardClass(
            hasAutomaticOptimizedResults &&
              optimizedAdvancedContribution.monthlyContribution <
                brokerageOnlyMonthlyContributionNeeded,
          )}
        >
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Monthly Contribution needed per child
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-950">
            {areContributionResultsCalculating ||
            !Number.isFinite(optimizedAdvancedContribution?.monthlyContribution)
              ? "Calculating..."
              : formatMoney(optimizedAdvancedContribution.monthlyContribution)}
          </div>
          {renderAccountBreakdown([
            {
              label: "Starting amount in brokerage",
              value: formatMoney(advancedStartingBrokerageAmount),
            },
            {
              label: "Starting amount in 529",
              value: formatMoney(advancedStarting529Amount),
            },
            {
              label: "Monthly contribution for 529",
              value: formatMoney(advancedMonthly529Amount),
            },
            {
              label: "Monthly contribution for brokerage",
              value: formatMoney(advancedMonthlyBrokerageAmount),
            },
          ])}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
          Brokerage Only Option
        </h3>
        <div
          className={monthlyContributionCardClass(
            hasAutomaticOptimizedResults &&
              brokerageOnlyMonthlyContributionNeeded <
                optimizedAdvancedContribution.monthlyContribution,
          )}
        >
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Monthly Contribution needed per child
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-950">
            {areContributionResultsCalculating ||
            !Number.isFinite(brokerageOnlyMonthlyContributionNeeded)
              ? "Calculating..."
              : formatMoney(brokerageOnlyMonthlyContributionNeeded)}
          </div>
          {renderAccountBreakdown([
            {
              label: "Starting amount in brokerage",
              value: formatMoney(startingAmount),
            },
            { label: "Starting amount in 529", value: formatMoney(0) },
            { label: "Monthly contribution for 529", value: formatMoney(0) },
            {
              label: "Monthly contribution for brokerage",
              value: formatMoney(brokerageOnlyMonthlyContributionNeeded),
            },
          ])}
        </div>
      </div>
    </div>
  );
  const renderAdvancedComparisonChart = () => (
    <div className="mt-5 h-[420px] rounded-xl border border-neutral-200 bg-white p-3">
      {activeAdvancedResult ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeAdvancedResult.rows}
            margin={{ top: 10, right: 20, left: 0, bottom: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, Math.ceil(activeAdvancedResult.horizonYears)]}
              allowDecimals={false}
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              height={56}
              label={{
                ...CHART_AXIS_LABEL,
                value: "Years from today",
                position: "insideBottom",
                offset: 10,
              }}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickFormatter={formatCompactMoney}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={CHART_BOTTOM_LEGEND_WRAPPER_STYLE}
            />
            <Line
              type="monotone"
              dataKey="combinedBalance"
              name="Combined Balance"
              stroke="#059669"
              strokeWidth={3}
              dot={false}
            />
            <Bar
              dataKey="milestoneCost"
              name="Milestone Cost"
              fill="#d946ef"
              fillOpacity={0.55}
              barSize={16}
            />
            {activeAdvancedResult.shortfall > 0 && (
              <Line
                type="monotone"
                dataKey="shortfall"
                name="Shortfall"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                strokeOpacity={0.6}
              />
            )}
            {childAccountLineControls
              .filter((control) => childAccountLineVisibility[control.key])
              .map((control) => (
                <Line
                  key={control.key}
                  type="monotone"
                  dataKey={control.key}
                  name={control.label}
                  stroke={control.color}
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.85}
                />
              ))}
            {accountBalanceLineControls
              .filter((control) => childAccountLineVisibility[control.key])
              .map((control) => (
                <Line
                  key={control.key}
                  type="monotone"
                  dataKey={control.key}
                  name={control.label}
                  stroke={control.color}
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.85}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm font-semibold text-neutral-500">
          Calculating your plan...
        </div>
      )}
    </div>
  );
  const userChoiceRows = [
    {
      key: "children",
      label: "Children",
      value: `${childCount} ${childCount === 1 ? "child" : "children"}`,
    },
    {
      key: "starting",
      label: "Starting amount per child",
      value: formatMoney(startingAmount),
    },
    { key: "car", label: "Car budget", value: formatMoney(carCost) },
    {
      key: "home",
      label: "Home down payment",
      value: `${formatMoney(downPayment)} at age ${downPaymentAge}`,
    },
    {
      key: "college",
      label: "College cost",
      value: `${formatMoney(annualTuition + annualBoard)} / year today`,
    },
    {
      key: "postgrad",
      label: "Postgrad cost",
      value: `${formatMoney(annualPostgradTuition + annualPostgradBoard)} / year for ${postgradYears} ${postgradYears === 1 ? "year" : "years"}`,
    },
    { key: "529", label: "529 return", value: formatPercent(plan529Return) },
    {
      key: "brokerage",
      label: "Brokerage return",
      value: marketReturnChoiceValue,
    },
    {
      key: "tax",
      label: "Tax inputs",
      value: `Age ${advancedCurrentAge}, ${formatMoney(advancedCurrentSalary)} current salary; retire at ${advancedRetirementAge} with ${formatMoney(advancedRetirementSalary)}`,
    },
  ];
  const editingChoiceLabel = userChoiceRows.find(
    (row) => row.key === editingChoice,
  )?.label;
  const renderChoiceEditor = () => {
    if (editingChoice === "children")
      return (
        <div className="space-y-5">
          <RangeInput
            label="# of children"
            value={childCount}
            onChange={setSafeChildCount}
            min={1}
            max={6}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child, index) => (
              <div
                key={child.id}
                className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="text-sm font-bold text-neutral-950">
                  Child {index + 1}
                </div>
                <RangeInput
                  label="Age"
                  value={child.age}
                  onChange={(age) => updateChild(index, { age })}
                  min={0}
                  max={24}
                />
                <SchoolYearSelect
                  label="Current grade"
                  value={child.currentGrade}
                  onChange={(currentGrade) =>
                    updateChild(index, { currentGrade })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      );
    if (editingChoice === "starting")
      return (
        <MoneyInput
          label="Starting amount per child"
          value={startingAmount}
          onChange={setStartingAmount}
          max={250000}
          step={1000}
        />
      );
    if (editingChoice === "car")
      return (
        <MoneyInput
          label="Car cost per child"
          value={carCost}
          onChange={setCarCost}
          max={150000}
          step={1000}
        />
      );
    if (editingChoice === "home")
      return (
        <div className="space-y-4">
          <MoneyInput
            label="Home down payment per child"
            value={downPayment}
            onChange={setDownPayment}
            max={1000000}
            step={5000}
          />
          <RangeInput
            label="Child's age when they receive the down payment"
            value={downPaymentAge}
            onChange={setDownPaymentAge}
            min={25}
            max={40}
            suffix="yrs"
          />
        </div>
      );
    if (editingChoice === "college")
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <MoneyInput
            label="Annual tuition"
            value={annualTuition}
            onChange={setAnnualTuition}
            max={150000}
            step={1000}
          />
          <MoneyInput
            label="Annual board"
            value={annualBoard}
            onChange={setAnnualBoard}
            max={75000}
            step={500}
          />
          <PercentInput
            label="Education inflation"
            value={inflation}
            onChange={setInflation}
            min={0}
            max={12}
            helperText="Applied to future milestone withdrawals."
          />
        </div>
      );
    if (editingChoice === "postgrad")
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <MoneyInput
            label="Annual postgrad tuition"
            value={annualPostgradTuition}
            onChange={setAnnualPostgradTuition}
            max={150000}
            step={1000}
          />
          <MoneyInput
            label="Annual postgrad board"
            value={annualPostgradBoard}
            onChange={setAnnualPostgradBoard}
            max={75000}
            step={500}
          />
          <RangeInput
            label="Postgrad length"
            value={postgradYears}
            onChange={setPostgradYears}
            min={1}
            max={6}
            suffix="yrs"
          />
        </div>
      );
    if (editingChoice === "529")
      return render529ReturnPicker();
    if (editingChoice === "brokerage")
      return (
        <MarketReturnPicker value={marketReturn} onChange={setMarketReturn} />
      );
    if (editingChoice === "tax")
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <RangeInput
              label="Current age"
              value={advancedCurrentAge}
              onChange={setSafeAdvancedCurrentAge}
              min={18}
              max={90}
              suffix="yrs"
            />
            <MoneyInput
              label="Current salary"
              value={advancedCurrentSalary}
              onChange={setAdvancedCurrentSalary}
              max={1000000}
              step={5000}
              helperText={`${formatPercent(currentCapitalGainsBracket.rate)} long-term capital gains before retirement`}
            />
          </div>
          <div className="space-y-4">
            <RangeInput
              label="Retirement age"
              value={advancedRetirementAge}
              onChange={setSafeAdvancedRetirementAge}
              min={advancedCurrentAge}
              max={95}
              suffix="yrs"
            />
            <MoneyInput
              label="Retirement salary"
              value={advancedRetirementSalary}
              onChange={setAdvancedRetirementSalary}
              max={1000000}
              step={5000}
              helperText={`${formatPercent(retirementCapitalGainsBracket.rate)} long-term capital gains after retirement`}
            />
          </div>
        </div>
      );
    return null;
  };
  const stepButton = (nextStep, label = "Continue") => (
    <button
      type="button"
      onClick={() => goToStep(nextStep)}
      className="mt-9 rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
    >
      {label}
    </button>
  );
  return (
    <CalculatorFrame
      title="GenWiz"
      description="A conversational version of the generational savings calculator. Answer one prompt at a time and the plan will build as you go."
      exportData={{
        columns: GENERATIONAL_SAVINGS_EXPORT_COLUMNS,
        rows: result?.yearlyAccountRows ?? [],
      }}
      badge="Beta"
      headerClassName="mx-auto w-full sm:w-3/4"
    >
      <div className="space-y-4">
        <GenWizNavigation
          activeStep={activeStep}
          totalSteps={maxStep}
          onBack={goBack}
        />
        {activeStep === 0 && (
          <motion.div
            className="mx-auto w-full sm:w-3/4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <Card className="border-neutral-300 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Hi,
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Let's start analyzing how you can save for your family.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">
                I’ll ask you for some information about your financial goals for
                your children, including educational expenses and other
                milestone gifts like a car or home down payment. We'll then
                estimate your anticipated returns and taxes to identify a smart
                saving plan for you and your family.
              </p>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="mt-10 rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
              >
                Let's go!
              </button>
            </Card>
          </motion.div>
        )}
        {activeStep === 1 && (
          <GenWizStep
            stepNumber={1}
            isActive
            title="Children"
            prompt="First, how many children do you have?"
          >
            <RangeInput
              label="# of children"
              value={childCount}
              onChange={setSafeChildCount}
              min={1}
              max={6}
            />
            {stepButton(2, "Next")}
          </GenWizStep>
        )}
        {activeStep === 2 && (
          <GenWizStep
            stepNumber={2}
            isActive
            title="Ages and school years"
            prompt="Got it. Can you tell me more about their ages and current grade levels? This helps me figure out graduation, car, and other timing."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child, index) => (
                <div
                  key={child.id}
                  className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="text-sm font-bold text-neutral-950">
                    Child {index + 1}
                  </div>
                  <RangeInput
                    label="Age"
                    value={child.age}
                    onChange={(age) => updateChild(index, { age })}
                    min={0}
                    max={24}
                  />
                  <SchoolYearSelect
                    label="Current grade"
                    value={child.currentGrade}
                    onChange={(currentGrade) =>
                      updateChild(index, { currentGrade })
                    }
                  />
                </div>
              ))}
            </div>
            {stepButton(3, "Next")}
          </GenWizStep>
        )}
        {activeStep === 3 && (
          <GenWizStep
            stepNumber={3}
            isActive
            title="Large non-education milestones"
            prompt="Before we dig into education, let’s budget any large non-school milestones for your children. Do you want to budget for a car or a future home down payment for them?"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
                  Car purchase for children
                </h3>
                <MoneyInput
                  label="Car cost per child"
                  value={carCost}
                  onChange={setCarCost}
                  max={150000}
                  step={1000}
                />
              </div>
              <div className="space-y-4 md:border-l md:border-neutral-200 md:pl-5">
                <h3 className="text-sm font-bold tracking-tight text-neutral-950">
                  Home Down Payment for children
                </h3>
                <MoneyInput
                  label="Home down payment per child"
                  value={downPayment}
                  onChange={setDownPayment}
                  max={1000000}
                  step={5000}
                />
                <RangeInput
                  label="Child's age when they receive the down payment"
                  value={downPaymentAge}
                  onChange={setDownPaymentAge}
                  min={25}
                  max={40}
                  suffix="yrs"
                />
              </div>
            </div>
            {stepButton(4, "Next")}
          </GenWizStep>
        )}
        {activeStep === 4 && (
          <GenWizStep
            stepNumber={4}
            isActive
            title="College costs"
            prompt="Next, let’s estimate college in today’s dollars. I’ll inflate these costs to each child’s college years."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Annual tuition"
                value={annualTuition}
                onChange={setAnnualTuition}
                max={150000}
                step={1000}
              />
              <MoneyInput
                label="Annual board"
                value={annualBoard}
                onChange={setAnnualBoard}
                max={75000}
                step={500}
              />
              <PercentInput
                label="Education inflation"
                value={inflation}
                onChange={setInflation}
                min={0}
                max={12}
                helperText="Applied to future milestone withdrawals."
              />
            </div>
            {stepButton(5, "Next")}
          </GenWizStep>
        )}
        {activeStep === 5 && (
          <GenWizStep
            stepNumber={5}
            isActive
            title="Postgrad costs"
            prompt="If you want to help with graduate school too, add those assumptions here."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Annual postgrad tuition"
                value={annualPostgradTuition}
                onChange={setAnnualPostgradTuition}
                max={150000}
                step={1000}
              />
              <MoneyInput
                label="Annual postgrad board"
                value={annualPostgradBoard}
                onChange={setAnnualPostgradBoard}
                max={75000}
                step={500}
              />
              <RangeInput
                label="Postgrad length"
                value={postgradYears}
                onChange={setPostgradYears}
                min={1}
                max={6}
                suffix="yrs"
              />
            </div>
            {stepButton(6, "Next")}
          </GenWizStep>
        )}
        {activeStep === 6 && (
          <GenWizStep
            stepNumber={6}
            isActive
            title="Starting amount"
            prompt="Enter the starting amount you think you can afford per child."
          >
            <MoneyInput
              label="Starting amount per child"
              value={startingAmount}
              onChange={setStartingAmount}
              max={250000}
              step={1000}
            />
            {stepButton(7, "Next")}
          </GenWizStep>
        )}
        {activeStep === 7 && (
          <GenWizStep
            stepNumber={7}
            isActive
            title="529 and brokerage information"
            prompt="The US offers the option of a 529 plan that lets you put in money for educational expenses and withdraw from that account tax free. We'll also examine a pure brokerage account option where you may be better off investing in a brokerage (stock) account. We'll later compare a 529 + brokerage plan with a brokerage-only plan to see which is better for you."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
                  529 Information
                </h3>
                {render529ReturnPicker()}
              </div>
              <div className="space-y-4 lg:border-l lg:border-neutral-200 lg:pl-5">
                <h3 className="mb-3 text-sm font-bold tracking-tight text-neutral-950">
                  Brokerage information
                </h3>
                <MarketReturnPicker
                  value={marketReturn}
                  onChange={setMarketReturn}
                />
              </div>
            </div>
            {stepButton(8, "Next")}
          </GenWizStep>
        )}
        {activeStep === 8 && (
          <GenWizStep
            stepNumber={8}
            isActive
            title="Capital gains tax information"
            prompt="Enter your age, salary, and retirement information below so we can determine a proper capital gains tax for brokerage withdrawals."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <RangeInput
                  label="Current age"
                  value={advancedCurrentAge}
                  onChange={setSafeAdvancedCurrentAge}
                  min={18}
                  max={90}
                  suffix="yrs"
                />
                <MoneyInput
                  label="Current salary"
                  value={advancedCurrentSalary}
                  onChange={setAdvancedCurrentSalary}
                  max={1000000}
                  step={5000}
                  helperText={`${formatPercent(currentCapitalGainsBracket.rate)} long-term capital gains before retirement`}
                />
              </div>
              <div className="space-y-4">
                <RangeInput
                  label="Retirement age"
                  value={advancedRetirementAge}
                  onChange={setSafeAdvancedRetirementAge}
                  min={advancedCurrentAge}
                  max={95}
                  suffix="yrs"
                />
                <MoneyInput
                  label="Retirement salary"
                  value={advancedRetirementSalary}
                  onChange={setAdvancedRetirementSalary}
                  max={1000000}
                  step={5000}
                  helperText={`${formatPercent(retirementCapitalGainsBracket.rate)} long-term capital gains after retirement`}
                />
              </div>
            </div>
            {stepButton(9, "Next")}
          </GenWizStep>
        )}
        {activeStep === 9 && (
          <GenWizStep
            stepNumber={9}
            isActive
            title="Your advanced savings path"
            prompt={
              <>
                Great! Based on your savings, milestone needs, and tax bracket,
                the more effective option for you is{" "}
                <strong className="font-bold text-neutral-950">
                  {advancedWinnerLabel}
                </strong>
                . You can still choose the other option if you prefer. The
                starting amount needed in each account as well as the monthly
                contributions are below.
              </>
            }
          >
            {renderAdvancedResultCards()}
            <div className="mt-5 border-t border-neutral-200 pt-5">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <SmallStat
                  label="Starting amount per child"
                  value={formatMoney(startingAmount)}
                  tone="blue"
                  alignValue
                />
                <SmallStat
                  label="Total invested"
                  value={formatCompactMoney(
                    activeAdvancedResult?.totalContributions,
                  )}
                  tone="teal"
                  alignValue
                />
                <SmallStat
                  label="Total Investment Growth"
                  value={formatCompactMoney(
                    activeAdvancedResult?.totalInterest,
                  )}
                  tone="green"
                  alignValue
                />
                <SmallStat
                  label="Milestone Costs"
                  value={formatCompactMoney(advancedTotalMilestonesPaid)}
                  tone="neutral"
                  alignValue
                />
                <SmallStat
                  label="Brokerage Taxes"
                  value={formatCompactMoney(
                    activeAdvancedResult?.totalBrokerageWithdrawalTax,
                  )}
                  tone="amber"
                  alignValue
                />
                <SmallStat
                  label="Ending Balance"
                  value={formatCompactMoney(activeAdvancedResult?.endingBalance)}
                  tone={activeAdvancedResult?.shortfall > 0 ? "amber" : "green"}
                  alignValue
                />
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-bold tracking-tight text-neutral-950">
                Your choices
              </h3>
              <div className="mt-3 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {userChoiceRows.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setEditingChoice(row.key)}
                    className="grid w-full grid-cols-1 gap-x-3 gap-y-1 py-3 pl-5 pr-3 text-left text-sm transition hover:bg-neutral-50 sm:grid-cols-[12rem_1fr]"
                  >
                    <span className="font-bold text-neutral-950">
                      {row.label}:
                    </span>
                    <span className="text-left text-neutral-700">
                      {row.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-neutral-600">
              The graph below shows the total account balance and withdrawals
              over time. The sawtooth appearance is created by the payments for
              the milestones and then the account balance increasing with
              interest after the withdrawal.
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Total invested plus investment growth is split across milestone
              costs, brokerage taxes, any ending balance, and any unpaid
              shortfall.
            </p>
            {renderAdvancedComparisonChart()}
            <div className="mt-3 flex flex-wrap gap-2">
              {chartLineControls.map((control) => {
                const isVisible = Boolean(
                  childAccountLineVisibility[control.key],
                );
                return (
                  <button
                    key={control.key}
                    type="button"
                    onClick={() => toggleChildAccountLine(control.key)}
                    aria-pressed={isVisible}
                    className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold transition ${
                      isVisible
                        ? "border-neutral-300 bg-neutral-100 text-neutral-950"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: control.color }}
                    />
                    {control.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs italic leading-5 text-neutral-500">
              This feature is still in beta, we're attempting to get the values
              to $0, but there are some rounding errors still visible
            </p>
          </GenWizStep>
        )}
        {editingChoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Edit choice
                  </div>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                    {editingChoiceLabel}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingChoice(null)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 transition hover:border-neutral-400"
                >
                  Close
                </button>
              </div>
              {renderChoiceEditor()}
              <div className="mt-6 flex justify-end border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === maxStep) confirmCalculationInputs();
                    setEditingChoice(null);
                  }}
                  className="rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CalculatorFrame>
  );
}

function calculateRetirementScenario({
  currentAge,
  retirementAge,
  currentNetWorth,
  yearlyContribution,
  inflation,
  marketReturn,
  yearlyRetirementSpending,
  retirementReturn,
  taxFilingStatus = "single",
  useLifeExpectancy = false,
  lifeExpectancy = 100,
}) {
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const maxRetirementYears = useLifeExpectancy
    ? Math.max(0, lifeExpectancy - retirementAge)
    : 45;
  const retirementTaxBracket = getRetirementTaxBracket2025(
    yearlyRetirementSpending,
    taxFilingStatus,
  );
  const taxRate = retirementTaxBracket.rate / 100;
  let portfolio = currentNetWorth;
  let totalContributions = 0;
  const rows = [
    {
      age: currentAge,
      year: 0,
      phase: "Accumulation",
      portfolio: Math.round(portfolio),
      contribution: 0,
      grossWithdrawal: 0,
      afterTaxSpending: 0,
      shortfall: 0,
    },
  ];
  for (let year = 1; year <= yearsToRetirement; year++) {
    portfolio = portfolio * (1 + marketReturn / 100) + yearlyContribution;
    totalContributions += yearlyContribution;
    rows.push({
      age: currentAge + year,
      year,
      phase: "Accumulation",
      portfolio: Math.round(portfolio),
      contribution: Math.round(yearlyContribution),
      grossWithdrawal: 0,
      afterTaxSpending: 0,
      shortfall: 0,
    });
  }
  const portfolioAtRetirement = portfolio;
  const firstYearSpending =
    yearlyRetirementSpending * safePow(1 + inflation / 100, yearsToRetirement);
  let retirementYearsFunded = 0;
  let depletedAge = null;
  let shortfall = 0;
  for (
    let retirementYear = 1;
    retirementYear <= maxRetirementYears;
    retirementYear++
  ) {
    const spending =
      firstYearSpending * safePow(1 + inflation / 100, retirementYear - 1);
    const grossWithdrawal = taxRate >= 1 ? spending : spending / (1 - taxRate);
    const availablePortfolio = portfolio * (1 + retirementReturn / 100);
    const endingPortfolio = availablePortfolio - grossWithdrawal;
    if (endingPortfolio >= 0) retirementYearsFunded = retirementYear;
    else shortfall += Math.abs(endingPortfolio);
    if (endingPortfolio <= 0 && depletedAge === null) {
      depletedAge = retirementAge + retirementYear;
    }
    portfolio = Math.max(0, endingPortfolio);
    rows.push({
      age: retirementAge + retirementYear,
      year: yearsToRetirement + retirementYear,
      phase: "Retirement",
      portfolio: Math.round(portfolio),
      contribution: 0,
      grossWithdrawal: Math.round(grossWithdrawal),
      afterTaxSpending: Math.round(spending),
      shortfall: Math.round(shortfall),
    });
  }
  const finalPortfolio = Math.max(0, portfolio);
  return {
    rows,
    retirementTaxBracket,
    taxRate: retirementTaxBracket.rate,
    yearsToRetirement,
    totalContributions,
    portfolioAtRetirement,
    firstYearSpending,
    retirementYearsFunded,
    depletedAge,
    finalPortfolio,
    maxRetirementYears,
  };
}

function TaxBracketDisplay({ bracket }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-neutral-800">
          Auto tax bracket
        </span>
        <strong className="text-lg font-semibold text-neutral-950">
          {formatPercent(bracket.rate)}
        </strong>
      </div>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        {bracket.label}. Uses 2025 federal{" "}
        {bracket.filingStatusLabel.toLowerCase()} marginal brackets and treats
        spending as taxable income.
      </p>
    </div>
  );
}

function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useCalculatorState(
    "retirement",
    "currentAge",
    40,
  );
  const [retirementAge, setRetirementAge] = useCalculatorState(
    "retirement",
    "retirementAge",
    65,
  );
  const [currentNetWorth, setCurrentNetWorth] = useCalculatorState(
    "retirement",
    "currentNetWorth",
    500000,
  );
  const [yearlyContribution, setYearlyContribution] = useCalculatorState(
    "retirement",
    "yearlyContribution",
    50000,
  );
  const [inflation, setInflation] = useCalculatorState(
    "retirement",
    "inflation",
    3,
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "retirement",
    "marketReturn",
    10,
  );
  const [yearlyRetirementSpending, setYearlyRetirementSpending] =
    useCalculatorState("retirement", "yearlyRetirementSpending", 120000);
  const [retirementReturn, setRetirementReturn] = useCalculatorState(
    "retirement",
    "retirementReturn",
    5,
  );
  const [taxFilingStatus, setTaxFilingStatus] = useCalculatorState(
    "retirement",
    "taxFilingStatus",
    "single",
  );
  const [showPresentValueLine, setShowPresentValueLine] = useCalculatorState(
    "retirement",
    "showPresentValueLine",
    false,
  );
  const [useLifeExpectancy, setUseLifeExpectancy] = useCalculatorState(
    "retirement",
    "useLifeExpectancy",
    false,
  );
  const [lifeExpectancy, setLifeExpectancy] = useCalculatorState(
    "retirement",
    "lifeExpectancy",
    100,
  );
  const safeSetCurrentAge = (value) => {
    const age = clampNumber(parseNumber(value), 18, 90);
    setCurrentAge(age);
    if (retirementAge < age) setRetirementAge(age);
  };
  const safeSetRetirementAge = (value) =>
    setRetirementAge(clampNumber(parseNumber(value), currentAge, 95));
  const result = useMemo(
    () =>
      calculateRetirementScenario({
        currentAge,
        retirementAge,
        currentNetWorth,
        yearlyContribution,
        inflation,
        marketReturn,
        yearlyRetirementSpending,
        retirementReturn,
        taxFilingStatus,
        useLifeExpectancy,
        lifeExpectancy,
      }),
    [
      currentAge,
      retirementAge,
      currentNetWorth,
      yearlyContribution,
      inflation,
      marketReturn,
      yearlyRetirementSpending,
      retirementReturn,
      taxFilingStatus,
      useLifeExpectancy,
      lifeExpectancy,
    ],
  );
  const chartData = result.rows.map((row) => ({
    ...row,
    Portfolio: row.portfolio,
    "Present Value Portfolio":
      row.portfolio / safePow(1 + inflation / 100, row.year),
    "Gross Withdrawal": row.grossWithdrawal,
    Shortfall: row.shortfall,
  }));
  const fundedDetail = result.depletedAge
    ? `Funds run out around age ${result.depletedAge}.`
    : "Funds last through the modeled retirement period.";
  return (
    <CalculatorFrame
      title="Retirement Calculator"
      description="Project net worth at retirement, inflation-adjusted spending, retirement withdrawals, and an auto-filled 2025 federal marginal tax bracket."
      exportData={{ columns: RETIREMENT_EXPORT_COLUMNS, rows: result.rows }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <SmallStat
            label="At retirement"
            value={formatCompactMoney(result.portfolioAtRetirement)}
            tone="green"
          />
          <SmallStat
            label="First-year spending"
            value={formatCompactMoney(result.firstYearSpending)}
            detail="Inflation adjusted"
            tone="blue"
          />
          <SmallStat
            label="Tax bracket"
            value={formatPercent(result.taxRate)}
            detail={result.retirementTaxBracket.filingStatusLabel}
          />
          <SmallStat
            label="Retirement runway"
            value={`${result.retirementYearsFunded} yrs`}
            detail={fundedDetail}
            tone={result.depletedAge ? "amber" : "green"}
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
          <div>
            <Card>
              <SectionTitle
                icon={CalculatorIcon}
                title="Main Assumptions"
                subtitle="Current age, retirement age, starting net worth, annual savings, and inflation."
              />
              <div className="space-y-4">
                <RangeInput
                  label="Current age"
                  value={currentAge}
                  onChange={safeSetCurrentAge}
                  min={18}
                  max={90}
                  suffix="yrs"
                />
                <RangeInput
                  label="Retirement age"
                  value={retirementAge}
                  onChange={safeSetRetirementAge}
                  min={currentAge}
                  max={95}
                  suffix="yrs"
                  helperText={`${result.yearsToRetirement} years until retirement`}
                />
                <MoneyInput
                  label="Current net worth"
                  value={currentNetWorth}
                  onChange={setCurrentNetWorth}
                  max={10000000}
                  step={10000}
                />
                <MoneyInput
                  label="Yearly contribution"
                  value={yearlyContribution}
                  onChange={setYearlyContribution}
                  max={500000}
                  step={1000}
                  helperText={`${formatMoney(result.totalContributions)} contributed before retirement`}
                />
                <PercentInput
                  label="Anticipated inflation"
                  value={inflation}
                  onChange={setInflation}
                  min={0}
                  max={10}
                  helperText="Used to inflate retirement spending."
                />
                <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                  <input
                    type="checkbox"
                    checked={useLifeExpectancy}
                    onChange={(event) =>
                      setUseLifeExpectancy(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-neutral-950"
                  />
                  <span>
                    <strong className="text-neutral-950">
                      Use life expectancy cap
                    </strong>
                    <br />
                    Caps the graph at the selected age.
                  </span>
                </label>
                {useLifeExpectancy && (
                  <RangeInput
                    label="Life expectancy"
                    value={lifeExpectancy}
                    onChange={setLifeExpectancy}
                    min={0}
                    max={120}
                    suffix="yrs"
                    helperText={`Graph ends at age ${lifeExpectancy}.`}
                  />
                )}
              </div>
            </Card>
          </div>
          <Card className="flex h-full flex-col">
            <SectionTitle
              icon={BarChartIcon}
              title="Retirement path"
              subtitle={`${formatMoney(result.portfolioAtRetirement)} projected at age ${retirementAge}.`}
            />
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="Portfolio"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  {showPresentValueLine && (
                    <Line
                      type="monotone"
                      dataKey="Present Value Portfolio"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="Gross Withdrawal"
                    stroke="#d946ef"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="Shortfall"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowPresentValueLine((value) => !value)}
                className={`rounded-full border px-3 py-2 ${showPresentValueLine ? "border-sky-300 bg-sky-50 text-sky-800" : "border-neutral-200 bg-white text-neutral-500"}`}
              >
                Present value
              </button>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Market Investment Assumption"
            />
            <MarketReturnPicker
              value={marketReturn}
              onChange={setMarketReturn}
            />
          </Card>
          <Card>
            <SectionTitle
              icon={DollarIcon}
              title="Retirement Spending and Interest"
              subtitle="Spending is entered in current dollars, then inflated to retirement."
            />
            <div className="space-y-4">
              <MoneyInput
                label="Anticipated yearly retirement spending"
                value={yearlyRetirementSpending}
                onChange={setYearlyRetirementSpending}
                max={1000000}
                step={5000}
                helperText={`${formatMoney(result.firstYearSpending)} in first retirement year`}
              />
              <div>
                <div className="mb-2 text-sm font-medium text-neutral-800">
                  Tax filing status
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RETIREMENT_TAX_FILING_STATUSES.map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setTaxFilingStatus(status.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${taxFilingStatus === status.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"}`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              <PercentInput
                label="Anticipated retirement rate of return"
                value={retirementReturn}
                onChange={setRetirementReturn}
                min={-10}
                max={20}
              />
              <TaxBracketDisplay bracket={result.retirementTaxBracket} />
            </div>
          </Card>
        </div>
      </div>
    </CalculatorFrame>
  );
}

function getMedicalAnnualCost(age, healthStatus = "healthy") {
  const status = MEDICAL_HEALTH_STATUS_OPTIONS.some(
    (option) => option.id === healthStatus,
  )
    ? healthStatus
    : "healthy";
  if (age <= MEDICAL_ANNUAL_COSTS_BY_AGE[0].age)
    return MEDICAL_ANNUAL_COSTS_BY_AGE[0][status];
  const last =
    MEDICAL_ANNUAL_COSTS_BY_AGE[MEDICAL_ANNUAL_COSTS_BY_AGE.length - 1];
  if (age >= last.age) return last[status];
  for (let index = 1; index < MEDICAL_ANNUAL_COSTS_BY_AGE.length; index++) {
    const previous = MEDICAL_ANNUAL_COSTS_BY_AGE[index - 1];
    const next = MEDICAL_ANNUAL_COSTS_BY_AGE[index];
    if (age <= next.age) {
      const progress = (age - previous.age) / (next.age - previous.age);
      return previous[status] + (next[status] - previous[status]) * progress;
    }
  }
  return last[status];
}
function getMedicalSexAnnualCost(age, sex = "women") {
  const costKey = sex === "men" ? "men" : "women";
  if (age <= MEDICAL_SEX_COSTS_BY_AGE[0].age)
    return MEDICAL_SEX_COSTS_BY_AGE[0][costKey];
  const last = MEDICAL_SEX_COSTS_BY_AGE[MEDICAL_SEX_COSTS_BY_AGE.length - 1];
  if (age >= last.age) return last[costKey];
  for (let index = 1; index < MEDICAL_SEX_COSTS_BY_AGE.length; index++) {
    const previous = MEDICAL_SEX_COSTS_BY_AGE[index - 1];
    const next = MEDICAL_SEX_COSTS_BY_AGE[index];
    if (age <= next.age) {
      const progress = (age - previous.age) / (next.age - previous.age);
      return previous[costKey] + (next[costKey] - previous[costKey]) * progress;
    }
  }
  return last[costKey];
}

function calculateMedicalCostsScenario({
  startingAge,
  lifeExpectancy,
  yearlyInvestedAmount,
  employeeCostPerYear,
  healthStatus,
  marketReturn,
  inflation,
}) {
  const years = Math.max(0, lifeExpectancy - startingAge);
  let investedBalance = 0;
  let cumulativeInvested = 0;
  let cumulativeEmployeeCosts = 0;
  let cumulativeCashCosts = 0;
  let shortfall = 0;
  let firstShortfallAge = null;
  const rows = [];
  for (let year = 0; year <= years; year++) {
    const age = startingAge + year;
    const inflatedYearlyInvestment =
      yearlyInvestedAmount * safePow(1 + inflation / 100, year);
    const inflatedEmployeeCost =
      employeeCostPerYear * safePow(1 + inflation / 100, year);
    const cashMedicalCost =
      getMedicalAnnualCost(age, healthStatus) *
      safePow(1 + inflation / 100, year);
    investedBalance =
      investedBalance * (1 + marketReturn / 100) + inflatedYearlyInvestment;
    cumulativeInvested += inflatedYearlyInvestment;
    cumulativeEmployeeCosts += inflatedEmployeeCost;
    cumulativeCashCosts += cashMedicalCost;
    const endingBalance = investedBalance - cashMedicalCost;
    if (endingBalance < 0) {
      shortfall += Math.abs(endingBalance);
      if (firstShortfallAge === null) firstShortfallAge = age;
    }
    investedBalance = Math.max(0, endingBalance);
    rows.push({
      age,
      year,
      yearlyInvestedAmount: Math.round(inflatedYearlyInvestment),
      employeeCost: Math.round(inflatedEmployeeCost),
      cashMedicalCost: Math.round(cashMedicalCost),
      investedBalance: Math.round(investedBalance),
      cumulativeInvested: Math.round(cumulativeInvested),
      cumulativeEmployeeCosts: Math.round(cumulativeEmployeeCosts),
      cumulativeCashCosts: Math.round(cumulativeCashCosts),
      shortfall: Math.round(shortfall),
    });
  }
  const endingBalance = rows[rows.length - 1]?.investedBalance || 0;
  return {
    rows,
    years,
    endingBalance,
    cumulativeInvested,
    cumulativeEmployeeCosts,
    cumulativeCashCosts,
    shortfall,
    firstShortfallAge,
  };
}

function MedicalCostsCalculator() {
  const [startingAge, setStartingAge] = useCalculatorState(
    "medical-costs",
    "startingAge",
    35,
  );
  const [lifeExpectancy, setLifeExpectancy] = useCalculatorState(
    "medical-costs",
    "lifeExpectancy",
    85,
  );
  const [yearlyInvestedAmount, setYearlyInvestedAmount] = useCalculatorState(
    "medical-costs",
    "yearlyInvestedAmount",
    12000,
  );
  const [employeeCostPerYear, setEmployeeCostPerYear] = useCalculatorState(
    "medical-costs",
    "employeeCostPerYear",
    6000,
  );
  const [healthStatus, setHealthStatus] = useCalculatorState(
    "medical-costs",
    "healthStatus",
    "healthy",
  );
  const [marketReturn, setMarketReturn] = useCalculatorState(
    "medical-costs",
    "marketReturn",
    10,
  );
  const [inflation, setInflation] = useCalculatorState(
    "medical-costs",
    "inflation",
    4,
  );
  const safeSetStartingAge = (value) => {
    const age = clampNumber(parseNumber(value), 0, 120);
    setStartingAge(age);
    if (lifeExpectancy < age) setLifeExpectancy(age);
  };
  const safeSetLifeExpectancy = (value) =>
    setLifeExpectancy(clampNumber(parseNumber(value), startingAge, 120));
  const result = useMemo(
    () =>
      calculateMedicalCostsScenario({
        startingAge,
        lifeExpectancy,
        yearlyInvestedAmount,
        employeeCostPerYear,
        healthStatus,
        marketReturn,
        inflation,
      }),
    [
      startingAge,
      lifeExpectancy,
      yearlyInvestedAmount,
      employeeCostPerYear,
      healthStatus,
      marketReturn,
      inflation,
    ],
  );
  const chartData = result.rows.map((row) => ({
    ...row,
    "Invested Balance": row.investedBalance,
    "Cumulative Invested": row.cumulativeInvested,
    "Cumulative Employee Costs": row.cumulativeEmployeeCosts,
    "Cumulative Medical Costs": row.cumulativeCashCosts,
    Shortfall: row.shortfall,
  }));
  const sexCostChartData = useMemo(
    () =>
      Array.from({ length: 81 }, (_, index) => {
        const age = index + 20;
        return {
          age,
          Women: Math.round(getMedicalSexAnnualCost(age, "women")),
          Men: Math.round(getMedicalSexAnnualCost(age, "men")),
        };
      }),
    [],
  );
  const selectedHealthStatus =
    MEDICAL_HEALTH_STATUS_OPTIONS.find(
      (option) => option.id === healthStatus,
    ) || MEDICAL_HEALTH_STATUS_OPTIONS[0];
  const currentAnnualCost = getMedicalAnnualCost(startingAge, healthStatus);
  const totalInvestmentProfit = Math.max(
    0,
    result.endingBalance +
      result.cumulativeCashCosts -
      result.cumulativeInvested,
  );
  const fundedDetail =
    result.shortfall > 0
      ? `${formatCompactMoney(result.shortfall)} uncovered`
      : "Cash costs covered";
  const shortfallDetail =
    result.firstShortfallAge === null
      ? "No shortfall"
      : `Starts at age ${result.firstShortfallAge}`;
  return (
    <CalculatorFrame
      title="Medical Costs Calculator"
      badge="Beta"
      description="Compare investing cash directly with drawing from it for age- and health-status-based medical costs later."
      exportData={{ columns: MEDICAL_COST_EXPORT_COLUMNS, rows: result.rows }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SmallStat
            label="Ending balance"
            value={formatCompactMoney(result.endingBalance)}
            tone={result.shortfall > 0 ? "amber" : "green"}
            detail={fundedDetail}
          />
          <SmallStat
            label="Shortfall"
            value={formatCompactMoney(result.shortfall)}
            detail={shortfallDetail}
            tone="red"
          />
          <SmallStat
            label="Total investment profit"
            value={formatCompactMoney(totalInvestmentProfit)}
            detail={`Cumulative invested: ${formatCompactMoney(result.cumulativeInvested)}`}
            tone="blue"
          />
          <SmallStat
            label="Total medical costs"
            value={formatCompactMoney(result.cumulativeCashCosts)}
            tone="magenta"
          />
          <SmallStat
            label="Total employee spending"
            value={formatCompactMoney(result.cumulativeEmployeeCosts)}
            tone="amber"
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
          <Card>
            <SectionTitle
              icon={MedicalIcon}
              title="Medical Cost Inputs"
              subtitle="Set age range, health profile, and yearly amount invested for future cash medical costs."
            />
            <div className="space-y-4">
              <RangeInput
                label="Starting age"
                value={startingAge}
                onChange={safeSetStartingAge}
                min={0}
                max={120}
                suffix="yrs"
                helperText={`${selectedHealthStatus.label} annual cost at this age: ${formatMoney(currentAnnualCost)}`}
              />
              <RangeInput
                label="Life expectancy"
                value={lifeExpectancy}
                onChange={safeSetLifeExpectancy}
                min={startingAge}
                max={120}
                suffix="yrs"
                helperText={`${result.years} modeled years`}
              />
              <div>
                <div className="mb-2 text-sm font-medium text-neutral-800">
                  Health profile
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MEDICAL_HEALTH_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setHealthStatus(option.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${healthStatus === option.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <MoneyInput
                label="Yearly invested amount"
                value={yearlyInvestedAmount}
                onChange={setYearlyInvestedAmount}
                max={100000}
                step={500}
                helperText="Invested each year, then cash medical costs are withdrawn."
              />
              <MoneyInput
                label="Employee costs per year"
                value={employeeCostPerYear}
                onChange={setEmployeeCostPerYear}
                max={100000}
                step={500}
                helperText="Shown as a cumulative comparison line on the graph."
              />
            </div>
          </Card>
          <Card className="flex min-h-[560px] flex-col">
            <SectionTitle
              icon={BarChartIcon}
              title="Invested vs. cash medical costs"
              subtitle={`${formatMoney(result.endingBalance)} invested balance at age ${lifeExpectancy}.`}
            />
            <div className="min-h-[440px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactMoney}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="Invested Balance"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cumulative Invested"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cumulative Employee Costs"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cumulative Medical Costs"
                    stroke="#d946ef"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Shortfall"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionTitle
              icon={TrendingUpIcon}
              title="Investment assumptions"
            />
            <div className="space-y-4">
              <MarketReturnPicker
                value={marketReturn}
                onChange={setMarketReturn}
              />
              <PercentInput
                label="Medical cost inflation"
                value={inflation}
                onChange={setInflation}
                min={0}
                max={15}
                helperText="Inflates both the yearly invested amount and selected health-profile medical costs."
              />
            </div>
          </Card>
          <Card>
            <SectionTitle
              icon={CalculatorIcon}
              title="Annual medical cost table"
            />
            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-neutral-200">
              <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-0 text-left text-xs">
                <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="border-b border-neutral-200 px-3 py-2">
                      Age
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2 text-right">
                      Healthy
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2 text-right">
                      Unhealthy
                    </th>
                    <th className="border-b border-neutral-200 px-3 py-2 text-right">
                      Very unhealthy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MEDICAL_ANNUAL_COSTS_BY_AGE.map((row) => (
                    <tr key={row.age}>
                      <td className="border-b border-neutral-100 px-3 py-2 font-semibold">
                        {row.age}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(row.healthy)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(row.unhealthy)}
                      </td>
                      <td className="border-b border-neutral-100 px-3 py-2 text-right">
                        {formatMoney(row["very-unhealthy"])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              Figures are annual estimates in 2024 dollars.
            </p>
          </Card>
        </div>
        <Card>
          <SectionTitle
            icon={BarChartIcon}
            title="Women and Men annual Medicaid cost"
            subtitle="Estimated annual Medicaid costs by age from men and women."
          />
          <div className="h-[460px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sexCostChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <ReferenceArea
                  x1={20}
                  x2={45}
                  fill="#d4d4d4"
                  fillOpacity={0.22}
                  label={{
                    value: "Reproductive years",
                    position: "insideTop",
                    fill: "#737373",
                    fontSize: CHART_ANNOTATION_FONT_SIZE,
                  }}
                />
                <ReferenceArea
                  x1={83}
                  x2={100}
                  fill="#d4d4d4"
                  fillOpacity={0.22}
                  label={{
                    value: "Nursing home years",
                    position: "insideTop",
                    fill: "#737373",
                    fontSize: CHART_ANNOTATION_FONT_SIZE,
                  }}
                />
                <ReferenceLine
                  x={65}
                  stroke="#737373"
                  strokeDasharray="4 4"
                  label={{
                    value: "Medicare takes over",
                    position: "insideTopRight",
                    fill: "#737373",
                    fontSize: CHART_ANNOTATION_FONT_SIZE,
                  }}
                />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[20, 100]}
                  allowDecimals={false}
                  tick={CHART_AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={CHART_AXIS_TICK}
                  tickFormatter={formatCompactMoney}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={CHART_LEGEND_WRAPPER_STYLE} />
                <Line
                  type="monotone"
                  dataKey="Women"
                  stroke="#D85A30"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Men"
                  stroke="#378ADD"
                  strokeWidth={3}
                  dot={false}
                  strokeDasharray="6 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3 text-xs leading-5 text-neutral-600">
            <p>
              <span className="font-semibold text-neutral-800">
                Why women cost more at 20-45:
              </span>{" "}
              Medicaid is the single largest payer of maternity care in the
              U.S., covering nearly half of all births. Prenatal visits, labor
              and delivery, postpartum care, and family planning services all
              accumulate significantly across those years.
            </p>
            <p>
              <span className="font-semibold text-neutral-800">
                The middle-age convergence, roughly 45-73:
              </span>{" "}
              Men's costs climb sharply as cardiovascular disease, COPD, and
              alcohol/substance-related conditions hit earlier and harder.
              Women's reproductive costs fade. The two lines run close together,
              with men briefly spending more per year around the 55-65 window in
              this model.
            </p>
            <p>
              <span className="font-semibold text-neutral-800">
                Why women pull far ahead after 75:
              </span>{" "}
              Two compounding factors: women live about 5-6 years longer on
              average, and they are significantly more likely to spend time in
              nursing facilities, which Medicaid covers and Medicare does not.
              Women over 85 make up the majority of nursing home residents, and
              those stays can run $80,000-$120,000/year. Men who survive to very
              old age tend to have spousal caregivers at home longer, reducing
              formal Medicaid-paid care.
            </p>
            <p>
              <span className="font-semibold text-neutral-800">
                The selection effect at very old ages:
              </span>{" "}
              Men who reach 90+ on Medicaid are a particularly survivor-selected
              group, which moderates their cost curve somewhat relative to women
              of the same age.
            </p>
            <p className="italic text-neutral-500">
              Estimates reflect average Medicaid expenditures per enrolled
              beneficiary including acute care, behavioral health, pharmacy, and
              long-term services and supports. Women's costs at 20-45 are
              elevated by pregnancy, maternity, and reproductive health
              services. Men's costs rise sharply in middle age due to earlier
              onset of cardiovascular disease and higher rates of substance use
              treatment. At 65+, women's costs significantly exceed men's due to
              greater long-term care utilization and longer average survival in
              nursing facilities. Sources: CMS MBES/CBES, KFF Medicaid analyses,
              MACPAC reports. Figures in 2024 dollars.
            </p>
          </div>
        </Card>
      </div>
    </CalculatorFrame>
  );
}

function LandingPage() {
  const renderCard = (calculator) => {
    const Icon = calculator.icon;
    return (
      <Link
        key={calculator.id}
        href={calculatorRouteMap[calculator.id]}
        className="group relative flex min-h-[330px] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md md:w-[calc(50%-10px)] min-[1440px]:w-[calc(25%-15px)]"
      >
        {calculator.beta && (
          <div className="absolute right-[-38px] top-5 z-10 w-36 rotate-45 bg-[#d21e7c] py-1 text-center text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
            Beta
          </div>
        )}
        <div className="mb-5 flex h-12 items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 leading-none transition group-hover:bg-neutral-950 group-hover:text-white">
            <Icon className="block h-5 w-5" />
          </div>
        </div>
        <div className="flex min-h-[96px] flex-col items-start">
          <h2 className="min-h-[44px] text-lg font-semibold leading-tight tracking-tight text-neutral-950">
            {calculator.name}
          </h2>
          <div className="my-3 h-px w-full bg-neutral-200" />
          <p className="text-sm font-semibold leading-5 text-neutral-700">
            {calculator.subtitle}
          </p>
        </div>
        <p className="mt-5 text-xs leading-5 text-neutral-600">
          {calculator.description}
        </p>
        <div className="min-h-8 flex-1" />
      </Link>
    );
  };

  return (
    <motion.div
      key="landing-page"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section>
        <div className="mx-auto flex max-w-[380px] flex-wrap justify-center gap-5 md:max-w-[780px] min-[1440px]:max-w-[1580px]">
          {calculators.map(renderCard)}
        </div>
      </section>
    </motion.div>
  );
}
const calculators = [
  {
    id: "rent-vs-buy",
    name: "Rent vs. Buy Calculator",
    subtitle: "Should I rent or buy?",
    shortName: "Rent vs. Buy",
    description:
      "Use the calculator to help you decide whether renting or buying a property is a better decision. Inputs include real estate values, rental values, as well as inflation, maintenance, and 30 year index investment projections.",
    icon: HomeIcon,
    component: RentVsBuyCalculator,
  },
  {
    id: "rental-property-2",
    name: "Rental Property vs. Market Investment Calculator",
    subtitle: "Should I buy a property or invest the money?",
    shortName: "Rental vs. Market",
    description:
      "Use this calculator to decide if a rental property will be more profitable vs. a simple market investment over time. Inputs include real estate values, rental income, inflation, maintenance, and 30 year index investment projections.",
    icon: BuildingIcon,
    component: RentalPropertyCalculator,
  },
  {
    id: "home-value",
    name: "Home Value vs. Market Investment Calculator",
    subtitle: "Did I make money buying and selling my house?",
    shortName: "Home vs. Market",
    description:
      "Use this calculator to understand if you made or lost money buying a property vs. investing in the market.",
    icon: ScaleIcon,
    component: HomeValueCalculator,
  },
  {
    id: "auto-cost",
    name: "New Car vs. Used Car vs. Leased Car Calculator",
    subtitle: "Should I buy new or used?",
    shortName: "New/Used/Lease",
    description:
      "Use this calculator to compare the estimated cost of buying a new car versus a used car over time.",
    icon: CarIcon,
    component: AutoCostCalculator,
  },
  {
    id: "college-savings",
    name: "College Savings Calculator",
    subtitle: "Am I saving enough for college?",
    shortName: "College",
    description:
      "Project college savings for one or more children with monthly contributions, index return assumptions, education inflation, and July tuition plus board withdrawals.",
    icon: GraduationIcon,
    component: CollegeSavingsCalculator,
  },
  {
    id: "retirement",
    name: "Retirement Calculator",
    subtitle: "Am I on track to retire?",
    shortName: "Retirement",
    description:
      "Project retirement savings, inflation-adjusted spending, withdrawal needs, retirement returns, and an auto-filled 2025 federal tax bracket.",
    icon: CalculatorIcon,
    component: RetirementCalculator,
  },
  {
    id: "generational-savings",
    name: "Generational Savings",
    subtitle: "How much should I save for my kids' future?",
    shortName: "Generational",
    description:
      "Plan for a larger family savings path that can cover college, cars, home down payments, and postgraduate degrees for your children.",
    icon: GiftIcon,
    component: GenerationalSavingsCalculator,
  },
  {
    id: "genwiz",
    name: "GenWiz",
    subtitle: "Guided family savings planning",
    shortName: "GenWiz",
    description:
      "Walk through the generational savings assumptions one question at a time in a conversational flow.",
    icon: GiftIcon,
    component: GenWizCalculator,
    beta: true,
  },
  {
    id: "medical-costs",
    name: "Medical Costs Calculator",
    subtitle: "Self fund care through investment or pay into insurance?",
    shortName: "Medical",
    description:
      "Compare a yearly invested amount with age-based medical cash costs later in life.",
    icon: MedicalIcon,
    component: MedicalCostsCalculator,
    beta: true,
  },
];

const calculatorRouteMap = {
  "rent-vs-buy": "/rent-vs-buy",
  "rental-property-2": "/rental-property-eval",
  "auto-cost": "/auto-cost",
  "medical-costs": "/medical-costs",
  retirement: "/retirement",
  "home-value": "/home-value-vs-market",
  "college-savings": "/college-savings",
  "generational-savings": "/generational-savings",
  genwiz: "/genwiz",
};

const pageCopy = {
  landing: {
    title: "Planning calculators for major money decisions",
    body: [
      "These calculators help compare common financial tradeoffs involving homes, rental properties, vehicles, and market investing. Each tool uses the assumptions you enter so you can test different prices, rates, costs, timelines, and investment return scenarios.",
      "Use the calculators as a planning starting point, then verify the numbers with current quotes, local tax rules, financing terms, and qualified professionals before making a real purchase or investment decision.",
    ],
    sections: [
      {
        title: "Real estate tools",
        body: "Compare renting versus buying, evaluate a rental property, or measure a home purchase against a market investment alternative.",
      },
      {
        title: "Vehicle tools",
        body: "Estimate the cost of buying new, buying used, or leasing while comparing saved cash against a market investment alternative.",
      },
    ],
  },
  "rent-vs-buy": {
    title: "About this rent vs. buy calculator",
    body: [
      "This rent vs. buy calculator estimates whether renting and investing may outperform buying a home over a selected time period. It compares home equity after sale against a renter portfolio that invests upfront cash and any monthly cash flow advantage.",
      "The model includes purchase price, down payment, mortgage rate, loan term, rent, rent inflation, property tax, insurance, maintenance, closing costs, selling costs, renovations, home appreciation, and market return assumptions.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "A buying advantage means the estimated home equity and buyer surplus investment are ahead of the rent-and-invest alternative. A renting advantage means the estimated renter portfolio is ahead after the comparison period.",
      },
      {
        title: "What to verify",
        body: "Confirm local property taxes, insurance, HOA fees if applicable, closing costs, sale costs, loan terms, and realistic maintenance before relying on the estimate.",
      },
    ],
  },
  "rental-property-2": {
    title: "About this rental property calculator",
    body: [
      "This rental property calculator compares the estimated profit from owning a rental property against investing the same starting cash in the market. It is designed for testing whether a potential rental purchase looks attractive after financing, expenses, and sale assumptions.",
      "The model includes purchase price, down payment, mortgage rate, monthly rent, vacancy, property tax, insurance, maintenance, management, closing costs, selling costs, appreciation, rent growth, and market return assumptions.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "The rental property result combines estimated equity after sale, cumulative cash flow, and reinvested positive cash flow. The market result estimates what the initial cash could become if invested instead.",
      },
      {
        title: "What to verify",
        body: "Review rent comps, vacancy expectations, repairs, capital reserves, property management fees, financing terms, local taxes, insurance, and transaction costs before making an offer.",
      },
    ],
  },
  "home-value": {
    title: "About this home value vs. market calculator",
    body: [
      "This home value vs. market investment calculator estimates whether a completed or planned home purchase may beat investing the same cash in the market. It compares estimated home equity after selling against a market investment alternative.",
      "The model includes home price, sale price, down payment, mortgage rate, years held, loan term, monthly rent alternative, market return, rent inflation, property taxes, insurance, maintenance, improvements, closing costs, and selling costs.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "A house advantage means estimated sale proceeds and buyer surplus are ahead. A market advantage means the alternative investment path is estimated to be worth more over the same holding period.",
      },
      {
        title: "What to verify",
        body: "Check actual loan amortization, sale proceeds, broker fees, repairs, taxes, insurance, improvements, and the realistic rental alternative for the years being compared.",
      },
    ],
  },
  "auto-cost": {
    title: "About this new vs. used car cost calculator",
    body: [
      "This auto cost calculator compares buying a used car, buying a new car, and leasing over a selected ownership period. It estimates net cost after payments, ownership expenses, depreciation, resale value, and invested savings.",
      "The model includes vehicle price, down payment, trade-in value, loan rate, loan term, depreciation, insurance, maintenance, registration, fuel or charging, lease payments, residual value, disposition fee, and market return assumptions.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "The winning option has the best estimated outcome after subtracting net vehicle cost and adding the value of any saved cash invested over the comparison period.",
      },
      {
        title: "What to verify",
        body: "Confirm real loan or lease quotes, insurance premiums, maintenance expectations, taxes, registration, mileage limits, residual values, and resale assumptions for the specific vehicle.",
      },
    ],
  },
  "medical-costs": {
    title: "About this medical costs calculator",
    body: [
      "This medical costs calculator models a simplified self-funding path. It invests a yearly amount, then subtracts age- and health-status-based cash healthcare costs from an annual Medicaid cost table.",
      "The model uses the selected health profile as the baseline, interpolates between the provided ages, applies medical cost inflation each year, and compounds the remaining balance at the selected market return.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "A remaining invested balance means the modeled self-funded account covered the cash medical costs with money left over. A shortfall means projected medical costs exceeded the invested balance.",
      },
      {
        title: "What to verify",
        body: "Real health insurance provides risk pooling, negotiated rates, out-of-pocket maximums, emergency coverage, and legal requirements that this simplified model does not capture. Verify premiums, subsidies, deductibles, provider cash prices, and catastrophic-risk exposure.",
      },
    ],
  },
  retirement: {
    title: "About this retirement calculator",
    body: [
      "This retirement calculator projects current net worth and annual contributions to a selected retirement age, then estimates inflation-adjusted retirement spending and portfolio withdrawals.",
      "The tax bracket display can use 2025 federal single-filer or married-filing-jointly marginal brackets as a planning proxy and treats the retirement spending input as taxable income. Real retirement taxes can differ based on account type, deductions, Social Security, pensions, and state taxes.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "The retirement balance is the estimated portfolio at the selected retirement age. The retirement runway shows how long the modeled balance supports inflated spending after estimated federal tax.",
      },
      {
        title: "What to verify",
        body: "Confirm tax filing status, account mix, withdrawal order, required minimum distributions, Social Security, pensions, health care, state taxes, and actual investment fees before relying on the estimate.",
      },
    ],
  },
  "college-savings": {
    title: "About this college savings calculator",
    body: [
      "This college savings calculator projects separate education accounts for one or more children. It models starting balances, monthly contributions, market return assumptions, education inflation, and four July withdrawals for tuition plus board.",
      "The model keeps each child's account separate while also showing a combined household view, including total contributions, estimated investment growth, cumulative withdrawals, ending balance, and uncovered shortfall if costs exceed available savings.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "A remaining balance means the modeled accounts covered the scheduled college withdrawals with money left over. A shortfall means at least one July bill exceeded that child's projected account value.",
      },
      {
        title: "What to verify",
        body: "Confirm school-specific tuition, room and board, fees, financial aid, tax treatment, contribution limits, and the account type before relying on the estimate.",
      },
    ],
  },
  "generational-savings": {
    title: "About this generational savings calculator",
    body: [
      "This generational savings calculator models a broad family savings plan for children across multiple future milestones: cars, college, postgraduate degrees, and home down payments.",
      "The model uses today's estimated costs, inflates them to each milestone date, compounds a shared investment balance, and shows whether planned contributions cover the combined future goals.",
    ],
    sections: [
      {
        title: "How to interpret the result",
        body: "A remaining balance means the modeled savings plan covered each milestone and still had funds left. A shortfall means one or more milestone costs exceeded the projected savings balance.",
      },
      {
        title: "What to verify",
        body: "Review realistic tuition, vehicle, graduate school, housing, gifting, tax, aid, and account-ownership assumptions before using the result for a real plan.",
      },
    ],
  },
  genwiz: {
    title: "About GenWiz",
    body: [
      "GenWiz is a guided version of the generational savings calculator. It asks for family, milestone, education, and investment assumptions one step at a time.",
      "The result uses the same core savings model as the generational savings calculator, but presents the inputs as a conversational planning flow.",
    ],
    sections: [
      {
        title: "How to use it",
        body: "Answer each prompt in order. Earlier cards stay visible, so you can revise any answer and see the final plan update.",
      },
      {
        title: "What to verify",
        body: "Review tuition, vehicle, housing, graduate school, and return assumptions before using the result for a real family savings plan.",
      },
    ],
  },
};

function SeoPageCopy({ pageId }) {
  const copy = pageCopy[pageId] || pageCopy.landing;
  return (
    <section
      className="mt-auto border-t border-neutral-200 pt-4"
      aria-labelledby="calculator-page-copy-title"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div>
          <h2
            id="calculator-page-copy-title"
            className="text-base font-semibold tracking-tight text-neutral-950"
          >
            {copy.title}
          </h2>
          <div className="mt-3 space-y-3 text-xs leading-5 text-neutral-600">
            {copy.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-xs font-semibold tracking-tight text-neutral-950">
                {section.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 pt-6">
      <p className="text-xs leading-5 text-neutral-500">
        <span className="font-semibold text-neutral-700">Disclaimer:</span>{" "}
        These calculators are for educational and planning purposes only.
        Results are estimates based on the assumptions you enter and may not
        reflect actual costs, taxes, financing terms, investment returns,
        property values, insurance, maintenance, transaction costs, or market
        conditions. This site does not provide financial, investment, tax,
        legal, real estate, lending, or insurance advice. Before making a
        purchase, sale, lease, investment, or financing decision, consult
        qualified professionals and verify all numbers independently.
      </p>
    </footer>
  );
}

export default function CombinedRealEstateCalculatorsPreview({
  initialCalculator = "landing",
}) {
  const [activeCalculator, setActiveCalculator] = useState(initialCalculator);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selected =
    calculators.find((calculator) => calculator.id === activeCalculator) ||
    null;
  const ActiveComponent = selected?.component;
  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl flex-col">
        <header className="mb-7 flex flex-col gap-5 border-b border-neutral-200 pb-6">
          <div>
            <Link href="/" className="inline-block text-left">
              <h1 className="text-[2.025rem] font-semibold leading-none tracking-tight text-neutral-950 sm:text-[2.25rem]">
                Financial Calculators
              </h1>
            </Link>
          </div>
          <nav
            className="hidden max-w-full flex-nowrap gap-1 overflow-x-auto pb-1 lg:flex"
            aria-label="Calculator selector"
          >
            {calculators.map((calculator) => {
              const Icon = calculator.icon;
              const active = calculator.id === activeCalculator;
              return (
                <Link
                  key={calculator.id}
                  href={calculatorRouteMap[calculator.id]}
                  className={
                    active
                      ? "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-neutral-950 px-2.5 py-1.5 text-xs font-semibold text-white transition"
                      : "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {calculator.shortName}
                </Link>
              );
            })}
          </nav>
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {selected?.name || "Financial Calculators"}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  Tap to switch calculators
                </span>
              </span>
              <ChevronDownIcon className="h-5 w-5 text-neutral-500" />
            </button>
            {mobileOpen && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                {calculators.map((calculator) => {
                  const Icon = calculator.icon;
                  return (
                    <button
                      key={calculator.id}
                      type="button"
                      onClick={() => {
                        setActiveCalculator(calculator.id);
                        setMobileOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-neutral-50"
                    >
                      <Icon className="h-4 w-4 text-neutral-500" />
                      <span>
                        <span className="block font-semibold text-neutral-950">
                          {calculator.name}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {calculator.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col pb-6">
          <div className="mb-36">
            {ActiveComponent ? <ActiveComponent /> : <LandingPage />}
          </div>
          <SeoPageCopy pageId={activeCalculator} />
        </div>
        <Disclaimer />
      </div>
    </main>
  );
}
