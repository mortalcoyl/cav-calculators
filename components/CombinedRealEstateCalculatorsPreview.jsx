"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const numberFormatter = new Intl.NumberFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compactMoneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

const MARKET_RETURN_PRESETS = [
  { id: "dow", label: "Dow", value: 9.7 },
  { id: "sp500", label: "S&P", value: 10.5 },
  { id: "nasdaq", label: "Nasdaq", value: 12.2 },
];
const MARKET_RETURN_CAVEAT = "Index presets use approximate 30-year annualized historical total-return averages with dividends reinvested. They are planning assumptions, not forecasts.";
const MARKET_RETURN_RANGE = { min: -20, max: 35 };
const MARKET_ZERO_PCT = ((0 - MARKET_RETURN_RANGE.min) / (MARKET_RETURN_RANGE.max - MARKET_RETURN_RANGE.min)) * 100;
const RENT_VS_BUY_TABLE_COLUMNS = ["Rent Expense", "Renter Invested", "Renter Cumulative", "Renter Ending", "Buyer Outlay", "Buyer Invested", "Buyer Cumulative", "Buyer Equity", "Buyer End"];
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
const HOME_VALUE_YEAR_TABLE_COLUMNS = ["Year", "Home Value", "Loan Balance", "Equity After Sale", "Annual Rent", "Market Investment", "House Advantage"];
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
  { header: "Uncovered Shortfall", key: "shortfall" },
];
const SCHOOL_YEAR_OPTIONS = [
  { value: -1, label: "Pre-K" },
  { value: 0, label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: `Grade ${index + 1}` })),
];
const CHART_COLORS = ["#0284c7", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

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
function calculateMonthlyPayment(principal, annualRate, months = 360) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = safePow(1 + monthlyRate, months);
  return factor === 1 ? principal / months : (principal * monthlyRate * factor) / (factor - 1);
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
  return `${Number(value || 0).toFixed(2).replace(/\.00$/, "")}%`;
}
function toExportFilename(title) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "calculator"}-export.csv`;
}
function escapeCsvValue(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function downloadCsv({ title, columns, rows }) {
  if (typeof window === "undefined" || !columns?.length || !rows?.length) return;
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => {
    const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.key];
    return escapeCsvValue(value);
  }).join(",")).join("\n");
  const blob = new Blob([[header, body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = toExportFilename(title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function calculateAutoScenario({ price, downPaymentPct = 20, tradeInValue = 0, rate, loanTermMonths, yearsOwned, depreciationPct, annualInsurance, annualMaintenance, annualRegistration, annualFuel }) {
  const downPayment = price * (downPaymentPct / 100);
  const effectiveDownPayment = downPayment + tradeInValue;
  const loanAmount = Math.max(0, price - effectiveDownPayment);
  const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, loanTermMonths);
  const paidMonths = Math.min(yearsOwned * 12, loanTermMonths);
  const totalPayments = monthlyPayment * paidMonths;
  const totalInsurance = annualInsurance * yearsOwned;
  const totalMaintenance = annualMaintenance * yearsOwned;
  const totalRegistration = annualRegistration * yearsOwned;
  const totalFuel = annualFuel * yearsOwned;
  const monthlyOwnershipCost = (annualInsurance + annualMaintenance + annualRegistration + annualFuel) / 12;
  const monthlyTotalCost = monthlyPayment + monthlyOwnershipCost;
  const resaleValue = price * safePow(1 - depreciationPct / 100, yearsOwned);
  const totalCashOut = downPayment + totalPayments + totalInsurance + totalMaintenance + totalRegistration + totalFuel;
  return { downPayment, downPaymentPct, tradeInValue, effectiveDownPayment, loanAmount, monthlyPayment, monthlyOwnershipCost, monthlyTotalCost, totalPayments, totalInsurance, totalMaintenance, totalRegistration, totalFuel, totalCashOut, resaleValue, netCost: Math.max(0, totalCashOut - resaleValue) };
}

function calculateLeaseScenario({ carValue = 45000, dueAtSigning, monthlyPayment, yearsOwned, annualInsurance, annualMaintenance, annualRegistration, annualFuel, dispositionFee, residualPct = 55, buyoutAtEnd = false, postBuyoutDepreciationPct = 10 }) {
  const residualValue = carValue * (residualPct / 100);
  const totalPayments = monthlyPayment * yearsOwned * 12;
  const totalInsurance = annualInsurance * yearsOwned;
  const totalMaintenance = annualMaintenance * yearsOwned;
  const totalRegistration = annualRegistration * yearsOwned;
  const totalFuel = annualFuel * yearsOwned;
  const buyoutCost = buyoutAtEnd ? residualValue : 0;
  const buyoutResaleValue = buyoutAtEnd ? residualValue * safePow(1 - postBuyoutDepreciationPct / 100, Math.max(0, yearsOwned)) : 0;
  const totalCashOut = dueAtSigning + totalPayments + totalInsurance + totalMaintenance + totalRegistration + totalFuel + dispositionFee + buyoutCost;
  const monthlyOwnershipCost = (annualInsurance + annualMaintenance + annualRegistration + annualFuel) / 12;
  const monthlyTotalCost = monthlyPayment + monthlyOwnershipCost;
  return { downPayment: dueAtSigning, monthlyPayment, monthlyOwnershipCost, monthlyTotalCost, totalPayments, totalInsurance, totalMaintenance, totalRegistration, totalFuel, totalCashOut, resaleValue: buyoutResaleValue, netCost: Math.max(0, totalCashOut - buyoutResaleValue), dispositionFee, carValue, residualPct, residualValue, buyoutCost, buyoutResaleValue, postBuyoutDepreciationPct, buyoutAtEnd };
}

function calculateAutoInvestmentComparison({ used, newer, lease, yearsOwned, marketReturn }) {
  const totalMonths = yearsOwned * 12;
  const monthlyRate = marketReturn / 100 / 12;
  const scenarios = [
    { id: "used", label: "Used car", data: used },
    { id: "new", label: "New car", data: newer },
    { id: "lease", label: "Lease", data: lease },
  ];
  const highestStartingCash = Math.max(...scenarios.map((scenario) => scenario.data.downPayment));
  const highestMonthlyCost = Math.max(...scenarios.map((scenario) => scenario.data.monthlyTotalCost));
  const results = scenarios.map((scenario) => {
    const upfrontSavedCash = Math.max(0, highestStartingCash - scenario.data.downPayment);
    const monthlySavings = Math.max(0, highestMonthlyCost - scenario.data.monthlyTotalCost);
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
  const winner = results.reduce((best, current) => (current.outcome > best.outcome ? current : best), results[0]);
  const runnerUp = Math.max(...results.filter((result) => result.id !== winner.id).map((result) => result.outcome));
  return { results, used: results.find((result) => result.id === "used"), newer: results.find((result) => result.id === "new"), lease: results.find((result) => result.id === "lease"), winner, gap: Math.abs(winner.outcome - runnerUp) };
}

function runPreviewTests() {
  const auto = calculateAutoScenario({ price: 30000, downPaymentPct: 16.6667, tradeInValue: 0, rate: 6, loanTermMonths: 60, yearsOwned: 5, depreciationPct: 10, annualInsurance: 1800, annualMaintenance: 1200, annualRegistration: 400, annualFuel: 2400 });
  const autoSavings = calculateAutoInvestmentComparison({ used: auto, newer: { ...auto, downPayment: auto.downPayment + 1000, monthlyTotalCost: auto.monthlyTotalCost + 100 }, lease: { ...auto, downPayment: auto.downPayment + 500, monthlyTotalCost: auto.monthlyTotalCost + 50, netCost: auto.netCost + 500 }, yearsOwned: 5, marketReturn: 10 });
  const tests = [
    { name: "parseNumber handles currency", pass: parseNumber("$1,250,000") === 1250000 },
    { name: "parseNumber handles decimals", pass: parseNumber("1.25") === 1.25 && parseNumber(".5") === 0.5 },
    { name: "zero interest payment", pass: Math.round(calculateMonthlyPayment(360000, 0, 360)) === 1000 },
    { name: "market presets exist", pass: MARKET_RETURN_PRESETS.length === 3 },
    { name: "market return caveat explains period", pass: MARKET_RETURN_CAVEAT.includes("30-year") },
    { name: "rent table column count", pass: RENT_VS_BUY_TABLE_COLUMNS.length === 9 },
    { name: "home value table columns", pass: HOME_VALUE_YEAR_TABLE_COLUMNS.includes("House Advantage") },
    { name: "auto cost produces positive net cost", pass: auto.netCost > 0 && auto.monthlyPayment > 0 },
    { name: "auto trade-in reduces financed amount", pass: calculateAutoScenario({ price: 30000, downPaymentPct: 16.6667, tradeInValue: 3000, rate: 6, loanTermMonths: 60, yearsOwned: 5, depreciationPct: 10, annualInsurance: 1800, annualMaintenance: 1200, annualRegistration: 400, annualFuel: 2400 }).loanAmount < 22001 && calculateAutoScenario({ price: 30000, downPaymentPct: 16.6667, tradeInValue: 3000, rate: 6, loanTermMonths: 60, yearsOwned: 5, depreciationPct: 10, annualInsurance: 1800, annualMaintenance: 1200, annualRegistration: 400, annualFuel: 2400 }).loanAmount > 21999 },
    { name: "lease buyout applies depreciated resale value", pass: calculateLeaseScenario({ carValue: 50000, dueAtSigning: 4000, monthlyPayment: 500, yearsOwned: 3, annualInsurance: 1800, annualMaintenance: 500, annualRegistration: 400, annualFuel: 2000, dispositionFee: 500, residualPct: 50, buyoutAtEnd: true, postBuyoutDepreciationPct: 10 }).resaleValue < 25000 && calculateLeaseScenario({ carValue: 50000, dueAtSigning: 4000, monthlyPayment: 500, yearsOwned: 3, annualInsurance: 1800, annualMaintenance: 500, annualRegistration: 400, annualFuel: 2000, dispositionFee: 500, residualPct: 50, buyoutAtEnd: true, postBuyoutDepreciationPct: 10 }).resaleValue > 0 },
    { name: "auto savings investment compounds positive savings", pass: autoSavings.used.investmentValue > autoSavings.used.savedCashInvested },
    { name: "auto cost table includes 3, 5, and 10 years", pass: AUTO_COST_TABLE_YEARS.join(",") === "3,5,10" },
    { name: "formatCost displays costs as negative", pass: formatCost(1000).startsWith("-") || formatCost(1000).includes("($") },
  ];
  const failed = tests.filter((test) => !test.pass);
  if (failed.length) console.warn("Preview calculator tests failed:", failed.map((test) => test.name));
}
if (typeof window !== "undefined") runPreviewTests();

function IconBase({ children, className = "" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>;
}
function HomeIcon({ className = "" }) { return <IconBase className={className}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V21h14V10.5" /><path d="M9 21v-6h6v6" /></IconBase>; }
function BuildingIcon({ className = "" }) { return <IconBase className={className}><path d="M4 21h16" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M9 7h1" /><path d="M14 7h1" /><path d="M9 11h1" /><path d="M14 11h1" /><path d="M9 15h1" /><path d="M14 15h1" /></IconBase>; }
function ScaleIcon({ className = "" }) { return <IconBase className={className}><path d="M12 3v18" /><path d="M5 7h14" /><path d="M6 7l-3 7h6L6 7Z" /><path d="M18 7l-3 7h6l-3-7Z" /><path d="M4 21h16" /></IconBase>; }
function CalculatorIcon({ className = "" }) { return <IconBase className={className}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></IconBase>; }
function TrendingUpIcon({ className = "" }) { return <IconBase className={className}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></IconBase>; }
function DollarIcon({ className = "" }) { return <IconBase className={className}><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" /></IconBase>; }
function BarChartIcon({ className = "" }) { return <IconBase className={className}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 17v-5" /><path d="M12 17V8" /><path d="M16 17v-7" /></IconBase>; }
function CarIcon({ className = "" }) { return <IconBase className={className}><path d="M5 17h14" /><path d="M6 17l1.5-6h9L18 17" /><path d="M8 11l1.2-3h5.6L16 11" /><path d="M7 17v2" /><path d="M17 17v2" /><path d="M8 15h.01" /><path d="M16 15h.01" /></IconBase>; }
function GraduationIcon({ className = "" }) { return <IconBase className={className}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /><path d="M22 10v6" /></IconBase>; }
function ChevronDownIcon({ className = "" }) { return <IconBase className={className}><path d="m6 9 6 6 6-6" /></IconBase>; }

function Card({ children, className = "" }) { return <div className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>; }
function AdditionalCostsSection({ children }) {
  return <div className="mt-auto pt-6"><div className="border-t border-neutral-200 pt-6"><h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-950">Additional Costs</h3><div className="space-y-4">{children}</div></div></div>;
}
function SectionTitle({ icon: Icon, title, subtitle }) {
  return <div className="mb-4 flex min-w-0 items-start gap-3"><div className="mt-1 shrink-0 rounded-xl bg-neutral-100 p-2"><Icon className="h-4 w-4 text-neutral-800" /></div><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold tracking-tight text-neutral-950">{title}</h2>{subtitle && <p className="mt-1 max-w-full break-words text-sm leading-6 text-neutral-600">{subtitle}</p>}</div></div>;
}
function MoneyInput({ label, value, onChange, min = 0, max = 5000000, step = 1000, helperText, displayValue }) {
  const setSafeValue = (nextValue) => onChange(clampNumber(parseNumber(nextValue), min, max));
  return <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-medium text-neutral-800">{label}</label><div className="flex min-w-[128px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950"><span className="text-neutral-400">$</span><input value={displayValue ?? numberFormatter.format(value)} onChange={(event) => setSafeValue(event.target.value)} className="w-full bg-transparent px-2 text-right text-sm font-semibold outline-none" inputMode="decimal" /></div></div>{helperText && <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>}<input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setSafeValue(event.target.value)} className="mt-2 w-full accent-neutral-950" /></div>;
}
function PercentInput({ label, value, onChange, min = -10, max = 20, step = 0.1, helperText }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const partial = (text) => text === "" || text === "-" || text === "." || text === "-." || /^-?[0-9]+[.]$/.test(text);
  return <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-medium text-neutral-800">{label}</label><div className="flex min-w-[96px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950"><input value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); if (!partial(next)) onChange(clampNumber(parseNumber(next), min, max)); }} onBlur={() => { const parsed = clampNumber(parseNumber(draft), min, max); onChange(parsed); setDraft(String(parsed)); }} className="w-full bg-transparent text-right text-sm font-semibold outline-none" inputMode="decimal" /><span className="ml-1 text-neutral-400">%</span></div></div>{helperText && <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>}<input type="range" min={min} max={max} step={step} value={value} onChange={(event) => { const next = parseNumber(event.target.value); onChange(next); setDraft(String(next)); }} className="mt-2 w-full accent-neutral-950" /></div>;
}
function RangeInput({ label, value, onChange, min, max, step = 1, suffix = "", helperText }) {
  const setSafeValue = (nextValue) => onChange(clampNumber(parseNumber(nextValue), min, max));
  return <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-medium text-neutral-800">{label}</label><div className="flex min-w-[96px] items-center justify-end rounded-xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-neutral-950"><input value={value} onChange={(event) => setSafeValue(event.target.value)} className="w-full bg-transparent text-right text-sm font-semibold outline-none" inputMode="numeric" />{suffix && <span className="ml-1 text-neutral-400">{suffix}</span>}</div></div>{helperText && <p className="mt-1 text-xs leading-5 text-neutral-500">{helperText}</p>}<input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setSafeValue(event.target.value)} className="mt-2 w-full accent-neutral-950" /></div>;
}
function MarketReturnPicker({ value, onChange }) {
  const activePreset = MARKET_RETURN_PRESETS.find((preset) => Math.abs(preset.value - value) < 0.05);
  return <div className="space-y-3"><PercentInput label="Alternate market return" value={value} onChange={onChange} min={MARKET_RETURN_RANGE.min} max={MARKET_RETURN_RANGE.max} helperText={activePreset ? `${activePreset.label} preset selected` : "Custom return"} /><div className="relative -mt-2 h-3"><span className="absolute top-0 h-3 w-px bg-neutral-500" style={{ left: `${MARKET_ZERO_PCT}%` }} /><span className="absolute top-2 -translate-x-1/2 text-[10px] font-semibold text-neutral-500" style={{ left: `${MARKET_ZERO_PCT}%` }}>0</span></div><div className="grid grid-cols-3 gap-2">{MARKET_RETURN_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => onChange(preset.value)} className={`rounded-xl border px-3 py-2 text-center text-xs font-bold transition ${activePreset?.id === preset.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}><span className="block">{preset.label}</span><span className="mt-0.5 block font-semibold">{formatPercent(preset.value)}</span></button>)}</div><p className="text-xs leading-5 text-neutral-500">{MARKET_RETURN_CAVEAT}</p></div>;
}
function SmallStat({ label, value, tone = "neutral", detail }) {
  const toneClass = tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "blue" ? "border-sky-200 bg-sky-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-neutral-200 bg-neutral-50";
  return <div className={`rounded-2xl border p-4 ${toneClass}`}><div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div><div className="mt-2 text-xl font-bold text-neutral-950">{value}</div>{detail && <div className="mt-1 text-sm font-semibold leading-5 text-neutral-700">{detail}</div>}</div>;
}
function OwnershipCostSummary({ title, subtitle, startingLabel, startingAmount, items, totalLabel, totalAmount, remainingLabel, remainingAmount, note }) {
  return <Card><SectionTitle icon={DollarIcon} title={title} subtitle={subtitle} /><div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-neutral-50">{Number.isFinite(startingAmount) && <div className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-sm font-semibold text-neutral-950">{startingLabel}</span><span className="text-sm font-bold text-neutral-950">{formatMoney(startingAmount)}</span></div>}{items.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-sm text-neutral-600">{item.label}</span><span className="text-sm font-semibold text-neutral-950">-{formatMoney(item.amount)}</span></div>)}<div className="flex items-center justify-between gap-4 bg-white px-4 py-3"><span className="text-sm font-semibold text-neutral-950">{totalLabel}</span><span className="text-sm font-bold text-neutral-950">{formatMoney(totalAmount)}</span></div>{Number.isFinite(remainingAmount) && <div className="flex items-center justify-between gap-4 rounded-b-xl bg-emerald-50 px-4 py-3"><span className="text-sm font-semibold text-emerald-900">{remainingLabel}</span><span className="text-sm font-bold text-emerald-900">{formatMoney(remainingAmount)}</span></div>}</div>{note && <p className="mt-3 text-xs leading-5 text-neutral-500">{note}</p>}</Card>;
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"><div className="mb-2 text-xs font-semibold text-neutral-500">Year {label}</div>{payload.map((item) => { const color = item.color || item.stroke || "#171717"; return <div key={item.dataKey} className="flex items-center justify-between gap-6 text-sm"><span className="font-semibold" style={{ color }}>{item.name}</span><strong style={{ color }}>{formatCompactMoney(item.value)}</strong></div>; })}</div>;
}
function ExportMenu({ title, exportData }) {
  const [open, setOpen] = useState(false);
  const hasCsv = Boolean(exportData?.columns?.length && exportData?.rows?.length);
  return <div className="relative shrink-0"><button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50">Export<ChevronDownIcon className="h-4 w-4" /></button>{open && <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1 text-sm shadow-lg"><button type="button" onClick={() => { setOpen(false); window.print(); }} className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-neutral-800 hover:bg-neutral-50">Print / save PDF</button><button type="button" disabled={!hasCsv} onClick={() => { setOpen(false); downloadCsv({ title, columns: exportData.columns, rows: exportData.rows }); }} className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400">Export CSV</button></div>}</div>;
}
function CalculatorFrame({ title, description, children, exportData }) {
  return <motion.div key={title} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{description}</p></div>{exportData && <ExportMenu title={title} exportData={exportData} />}</div>{children}</motion.div>;
}

function calculateRentVsBuyScenario({ homePrice, downPaymentPct, rate, loanYears, rent, monthlyCashBeforeHousing, appreciation, marketReturn, rentInflation, propertyTaxPct, annualInsurance, maintenancePct, renovations, buyingClosingCostPct, sellingCostPct, years, incomeTaxRate, standardDeduction, includeTaxBenefit }) {
  const downPayment = homePrice * (downPaymentPct / 100);
  const buyingClosingCosts = homePrice * (buyingClosingCostPct / 100);
  const initialCashNeeded = downPayment + buyingClosingCosts + renovations;
  const loanAmount = Math.max(0, homePrice - downPayment);
  const mortgage = calculateMonthlyPayment(loanAmount, rate, loanYears * 12);
  const monthlyRate = rate / 100 / 12;
  const monthlyTaxes = (homePrice * (propertyTaxPct / 100)) / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyMaintenance = (homePrice * (maintenancePct / 100)) / 12;
  const monthlyOwnershipCost = mortgage + monthlyTaxes + monthlyInsurance + monthlyMaintenance;
  let loanBalance = loanAmount;
  let renterPortfolio = initialCashNeeded;
  let buyerSurplusPortfolio = 0;
  let renterCumulativeInvested = initialCashNeeded;
  let buyerCumulativeInvested = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalTaxBenefit = 0;
  const yearZeroEquityAfterSale = Math.max(0, homePrice - loanAmount - homePrice * (sellingCostPct / 100));
  const rows = [{ year: 0, renterRentExpense: 0, renterInvested: 0, renterCumulative: Math.round(initialCashNeeded), renterEnding: Math.round(initialCashNeeded), buyerOutlay: Math.round(initialCashNeeded), buyerInvested: 0, buyerCumulative: 0, buyerEquity: Math.round(yearZeroEquityAfterSale), buyerEnding: Math.round(yearZeroEquityAfterSale), homeValue: Math.round(homePrice), loanBalance: Math.round(loanAmount), equityAfterSale: Math.round(yearZeroEquityAfterSale), buyerSurplusPortfolio: 0, buyingNetWorth: Math.round(yearZeroEquityAfterSale), rentingNetWorth: Math.round(initialCashNeeded) }];
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
      const principal = loanBalance > 0 ? Math.min(Math.max(0, mortgage - interest), loanBalance) : 0;
      loanBalance = Math.max(0, loanBalance - principal);
      annualInterest += interest;
      annualPrincipal += principal;
      annualRentPaid += currentRent;
      annualOwnershipCost += monthlyOwnershipCost;
      const estimatedDeductible = annualInterest + monthlyTaxes * 12;
      const taxBenefit = includeTaxBenefit ? Math.max(0, estimatedDeductible - standardDeduction) * (incomeTaxRate / 100) : 0;
      annualTaxBenefit = taxBenefit;
      const buyerMonthlyOutflow = monthlyOwnershipCost - taxBenefit / 12;
      const renterContribution = Math.max(0, monthlyCashBeforeHousing - currentRent);
      const buyerContribution = Math.max(0, monthlyCashBeforeHousing - buyerMonthlyOutflow);
      renterAnnualInvested += renterContribution;
      buyerAnnualInvested += buyerContribution;
      renterPortfolio = renterPortfolio * (1 + marketReturn / 100 / 12) + renterContribution;
      buyerSurplusPortfolio = buyerSurplusPortfolio * (1 + marketReturn / 100 / 12) + buyerContribution;
    }
    totalPrincipalPaid += annualPrincipal;
    totalInterestPaid += annualInterest;
    totalTaxBenefit += annualTaxBenefit;
    renterCumulativeInvested += renterAnnualInvested;
    buyerCumulativeInvested += buyerAnnualInvested;
    const homeValue = homePrice * safePow(1 + appreciation / 100, year);
    const equityAfterSale = Math.max(0, homeValue - loanBalance - homeValue * (sellingCostPct / 100));
    const buyingNetWorth = equityAfterSale + buyerSurplusPortfolio;
    rows.push({ year, renterRentExpense: Math.round(annualRentPaid), renterInvested: Math.round(renterAnnualInvested), renterCumulative: Math.round(renterCumulativeInvested), renterEnding: Math.round(renterPortfolio), buyerOutlay: Math.round(annualOwnershipCost), buyerInvested: Math.round(buyerAnnualInvested), buyerCumulative: Math.round(buyerCumulativeInvested), buyerEquity: Math.round(equityAfterSale), buyerEnding: Math.round(buyingNetWorth), homeValue: Math.round(homeValue), loanBalance: Math.round(loanBalance), equityAfterSale: Math.round(equityAfterSale), buyerSurplusPortfolio: Math.round(buyerSurplusPortfolio), buyingNetWorth: Math.round(buyingNetWorth), rentingNetWorth: Math.round(renterPortfolio) });
  }
  const last = rows[rows.length - 1];
  const winner = last.buyingNetWorth > last.rentingNetWorth ? "Buying" : "Rent + Invest";
  return { rows, downPayment, buyingClosingCosts, initialCashNeeded, loanAmount, mortgage, monthlyTaxes, monthlyInsurance, monthlyMaintenance, monthlyOwnershipCost, totalPrincipalPaid, totalInterestPaid, totalTaxBenefit, winner, gap: Math.abs(last.buyingNetWorth - last.rentingNetWorth), buyingNetWorth: last.buyingNetWorth, rentingNetWorth: last.rentingNetWorth, equityAfterSale: last.equityAfterSale, buyerSurplusPortfolio: last.buyerSurplusPortfolio, endingHomeValue: last.homeValue, endingLoanBalance: last.loanBalance };
}

function RentVsBuyCalculator() {
  const [homePrice, setHomePrice] = useState(1000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [loanYears, setLoanYears] = useState(30);
  const [rent, setRent] = useState(5000);
  const [monthlyCashBeforeHousing, setMonthlyCashBeforeHousing] = useState(10000);
  const [appreciation, setAppreciation] = useState(4);
  const [marketReturn, setMarketReturn] = useState(10);
  const [rentInflation, setRentInflation] = useState(2);
  const [propertyTaxPct, setPropertyTaxPct] = useState(1.1);
  const [annualInsurance, setAnnualInsurance] = useState(3600);
  const [maintenancePct, setMaintenancePct] = useState(1);
  const [renovations, setRenovations] = useState(0);
  const [buyingClosingCostPct, setBuyingClosingCostPct] = useState(2.5);
  const [sellingCostPct, setSellingCostPct] = useState(6);
  const [years, setYears] = useState(30);
  const [incomeTaxRate, setIncomeTaxRate] = useState(35);
  const [standardDeduction, setStandardDeduction] = useState(30000);
  const [includeTaxBenefit, setIncludeTaxBenefit] = useState(true);
  const [showEquityLine, setShowEquityLine] = useState(false);
  const [showHomeValueLine, setShowHomeValueLine] = useState(false);
  const [showCashFlowLine, setShowCashFlowLine] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const result = useMemo(() => calculateRentVsBuyScenario({ homePrice, downPaymentPct, rate, loanYears, rent, monthlyCashBeforeHousing, appreciation, marketReturn, rentInflation, propertyTaxPct, annualInsurance, maintenancePct, renovations, buyingClosingCostPct, sellingCostPct, years, incomeTaxRate, standardDeduction, includeTaxBenefit }), [homePrice, downPaymentPct, rate, loanYears, rent, monthlyCashBeforeHousing, appreciation, marketReturn, rentInflation, propertyTaxPct, annualInsurance, maintenancePct, renovations, buyingClosingCostPct, sellingCostPct, years, incomeTaxRate, standardDeduction, includeTaxBenefit]);
  const chartData = result.rows.map((row) => ({ year: row.year, "Rent + Invest": row.rentingNetWorth, Buying: row.buyingNetWorth, "Home Value": row.homeValue, "Equity After Sale": row.equityAfterSale, "Reinvested Buyer Surplus": row.buyerSurplusPortfolio }));
  const winnerDetail = result.winner === "Buying" ? `by ${formatMoney(result.gap)} more than renting.` : `by ${formatMoney(result.gap)} more than buying.`;
  return <CalculatorFrame title="Rent vs. Buy Calculator" description="A full rent-vs-buy model with transaction costs, ownership costs, tax assumptions, reinvested cash flow, payoff logic, and a year-by-year table." exportData={{ columns: RENT_VS_BUY_EXPORT_COLUMNS, rows: result.rows }}><div className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><SmallStat label="Winner" value={`${result.winner} wins`} detail={winnerDetail} tone={result.winner === "Buying" ? "green" : "blue"} /><SmallStat label="Buying result" value={formatCompactMoney(result.buyingNetWorth)} tone="green" /><SmallStat label="Rent + invest result" value={formatCompactMoney(result.rentingNetWorth)} tone="blue" /></div><div className="grid gap-5 xl:grid-cols-[430px_1fr]"><Card><SectionTitle icon={HomeIcon} title="Home purchase inputs" subtitle="Core purchase and mortgage assumptions." /><div className="space-y-4"><MoneyInput label="Home price" value={homePrice} onChange={setHomePrice} max={5000000} step={10000} /><PercentInput label="Down payment" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={60} /><PercentInput label="Mortgage rate" value={rate} onChange={setRate} min={0} max={12} /><PercentInput label="Home appreciation" value={appreciation} onChange={setAppreciation} min={-5} max={12} /><RangeInput label="Loan term" value={loanYears} onChange={setLoanYears} min={10} max={30} step={5} suffix="yrs" /><RangeInput label="Comparison period" value={years} onChange={setYears} min={1} max={30} suffix="yrs" /></div></Card><Card className="min-h-[600px]"><SectionTitle icon={BarChartIcon} title="Long-term outcome" subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${years} years.`} /><div className="h-[500px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatCompactMoney} tickLine={false} axisLine={false} width={72} /><Tooltip content={<ChartTooltip />} /><Legend /><Line type="monotone" dataKey="Rent + Invest" stroke="#0284c7" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="Buying" stroke="#059669" strokeWidth={3} dot={false} />{showHomeValueLine && <Line type="monotone" dataKey="Home Value" stroke="#d946ef" strokeWidth={2} dot={false} />}{showEquityLine && <Line type="monotone" dataKey="Equity After Sale" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="6 4" />}{showCashFlowLine && <Line type="monotone" dataKey="Reinvested Buyer Surplus" stroke="#111827" strokeWidth={2} dot={false} strokeDasharray="3 5" />}</LineChart></ResponsiveContainer></div><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><button type="button" onClick={() => setShowEquityLine((value) => !value)} className={`rounded-full border px-3 py-2 ${showEquityLine ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-500"}`}>Equity after sale</button><button type="button" onClick={() => setShowHomeValueLine((value) => !value)} className={`rounded-full border px-3 py-2 ${showHomeValueLine ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800" : "border-neutral-200 bg-white text-neutral-500"}`}>Home value</button><button type="button" onClick={() => setShowCashFlowLine((value) => !value)} className={`rounded-full border px-3 py-2 ${showCashFlowLine ? "border-neutral-300 bg-neutral-100 text-neutral-900" : "border-neutral-200 bg-white text-neutral-500"}`}>Reinvested surplus cash flow</button></div></Card></div><div className="grid gap-5 lg:grid-cols-2"><Card><SectionTitle icon={DollarIcon} title="Transaction & ownership costs" subtitle="Grouped separately so depth is preserved inside this calculator." /><div className="grid gap-4 md:grid-cols-2"><PercentInput label="Buying closing costs" value={buyingClosingCostPct} onChange={setBuyingClosingCostPct} min={0} max={10} helperText={formatMoney(result.buyingClosingCosts)} /><PercentInput label="Selling costs" value={sellingCostPct} onChange={setSellingCostPct} min={0} max={12} helperText={formatMoney(result.endingHomeValue * (sellingCostPct / 100))} /><PercentInput label="Property taxes" value={propertyTaxPct} onChange={setPropertyTaxPct} min={0} max={3} helperText={`${formatMoney(result.monthlyTaxes)} / month`} /><MoneyInput label="Annual insurance" value={annualInsurance} onChange={setAnnualInsurance} max={30000} step={100} helperText={`${formatMoney(result.monthlyInsurance)} / month`} /><PercentInput label="Maintenance" value={maintenancePct} onChange={setMaintenancePct} min={0} max={5} helperText={`${formatMoney(result.monthlyMaintenance)} / month`} /><MoneyInput label="Renovations" value={renovations} onChange={setRenovations} max={1000000} step={5000} /></div></Card><Card><SectionTitle icon={TrendingUpIcon} title="Rent & market alternative" subtitle="Rental path and alternate investment assumptions." /><div className="grid gap-4 md:grid-cols-2"><MoneyInput label="Monthly rent" value={rent} onChange={setRent} max={30000} step={100} /><MoneyInput label="Monthly cash before housing costs" value={monthlyCashBeforeHousing} onChange={setMonthlyCashBeforeHousing} max={50000} step={500} /><PercentInput label="Rent inflation" value={rentInflation} onChange={setRentInflation} min={0} max={10} /><div className="md:col-span-2"><MarketReturnPicker value={marketReturn} onChange={setMarketReturn} /></div></div></Card></div><OwnershipCostSummary title="Ownership cost" subtitle="Today's monthly cash waterfall for the buyer path." startingLabel="Starting monthly cash before housing" startingAmount={monthlyCashBeforeHousing} items={[{ label: "Less monthly mortgage", amount: result.mortgage }, { label: "Less property taxes", amount: result.monthlyTaxes }, { label: "Less insurance", amount: result.monthlyInsurance }, { label: "Less maintenance", amount: result.monthlyMaintenance }]} totalLabel="Monthly ownership cost" totalAmount={result.monthlyOwnershipCost} remainingLabel="Buyer cash left to invest today" remainingAmount={Math.max(0, monthlyCashBeforeHousing - result.monthlyOwnershipCost)} note="This is a current-month view. The year-by-year table still uses the full model." /><Card><SectionTitle icon={CalculatorIcon} title="Advanced assumptions" subtitle="Tax benefit assumptions." /><div className="grid gap-5 lg:grid-cols-3"><PercentInput label="Estimated marginal tax rate" value={incomeTaxRate} onChange={setIncomeTaxRate} min={0} max={55} /><MoneyInput label="Standard deduction estimate" value={standardDeduction} onChange={setStandardDeduction} max={100000} step={500} /><label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700"><input type="checkbox" checked={includeTaxBenefit} onChange={(event) => setIncludeTaxBenefit(event.target.checked)} className="mt-1 h-4 w-4 accent-neutral-950" /><span><strong className="text-neutral-950">Include estimated tax benefit</strong><br />Uses mortgage interest plus property tax above the standard deduction as a simplified estimate.</span></label></div></Card><Card><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><SectionTitle icon={BarChartIcon} title="Year-by-year comparison" subtitle="Full yearly output for buyer vs. renter." /><button type="button" onClick={() => setShowTable((value) => !value)} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{showTable ? "Hide table" : "Show table"}</button></div>{showTable && <div className="mt-2 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200"><table className="w-full table-fixed border-separate border-spacing-0 text-left text-[11px] leading-tight"><thead className="sticky top-0 bg-white"><tr className="text-xs uppercase tracking-wide text-neutral-500"><th rowSpan={2} className="border-b border-neutral-200 bg-neutral-50 px-2 py-2 align-middle text-neutral-700">Year</th><th colSpan={4} className="border-b border-l border-neutral-200 bg-sky-50 px-2 py-2 text-sky-800">Renter path</th><th colSpan={5} className="border-b border-l border-neutral-200 bg-emerald-50 px-2 py-2 text-emerald-800">Buyer path</th></tr><tr>{RENT_VS_BUY_TABLE_COLUMNS.map((column, columnIndex) => <th key={column} className={`break-words border-b border-neutral-200 px-2 py-2 text-right ${columnIndex === 0 || columnIndex === 4 ? "border-l" : ""}`}>{column}</th>)}</tr></thead><tbody>{result.rows.map((row) => <tr key={row.year}><td className="border-b border-neutral-100 px-2 py-2 font-semibold">{row.year}</td><td className="border-b border-l border-neutral-200 px-2 py-2 text-right">{formatCompactMoney(row.renterRentExpense)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.renterInvested)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.renterCumulative)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.renterEnding)}</td><td className="border-b border-l border-neutral-200 px-2 py-2 text-right">{formatCompactMoney(row.buyerOutlay)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.buyerInvested)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.buyerCumulative)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.buyerEquity)}</td><td className="border-b border-neutral-100 px-2 py-2 text-right">{formatCompactMoney(row.buyerEnding)}</td></tr>)}</tbody></table></div>}</Card></div></CalculatorFrame>;
}

function calculateRentalPropertyScenario({ purchasePrice, monthlyRent, downPaymentPct, rate, appreciation, marketReturn, rentGrowth, vacancyPct, propertyTaxPct, annualInsurance, maintenancePct, managementPct, closingCostPct, sellingCostPct, years, cashFlowStrategy, reinvestLossCoverage, capexReserveMonthly = 0, expenseInflation = 0 }) {
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
  const monthlyOperatingExpenses = monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + managementMonthly + capexReserveMonthly;
  const monthlyCashFlow = effectiveMonthlyRent - monthlyOperatingExpenses - monthlyMortgage;
  const annualNOI = (effectiveMonthlyRent - monthlyOperatingExpenses) * 12;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash = initialCashNeeded === 0 ? 0 : (annualCashFlow / initialCashNeeded) * 100;
  const capRate = purchasePrice === 0 ? 0 : (annualNOI / purchasePrice) * 100;
  const breakEvenRent = (monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + capexReserveMonthly) / Math.max(0.01, 1 - vacancyPct / 100 - managementPct / 100);
  let loanBalance = loanAmount;
  let cumulativeCashFlow = 0;
  let reinvestedCashFlow = 0;
  let marketInvestmentResult = initialCashNeeded;
  const rows = [];
  for (let year = 1; year <= years; year++) {
    const currentRent = monthlyRent * safePow(1 + rentGrowth / 100, year - 1);
    const currentEffectiveRent = currentRent * (1 - vacancyPct / 100);
    const currentOperatingExpenses = (monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + capexReserveMonthly) * safePow(1 + expenseInflation / 100, year - 1) + currentRent * (managementPct / 100);
    const currentMonthlyCashFlow = currentEffectiveRent - currentOperatingExpenses - monthlyMortgage;
    for (let month = 1; month <= 12; month++) {
      const monthlyRate = rate / 100 / 12;
      const interest = loanBalance > 0 ? loanBalance * monthlyRate : 0;
      const principal = loanBalance > 0 ? Math.min(Math.max(0, monthlyMortgage - interest), loanBalance) : 0;
      const positiveCashFlow = Math.max(0, currentMonthlyCashFlow);
      const lossCoverage = Math.max(0, -currentMonthlyCashFlow);
      const extraPrincipal = cashFlowStrategy === "paydown" ? Math.min(positiveCashFlow, Math.max(0, loanBalance - principal)) : 0;
      loanBalance = Math.max(0, loanBalance - principal - extraPrincipal);
      reinvestedCashFlow = reinvestedCashFlow * (1 + marketReturn / 100 / 12) + (cashFlowStrategy === "reinvest" ? positiveCashFlow : 0);
      marketInvestmentResult = marketInvestmentResult * (1 + marketReturn / 100 / 12) + (reinvestLossCoverage ? lossCoverage : 0);
    }
    cumulativeCashFlow += currentMonthlyCashFlow * 12;
    const propertyValue = purchasePrice * safePow(1 + appreciation / 100, year);
    const equityAfterSale = Math.max(0, propertyValue * (1 - sellingCostPct / 100) - loanBalance);
    const rentalPropertyProfit = equityAfterSale + cumulativeCashFlow + reinvestedCashFlow;
    rows.push({ year, rentalPropertyProfit: Math.round(rentalPropertyProfit), marketInvestmentResult: Math.round(marketInvestmentResult), propertyValue: Math.round(propertyValue), equityAfterSale: Math.round(equityAfterSale), cumulativeCashFlow: Math.round(cumulativeCashFlow), reinvestedCashFlow: Math.round(reinvestedCashFlow) });
  }
  const last = rows[rows.length - 1] || { rentalPropertyProfit: 0, marketInvestmentResult: 0, propertyValue: 0, equityAfterSale: 0, cumulativeCashFlow: 0, reinvestedCashFlow: 0 };
  const winner = last.rentalPropertyProfit > last.marketInvestmentResult ? "Rental Property Profit" : "Market Investment Result";
  const gap = Math.abs(last.rentalPropertyProfit - last.marketInvestmentResult);
  return { rows, downPayment, closingCosts, initialCashNeeded, loanAmount, monthlyMortgage, monthlyPropertyTax, monthlyInsurance, monthlyMaintenance, managementMonthly, effectiveMonthlyRent, monthlyOperatingExpenses, monthlyCashFlow, annualCashFlow, annualNOI, cashOnCash, capRate, breakEvenRent, endingPropertyValue: last.propertyValue, equityAfterSale: last.equityAfterSale, cumulativeCashFlow: last.cumulativeCashFlow, reinvestedCashFlow: last.reinvestedCashFlow, rentalPropertyProfit: last.rentalPropertyProfit, marketInvestmentResult: last.marketInvestmentResult, rentalVsAlt: last.rentalPropertyProfit - last.marketInvestmentResult, rentalAnnualized: initialCashNeeded > 0 && years > 0 ? (safePow(Math.max(0, last.rentalPropertyProfit) / initialCashNeeded, 1 / years) - 1) * 100 : 0, winner, gap };
}
function RentalPropertyCalculator({ title = "Rental Property vs. Market Investment Calculator", description = "A cleaner grouped-layout version of the rental property calculator." }) {
  const [purchasePrice, setPurchasePrice] = useState(750000);
  const [monthlyRent, setMonthlyRent] = useState(4500);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [rate, setRate] = useState(6.75);
  const [appreciation, setAppreciation] = useState(4);
  const [marketReturn, setMarketReturn] = useState(10);
  const [rentGrowth, setRentGrowth] = useState(2);
  const [vacancyPct, setVacancyPct] = useState(5);
  const [propertyTaxPct, setPropertyTaxPct] = useState(1.1);
  const [annualInsurance, setAnnualInsurance] = useState(3000);
  const [maintenancePct, setMaintenancePct] = useState(1);
  const [managementPct, setManagementPct] = useState(8);
  const [closingCostPct, setClosingCostPct] = useState(2.5);
  const [sellingCostPct, setSellingCostPct] = useState(6);
  const [years, setYears] = useState(30);
  const [cashFlowStrategy, setCashFlowStrategy] = useState("reinvest");
  const [reinvestLossCoverage, setReinvestLossCoverage] = useState(true);
  const result = useMemo(() => calculateRentalPropertyScenario({ purchasePrice, monthlyRent, downPaymentPct, rate, appreciation, marketReturn, rentGrowth, vacancyPct, propertyTaxPct, annualInsurance, maintenancePct, managementPct, closingCostPct, sellingCostPct, years, cashFlowStrategy, reinvestLossCoverage }), [purchasePrice, monthlyRent, downPaymentPct, rate, appreciation, marketReturn, rentGrowth, vacancyPct, propertyTaxPct, annualInsurance, maintenancePct, managementPct, closingCostPct, sellingCostPct, years, cashFlowStrategy, reinvestLossCoverage]);
  const winnerDetail = result.winner === "Rental Property Profit" ? `by ${formatMoney(result.gap)} more than market investing.` : `by ${formatMoney(result.gap)} more than the rental property.`;
  return <CalculatorFrame title={title} description={description} exportData={{ columns: RENTAL_PROPERTY_EXPORT_COLUMNS, rows: result.rows }}><div className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><SmallStat label="Winner" value={`${result.winner} wins`} detail={winnerDetail} tone={result.winner === "Rental Property Profit" ? "green" : "blue"} /><SmallStat label="Rental Property Profit" value={formatCompactMoney(result.rentalPropertyProfit)} tone="green" /><SmallStat label="Market Investment Result" value={formatCompactMoney(result.marketInvestmentResult)} tone="blue" /></div><div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]"><Card><SectionTitle icon={BuildingIcon} title="Main Assumptions" subtitle="Core purchase, financing, rent, timeline, and cash-flow strategy." /><div className="space-y-4"><MoneyInput label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} max={2500000} step={10000} /><PercentInput label="Down payment" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={60} helperText={`${formatMoney(result.downPayment)} cash into property`} /><PercentInput label="Mortgage rate" value={rate} onChange={setRate} min={0} max={12} helperText={`Monthly mortgage = ${formatMoney(result.monthlyMortgage)}`} /><RangeInput label="Time horizon" value={years} onChange={setYears} min={1} max={30} suffix="yrs" /><MoneyInput label="Monthly rent" value={monthlyRent} onChange={setMonthlyRent} max={20000} step={100} helperText={`Break Even amount: ${formatMoney(result.breakEvenRent)}`} /><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setCashFlowStrategy("reinvest")} className={`rounded-xl border px-3 py-2 text-xs font-bold ${cashFlowStrategy === "reinvest" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}>Reinvest cash flow</button><button type="button" onClick={() => setCashFlowStrategy("paydown")} className={`rounded-xl border px-3 py-2 text-xs font-bold ${cashFlowStrategy === "paydown" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}>Pay off loan</button></div></div></Card><Card className="flex min-h-[560px] flex-col"><SectionTitle icon={TrendingUpIcon} title="Rental property vs. market investment" subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${years} years.`} /><div className="min-h-[360px] flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatCompactMoney} tickLine={false} axisLine={false} width={72} /><Tooltip content={<ChartTooltip />} /><Legend /><Line type="monotone" dataKey="rentalPropertyProfit" name="Rental Property Profit" stroke="#059669" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="marketInvestmentResult" name="Market Investment Result" stroke="#0284c7" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></Card></div><div className="grid gap-5 lg:grid-cols-2"><Card><SectionTitle icon={DollarIcon} title="Rental Expenses & Transaction Costs" subtitle="Operating costs, taxes, closing costs, and sale costs." /><div className="grid gap-4 md:grid-cols-2"><PercentInput label="Vacancy allowance" value={vacancyPct} onChange={setVacancyPct} min={0} max={25} /><PercentInput label="Property tax" value={propertyTaxPct} onChange={setPropertyTaxPct} min={0} max={3} helperText={`${formatMoney(result.monthlyPropertyTax)} / month`} /><MoneyInput label="Annual insurance" value={annualInsurance} onChange={setAnnualInsurance} max={20000} step={100} helperText={`${formatMoney(result.monthlyInsurance)} / month`} /><PercentInput label="Maintenance" value={maintenancePct} onChange={setMaintenancePct} min={0} max={5} helperText={`${formatMoney(result.monthlyMaintenance)} / month`} /><PercentInput label="Management" value={managementPct} onChange={setManagementPct} min={0} max={15} helperText={`${formatMoney(result.managementMonthly)} / month`} /><PercentInput label="Buying closing costs" value={closingCostPct} onChange={setClosingCostPct} min={0} max={10} helperText={formatMoney(result.closingCosts)} /><PercentInput label="Selling costs" value={sellingCostPct} onChange={setSellingCostPct} min={0} max={12} /></div></Card><Card><SectionTitle icon={TrendingUpIcon} title="Investment & Growth Assumptions" subtitle="Market alternative, appreciation, rent growth, and loss coverage." /><div className="grid gap-4 md:grid-cols-2"><PercentInput label="Appreciation" value={appreciation} onChange={setAppreciation} min={-2} max={10} /><PercentInput label="Rent growth" value={rentGrowth} onChange={setRentGrowth} min={0} max={8} /><div className="md:col-span-2"><MarketReturnPicker value={marketReturn} onChange={setMarketReturn} /></div></div><label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700"><input type="checkbox" checked={reinvestLossCoverage} onChange={(event) => setReinvestLossCoverage(event.target.checked)} className="mt-1 h-4 w-4 accent-neutral-950" /><span><strong className="text-neutral-950">Reinvest loss coverage</strong><br />Treat negative cash flow coverage as part of the market alternative comparison.</span></label></Card></div><OwnershipCostSummary title="Ownership cost summary" subtitle="Today's monthly rent and expense waterfall for the rental property." startingLabel="Effective monthly rent" startingAmount={result.effectiveMonthlyRent} items={[{ label: "Less monthly mortgage", amount: result.monthlyMortgage }, { label: "Less property taxes", amount: result.monthlyPropertyTax }, { label: "Less insurance", amount: result.monthlyInsurance }, { label: "Less maintenance", amount: result.monthlyMaintenance }, { label: "Less management", amount: result.managementMonthly }]} totalLabel="Monthly ownership and operating costs" totalAmount={result.monthlyMortgage + result.monthlyOperatingExpenses} remainingLabel="Monthly cash flow today" remainingAmount={result.monthlyCashFlow} note="This is a current-month view. The full model still applies future rent growth, appreciation, and loan amortization." /><Card><SectionTitle icon={BarChartIcon} title="Return Metrics" subtitle="Supporting metrics from the rental property path." /><div className="grid gap-4 md:grid-cols-4"><SmallStat label="Monthly cash flow" value={formatMoney(result.monthlyCashFlow)} tone={result.monthlyCashFlow >= 0 ? "green" : "amber"} /><SmallStat label="Break-even rent" value={formatMoney(result.breakEvenRent)} /><SmallStat label="Cash-on-cash" value={formatPercent(result.cashOnCash)} /><SmallStat label="Cap rate" value={formatPercent(result.capRate)} /><SmallStat label="Effective monthly rent" value={formatMoney(result.effectiveMonthlyRent)} /><SmallStat label="Net operating income" value={formatMoney(result.annualNOI)} /><SmallStat label="Equity after sale" value={formatCompactMoney(result.equityAfterSale)} tone="green" /><SmallStat label="Ending property value" value={formatCompactMoney(result.endingPropertyValue)} tone="green" /></div></Card></div></CalculatorFrame>;
}

function AutoCostCalculator() {
  const [yearsOwned, setYearsOwned] = useState(10);
  const [marketReturn, setMarketReturn] = useState(10);
  const [equalizedPrice, setEqualizedPrice] = useState(45000);
  const [usedPrice, setUsedPrice] = useState(28000);
  const [usedDownPayment, setUsedDownPayment] = useState(20);
  const [usedTradeInValue, setUsedTradeInValue] = useState(0);
  const [usedRate, setUsedRate] = useState(6.5);
  const [usedLoanMonths, setUsedLoanMonths] = useState(60);
  const [usedDepreciation, setUsedDepreciation] = useState(10);
  const [usedInsurance, setUsedInsurance] = useState(1800);
  const [usedMaintenance, setUsedMaintenance] = useState(1600);
  const [usedRegistration, setUsedRegistration] = useState(350);
  const [usedFuel, setUsedFuel] = useState(2400);
  const [newPrice, setNewPrice] = useState(48000);
  const [newDownPayment, setNewDownPayment] = useState(20);
  const [newTradeInValue, setNewTradeInValue] = useState(0);
  const [newRate, setNewRate] = useState(6.5);
  const [newLoanMonths, setNewLoanMonths] = useState(60);
  const [newDepreciation, setNewDepreciation] = useState(15);
  const [newInsurance, setNewInsurance] = useState(2400);
  const [newMaintenance, setNewMaintenance] = useState(900);
  const [newRegistration, setNewRegistration] = useState(550);
  const [newFuel, setNewFuel] = useState(2400);
  const [leaseCarValue, setLeaseCarValue] = useState(45000);
  const [leaseDueAtSigning, setLeaseDueAtSigning] = useState(4000);
  const [leaseMonthlyPayment, setLeaseMonthlyPayment] = useState(550);
  const [leaseInsurance, setLeaseInsurance] = useState(2400);
  const [leaseMaintenance, setLeaseMaintenance] = useState(500);
  const [leaseRegistration, setLeaseRegistration] = useState(550);
  const [leaseFuel, setLeaseFuel] = useState(2400);
  const [leaseDispositionFee, setLeaseDispositionFee] = useState(500);
  const [leaseResidualPct, setLeaseResidualPct] = useState(55);
  const [leasePostBuyoutDepreciation, setLeasePostBuyoutDepreciation] = useState(10);
  const [leaseBuyoutAtEnd, setLeaseBuyoutAtEnd] = useState(false);
  const used = useMemo(() => calculateAutoScenario({ price: usedPrice, downPaymentPct: usedDownPayment, tradeInValue: usedTradeInValue, rate: usedRate, loanTermMonths: usedLoanMonths, yearsOwned, depreciationPct: usedDepreciation, annualInsurance: usedInsurance, annualMaintenance: usedMaintenance, annualRegistration: usedRegistration, annualFuel: usedFuel }), [usedPrice, usedDownPayment, usedTradeInValue, usedRate, usedLoanMonths, yearsOwned, usedDepreciation, usedInsurance, usedMaintenance, usedRegistration, usedFuel]);
  const newer = useMemo(() => calculateAutoScenario({ price: newPrice, downPaymentPct: newDownPayment, tradeInValue: newTradeInValue, rate: newRate, loanTermMonths: newLoanMonths, yearsOwned, depreciationPct: newDepreciation, annualInsurance: newInsurance, annualMaintenance: newMaintenance, annualRegistration: newRegistration, annualFuel: newFuel }), [newPrice, newDownPayment, newTradeInValue, newRate, newLoanMonths, yearsOwned, newDepreciation, newInsurance, newMaintenance, newRegistration, newFuel]);
  const lease = useMemo(() => calculateLeaseScenario({ carValue: leaseCarValue, dueAtSigning: leaseDueAtSigning, monthlyPayment: leaseMonthlyPayment, yearsOwned, annualInsurance: leaseInsurance, annualMaintenance: leaseMaintenance, annualRegistration: leaseRegistration, annualFuel: leaseFuel, dispositionFee: leaseDispositionFee, residualPct: leaseResidualPct, buyoutAtEnd: leaseBuyoutAtEnd, postBuyoutDepreciationPct: leasePostBuyoutDepreciation }), [leaseCarValue, leaseDueAtSigning, leaseMonthlyPayment, yearsOwned, leaseInsurance, leaseMaintenance, leaseRegistration, leaseFuel, leaseDispositionFee, leaseResidualPct, leasePostBuyoutDepreciation, leaseBuyoutAtEnd]);
  const comparison = useMemo(() => calculateAutoInvestmentComparison({ used, newer, lease, yearsOwned, marketReturn }), [used, newer, lease, yearsOwned, marketReturn]);
  const autoCostRows = useMemo(() => AUTO_COST_TABLE_YEARS.map((yearOption) => {
    const usedRow = calculateAutoScenario({ price: usedPrice, downPaymentPct: usedDownPayment, tradeInValue: usedTradeInValue, rate: usedRate, loanTermMonths: usedLoanMonths, yearsOwned: yearOption, depreciationPct: usedDepreciation, annualInsurance: usedInsurance, annualMaintenance: usedMaintenance, annualRegistration: usedRegistration, annualFuel: usedFuel });
    const newRow = calculateAutoScenario({ price: newPrice, downPaymentPct: newDownPayment, tradeInValue: newTradeInValue, rate: newRate, loanTermMonths: newLoanMonths, yearsOwned: yearOption, depreciationPct: newDepreciation, annualInsurance: newInsurance, annualMaintenance: newMaintenance, annualRegistration: newRegistration, annualFuel: newFuel });
    const leaseRow = calculateLeaseScenario({ carValue: leaseCarValue, dueAtSigning: leaseDueAtSigning, monthlyPayment: leaseMonthlyPayment, yearsOwned: yearOption, annualInsurance: leaseInsurance, annualMaintenance: leaseMaintenance, annualRegistration: leaseRegistration, annualFuel: leaseFuel, dispositionFee: leaseDispositionFee, residualPct: leaseResidualPct, buyoutAtEnd: leaseBuyoutAtEnd, postBuyoutDepreciationPct: leasePostBuyoutDepreciation });
    const investment = calculateAutoInvestmentComparison({ used: usedRow, newer: newRow, lease: leaseRow, yearsOwned: yearOption, marketReturn });
    return {
      years: yearOption,
      used: usedRow,
      newer: newRow,
      lease: leaseRow,
      investment,
    };
  }), [usedPrice, usedDownPayment, usedTradeInValue, usedRate, usedLoanMonths, usedDepreciation, usedInsurance, usedMaintenance, usedRegistration, usedFuel, newPrice, newDownPayment, newTradeInValue, newRate, newLoanMonths, newDepreciation, newInsurance, newMaintenance, newRegistration, newFuel, leaseCarValue, leaseDueAtSigning, leaseMonthlyPayment, leaseInsurance, leaseMaintenance, leaseRegistration, leaseFuel, leaseDispositionFee, leaseResidualPct, leasePostBuyoutDepreciation, leaseBuyoutAtEnd, marketReturn]);
  const autoCostExportRows = useMemo(() => autoCostRows.flatMap((row) => [
    { years: row.years, option: "Used", totalCashOut: Math.round(row.used.totalCashOut), resaleValue: Math.round(row.used.resaleValue), netCost: Math.round(row.used.netCost), savedCashInvested: Math.round(row.investment.used.savedCashInvested), investmentGrowth: Math.round(row.investment.used.investmentGrowth), investmentValue: Math.round(row.investment.used.investmentValue), outcome: Math.round(row.investment.used.outcome) },
    { years: row.years, option: "New", totalCashOut: Math.round(row.newer.totalCashOut), resaleValue: Math.round(row.newer.resaleValue), netCost: Math.round(row.newer.netCost), savedCashInvested: Math.round(row.investment.newer.savedCashInvested), investmentGrowth: Math.round(row.investment.newer.investmentGrowth), investmentValue: Math.round(row.investment.newer.investmentValue), outcome: Math.round(row.investment.newer.outcome) },
    { years: row.years, option: "Lease", totalCashOut: Math.round(row.lease.totalCashOut), resaleValue: Math.round(row.lease.resaleValue), netCost: Math.round(row.lease.netCost), savedCashInvested: Math.round(row.investment.lease.savedCashInvested), investmentGrowth: Math.round(row.investment.lease.investmentGrowth), investmentValue: Math.round(row.investment.lease.investmentValue), outcome: Math.round(row.investment.lease.outcome) },
  ]), [autoCostRows]);
  const winner = comparison.winner;
  const equalizePurchasePrices = () => { setUsedPrice(equalizedPrice); setNewPrice(equalizedPrice); setLeaseCarValue(equalizedPrice); };
  return <CalculatorFrame title="New Car vs. Used Car vs. Leased Car Calculator" description="Compare the estimated cost of buying a used car, buying a new car, or leasing." exportData={{ columns: AUTO_COST_EXPORT_COLUMNS, rows: autoCostExportRows }}><div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><SmallStat label="Better outcome" value={`${winner.label} wins`} detail={`by ${formatMoney(comparison.gap)} after investing savings.`} tone={winner.id === "used" ? "blue" : winner.id === "new" ? "green" : "amber"} /><SmallStat label="Used car outcome" value={formatCompactMoney(comparison.used.outcome)} detail={`${formatMoney(comparison.used.investedSavings)} invested savings`} tone="blue" /><SmallStat label="New car outcome" value={formatCompactMoney(comparison.newer.outcome)} detail={`${formatMoney(comparison.newer.investedSavings)} invested savings`} tone="green" /><SmallStat label="Lease outcome" value={formatCompactMoney(comparison.lease.outcome)} detail={`${formatMoney(comparison.lease.investedSavings)} invested savings`} tone="amber" /></div><div className="grid gap-5 lg:grid-cols-2"><Card><SectionTitle icon={CarIcon} title="Comparison period" subtitle="Choose how long you plan to own the vehicle." /><RangeInput label="Years owned" value={yearsOwned} onChange={setYearsOwned} min={1} max={12} suffix="yrs" helperText="Defaults to a 10-year comparison period." /></Card><Card><SectionTitle icon={TrendingUpIcon} title="Index fund alternative" subtitle="Any monthly savings from the cheaper car are invested at this return." /><MarketReturnPicker value={marketReturn} onChange={setMarketReturn} /></Card></div><div className="grid gap-5 xl:grid-cols-3"><AutoInputCard title="Used car" color="blue" price={usedPrice} setPrice={setUsedPrice} downPayment={usedDownPayment} setDownPayment={setUsedDownPayment} tradeInValue={usedTradeInValue} setTradeInValue={setUsedTradeInValue} rate={usedRate} setRate={setUsedRate} loanMonths={usedLoanMonths} setLoanMonths={setUsedLoanMonths} depreciation={usedDepreciation} setDepreciation={setUsedDepreciation} insurance={usedInsurance} setInsurance={setUsedInsurance} maintenance={usedMaintenance} setMaintenance={setUsedMaintenance} registration={usedRegistration} setRegistration={setUsedRegistration} fuel={usedFuel} setFuel={setUsedFuel} result={used} /><AutoInputCard title="New car" color="green" price={newPrice} setPrice={setNewPrice} downPayment={newDownPayment} setDownPayment={setNewDownPayment} tradeInValue={newTradeInValue} setTradeInValue={setNewTradeInValue} rate={newRate} setRate={setNewRate} loanMonths={newLoanMonths} setLoanMonths={setNewLoanMonths} depreciation={newDepreciation} setDepreciation={setNewDepreciation} insurance={newInsurance} setInsurance={setNewInsurance} maintenance={newMaintenance} setMaintenance={setNewMaintenance} registration={newRegistration} setRegistration={setNewRegistration} fuel={newFuel} setFuel={setNewFuel} result={newer} /><LeaseInputCard carValue={leaseCarValue} setCarValue={setLeaseCarValue} dueAtSigning={leaseDueAtSigning} setDueAtSigning={setLeaseDueAtSigning} monthlyPayment={leaseMonthlyPayment} setMonthlyPayment={setLeaseMonthlyPayment} insurance={leaseInsurance} setInsurance={setLeaseInsurance} maintenance={leaseMaintenance} setMaintenance={setLeaseMaintenance} registration={leaseRegistration} setRegistration={setLeaseRegistration} fuel={leaseFuel} setFuel={setLeaseFuel} dispositionFee={leaseDispositionFee} setDispositionFee={setLeaseDispositionFee} residualPct={leaseResidualPct} setResidualPct={setLeaseResidualPct} postBuyoutDepreciation={leasePostBuyoutDepreciation} setPostBuyoutDepreciation={setLeasePostBuyoutDepreciation} buyoutAtEnd={leaseBuyoutAtEnd} setBuyoutAtEnd={setLeaseBuyoutAtEnd} result={lease} /></div><Card><SectionTitle icon={CarIcon} title="Equalize vehicle price" subtitle="Set a common vehicle price for Used, New, and Lease before reviewing the 3, 5, and 10 year table." /><MoneyInput label="Equalized vehicle price" value={equalizedPrice} onChange={setEqualizedPrice} max={200000} step={1000} /><button type="button" onClick={equalizePurchasePrices} className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-50">Apply equalized price to all auto options</button><p className="mt-2 text-xs leading-5 text-neutral-500">Sets the used purchase price, new purchase price, and lease car value to the selected amount.</p></Card><AutoCostTimelineTable rows={autoCostRows} /></div></CalculatorFrame>;
}
function AutoCostTimelineTable({ rows }) {
  const options = [{ key: "used", label: "Used" }, { key: "newer", label: "New" }, { key: "lease", label: "Lease" }];
  return <Card><SectionTitle icon={BarChartIcon} title="3, 5, and 10 Year Cost Comparison" subtitle="Estimated total cash out, resale value, and net cost for each auto option." /><div className="overflow-x-auto rounded-2xl border border-neutral-200"><table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0 text-left text-xs leading-tight"><thead className="bg-white"><tr className="uppercase tracking-wide text-neutral-500"><th className="w-[8%] border-b border-neutral-200 px-3 py-2">Years</th><th className="w-[12%] border-b border-neutral-200 px-3 py-2">Option</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Total Cash Out</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Resale</th><th className="w-[13.33%] border-b border-r border-neutral-300 px-3 py-2 text-right">Net Cost</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Saved Cash Invested</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Investment Growth</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Investment Value</th><th className="w-[13.33%] border-b border-neutral-200 px-3 py-2 text-right">Net Outcome</th></tr></thead><tbody>{rows.flatMap((row) => { const bestNetCost = Math.min(...options.map((option) => row[option.key].netCost)); return [<tr key={`${row.years}-group`}><td colSpan={9} className="bg-neutral-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-600">{row.years} year comparison</td></tr>, ...options.map((option) => { const data = row[option.key]; const investment = option.key === "used" ? row.investment.used : option.key === "newer" ? row.investment.newer : row.investment.lease; const isBest = data.netCost === bestNetCost; const bestOutcome = row.investment.winner.id === investment.id; return <tr key={`${row.years}-${option.key}`}><td className="border-b border-neutral-100 px-3 py-2 font-semibold text-neutral-400"></td><td className="border-b border-neutral-100 px-3 py-2 font-semibold text-neutral-950">{option.label}</td><td className="border-b border-neutral-100 px-3 py-2 text-right">{formatCost(data.totalCashOut)}</td><td className="border-b border-neutral-100 px-3 py-2 text-right">{formatMoney(data.resaleValue)}</td><td className={`border-b border-r border-neutral-300 px-3 py-2 text-right font-bold ${isBest ? "bg-emerald-50 text-emerald-800" : "text-neutral-950"}`}>{formatCost(data.netCost)}</td><td className="border-b border-neutral-100 px-3 py-2 text-right">{formatMoney(investment.savedCashInvested)}</td><td className="border-b border-neutral-100 px-3 py-2 text-right">{formatMoney(investment.investmentGrowth)}</td><td className="border-b border-neutral-100 px-3 py-2 text-right">{formatMoney(investment.investmentValue)}</td><td className={`border-b px-3 py-2 text-right font-bold ${bestOutcome ? "border-sky-200 bg-sky-50 text-sky-800" : "border-neutral-100 text-neutral-950"}`}>{formatMoney(investment.outcome)}</td></tr>; })]; })}</tbody></table></div></Card>;
}
function AutoInputCard({ title, color, price, setPrice, downPayment, setDownPayment, tradeInValue, setTradeInValue, rate, setRate, loanMonths, setLoanMonths, depreciation, setDepreciation, insurance, setInsurance, maintenance, setMaintenance, registration, setRegistration, fuel, setFuel, result }) {
  return <Card className="flex h-full flex-col"><SectionTitle icon={CarIcon} title={title} subtitle="Purchase, financing, depreciation, and annual ownership costs." /><div className="flex flex-1 flex-col"><div className="space-y-4"><MoneyInput label="Purchase price" value={price} onChange={setPrice} max={200000} step={1000} /><PercentInput label="Down payment" value={downPayment} onChange={setDownPayment} min={0} max={100} helperText={`${formatMoney(result.downPayment)} cash down; ${formatMoney(result.effectiveDownPayment)} total down incl. trade-in`} /><MoneyInput label="Trade-in value" value={tradeInValue} onChange={setTradeInValue} max={100000} step={500} helperText={`${formatMoney(result.loanAmount)} financed`} /><PercentInput label="Loan rate" value={rate} onChange={setRate} min={0} max={25} helperText={`${formatMoney(result.monthlyPayment)} / month`} /><RangeInput label="Loan term" value={loanMonths} onChange={setLoanMonths} min={12} max={84} step={12} suffix="mo" /></div><AdditionalCostsSection><PercentInput label="Annual depreciation" value={depreciation} onChange={setDepreciation} min={0} max={40} helperText={`${formatMoney(result.resaleValue)} estimated resale value`} /><MoneyInput label="Annual insurance" value={insurance} onChange={setInsurance} max={10000} step={100} /><MoneyInput label="Annual maintenance" value={maintenance} onChange={setMaintenance} max={15000} step={100} /><MoneyInput label="Annual registration / taxes" value={registration} onChange={setRegistration} max={5000} step={50} /><MoneyInput label="Annual fuel / charging" value={fuel} onChange={setFuel} max={12000} step={100} /></AdditionalCostsSection></div><div className="mt-4 grid gap-3 md:grid-cols-2"><SmallStat label="Total cash out" value={formatMoney(result.totalCashOut)} /><SmallStat label="Estimated resale" value={formatMoney(result.resaleValue)} /><SmallStat label="Net cost" value={formatMoney(result.netCost)} tone={color} /><SmallStat label="Monthly payment" value={formatMoney(result.monthlyPayment)} /></div></Card>;
}
function LeaseInputCard({ carValue, setCarValue, dueAtSigning, setDueAtSigning, monthlyPayment, setMonthlyPayment, insurance, setInsurance, maintenance, setMaintenance, registration, setRegistration, fuel, setFuel, dispositionFee, setDispositionFee, residualPct, setResidualPct, postBuyoutDepreciation, setPostBuyoutDepreciation, buyoutAtEnd, setBuyoutAtEnd, result }) {
  return <Card className="flex h-full flex-col"><SectionTitle icon={CarIcon} title="Lease" subtitle="Due at signing, monthly lease payment, annual lease costs, and optional buyout." /><div className="flex flex-1 flex-col"><div className="space-y-4"><MoneyInput label="Car value" value={carValue} onChange={setCarValue} max={200000} step={1000} /><MoneyInput label="Due at signing" value={dueAtSigning} onChange={setDueAtSigning} max={50000} step={500} /><MoneyInput label="Monthly lease payment" value={monthlyPayment} onChange={setMonthlyPayment} max={3000} step={25} /><MoneyInput label="Lease disposition fee" value={dispositionFee} onChange={setDispositionFee} max={3000} step={50} /><PercentInput label="Residual value" value={residualPct} onChange={setResidualPct} min={10} max={90} helperText={`${formatMoney(result.residualValue)} estimated buyout price at lease end`} /><label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700"><input type="checkbox" checked={buyoutAtEnd} onChange={(event) => setBuyoutAtEnd(event.target.checked)} className="mt-1 h-4 w-4 accent-neutral-950" /><span><strong className="text-neutral-950">Buy out lease at residual value</strong><br />Adds the residual as a buyout cost, then assumes the bought-out vehicle depreciates and is sold at the end of the comparison period.</span></label></div><AdditionalCostsSection><PercentInput label="Annual depreciation" value={postBuyoutDepreciation} onChange={setPostBuyoutDepreciation} min={0} max={40} helperText={`${formatMoney(result.buyoutResaleValue)} estimated resale after buyout`} /><MoneyInput label="Annual insurance" value={insurance} onChange={setInsurance} max={10000} step={100} /><MoneyInput label="Annual maintenance" value={maintenance} onChange={setMaintenance} max={15000} step={100} /><MoneyInput label="Annual registration / taxes" value={registration} onChange={setRegistration} max={5000} step={50} /><MoneyInput label="Annual fuel / charging" value={fuel} onChange={setFuel} max={12000} step={100} /></AdditionalCostsSection></div><div className="mt-4 grid gap-3 md:grid-cols-2"><SmallStat label="Total cash out" value={formatMoney(result.totalCashOut)} /><SmallStat label="Estimated resale" value={formatMoney(result.resaleValue)} /><SmallStat label="Net cost" value={formatMoney(result.netCost)} tone="amber" /><SmallStat label="Buyout cost" value={formatMoney(result.buyoutCost)} /></div></Card>;
}

function calculateHomeValueScenario({ homePrice, salePrice, downPaymentPct, rate, loanTerm, yearsHeld, monthlyRent, marketReturn, rentInflation, propertyTaxPct, insuranceAnnual, maintenancePct, renovations, closingCostPct, sellingCostPct }) {
  const downPayment = homePrice * (downPaymentPct / 100);
  const buyingClosingCosts = homePrice * (closingCostPct / 100);
  const initialCash = downPayment + buyingClosingCosts + renovations;
  const loanAmount = Math.max(0, homePrice - downPayment);
  const mortgage = calculateMonthlyPayment(loanAmount, rate, loanTerm * 12);
  const monthlyRate = rate / 100 / 12;
  const monthlyPropertyTax = (homePrice * (propertyTaxPct / 100)) / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = (homePrice * (maintenancePct / 100)) / 12;
  const monthlyOwnershipCost = mortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance;
  const impliedAnnualAppreciation = yearsHeld > 0 && homePrice > 0 ? safePow(salePrice / homePrice, 1 / yearsHeld) - 1 : 0;
  let mortgageBalance = loanAmount;
  let marketPortfolio = initialCash;
  let renterSurplusPortfolio = 0;
  let buyerSurplusPortfolio = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  const rows = [{ year: 0, homeValueResult: Math.round(initialCash), marketInvestmentResult: Math.round(initialCash), homeValue: Math.round(homePrice), equityAfterSale: Math.round(Math.max(0, homePrice - homePrice * (sellingCostPct / 100) - loanAmount)), mortgageBalance: Math.round(loanAmount), annualRentAvoided: 0, houseAdvantage: 0 }];
  for (let year = 1; year <= yearsHeld; year++) {
    const currentRent = monthlyRent * safePow(1 + rentInflation / 100, year - 1);
    let annualPrincipal = 0;
    let annualInterest = 0;
    let annualRentAvoided = 0;
    for (let month = 1; month <= 12; month++) {
      const interest = mortgageBalance > 0 ? mortgageBalance * monthlyRate : 0;
      const principal = mortgageBalance > 0 ? Math.min(Math.max(0, mortgage - interest), mortgageBalance) : 0;
      mortgageBalance = Math.max(0, mortgageBalance - principal);
      annualPrincipal += principal;
      annualInterest += interest;
      annualRentAvoided += currentRent;
      marketPortfolio *= 1 + marketReturn / 100 / 12;
      renterSurplusPortfolio = renterSurplusPortfolio * (1 + marketReturn / 100 / 12) + Math.max(0, monthlyOwnershipCost - currentRent);
      buyerSurplusPortfolio = buyerSurplusPortfolio * (1 + marketReturn / 100 / 12) + Math.max(0, currentRent - monthlyOwnershipCost);
    }
    totalPrincipalPaid += annualPrincipal;
    totalInterestPaid += annualInterest;
    const homeValue = homePrice * safePow(1 + impliedAnnualAppreciation, year);
    const equityAfterSale = Math.max(0, homeValue - homeValue * (sellingCostPct / 100) - mortgageBalance);
    const homeValueResult = equityAfterSale + buyerSurplusPortfolio;
    const marketInvestmentResult = marketPortfolio + renterSurplusPortfolio;
    rows.push({ year, homeValueResult: Math.round(homeValueResult), marketInvestmentResult: Math.round(marketInvestmentResult), homeValue: Math.round(homeValue), equityAfterSale: Math.round(equityAfterSale), mortgageBalance: Math.round(mortgageBalance), annualRentAvoided: Math.round(annualRentAvoided), houseAdvantage: Math.round(homeValueResult - marketInvestmentResult) });
  }
  const last = rows[rows.length - 1];
  const winner = last.homeValueResult > last.marketInvestmentResult ? "House" : "Market";
  return { rows, downPayment, buyingClosingCosts, initialCash, loanAmount, mortgage, monthlyPropertyTax, monthlyInsurance, monthlyMaintenance, monthlyOwnershipCost, sellingCosts: last.homeValue * (sellingCostPct / 100), totalTransactionAndOwnershipCosts: buyingClosingCosts + last.homeValue * (sellingCostPct / 100) + (monthlyPropertyTax + monthlyInsurance + monthlyMaintenance) * 12 + renovations, totalPrincipalPaid, totalInterestPaid, netSaleProceeds: last.equityAfterSale, mortgageBalance: last.mortgageBalance, winner, gap: Math.abs(last.homeValueResult - last.marketInvestmentResult), houseResult: last.homeValueResult, marketResult: last.marketInvestmentResult, homeValue: last.homeValue, impliedAnnualAppreciation: impliedAnnualAppreciation * 100 };
}
function HomeValueCalculator() {
  const [homePrice, setHomePrice] = useState(1800000);
  const [salePrice, setSalePrice] = useState(3000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(5.65);
  const [loanTerm, setLoanTerm] = useState(30);
  const [yearsHeld, setYearsHeld] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(6200);
  const [marketReturn, setMarketReturn] = useState(10);
  const [rentInflation, setRentInflation] = useState(2);
  const [propertyTaxPct, setPropertyTaxPct] = useState(1.1);
  const [insuranceAnnual, setInsuranceAnnual] = useState(3600);
  const [maintenancePct, setMaintenancePct] = useState(1);
  const [renovations, setRenovations] = useState(0);
  const [closingCostPct, setClosingCostPct] = useState(2.5);
  const [sellingCostPct, setSellingCostPct] = useState(6);
  const result = useMemo(() => calculateHomeValueScenario({ homePrice, salePrice, downPaymentPct, rate, loanTerm, yearsHeld, monthlyRent, marketReturn, rentInflation, propertyTaxPct, insuranceAnnual, maintenancePct, renovations, closingCostPct, sellingCostPct }), [homePrice, salePrice, downPaymentPct, rate, loanTerm, yearsHeld, monthlyRent, marketReturn, rentInflation, propertyTaxPct, insuranceAnnual, maintenancePct, renovations, closingCostPct, sellingCostPct]);
  const winnerDetail = result.winner === "House" ? `by ${formatMoney(result.gap)} more than market investing.` : `by ${formatMoney(result.gap)} more than the house.`;
  return <CalculatorFrame title="Home Value vs. Market Investment Calculator" description="Compare buying a home against putting the same starting cash and monthly savings into the market." exportData={{ columns: HOME_VALUE_EXPORT_COLUMNS, rows: result.rows }}><div className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><SmallStat label="Winner" value={`${result.winner} wins`} detail={winnerDetail} tone={result.winner === "House" ? "green" : "blue"} /><SmallStat label="Home Value Result" value={formatCompactMoney(result.houseResult)} tone="green" /><SmallStat label="Market Investment Result" value={formatCompactMoney(result.marketResult)} tone="blue" /></div><div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]"><Card><SectionTitle icon={ScaleIcon} title="Main Assumptions" subtitle="Home price, expected sale price, financing, and hold period." /><div className="space-y-4"><MoneyInput label="Home price" value={homePrice} onChange={setHomePrice} max={5000000} step={10000} /><MoneyInput label="Sale price" value={salePrice} onChange={setSalePrice} max={8000000} step={10000} helperText={`Implied appreciation: ${formatPercent(result.impliedAnnualAppreciation)} / year`} /><PercentInput label="Down payment" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={50} helperText={`${formatMoney(result.downPayment)} cash into property`} /><PercentInput label="Mortgage rate" value={rate} onChange={setRate} min={0} max={10} helperText={`Monthly mortgage = ${formatMoney(result.mortgage)}`} /><RangeInput label="Years held" value={yearsHeld} onChange={setYearsHeld} min={1} max={30} suffix="yrs" /><RangeInput label="Loan term" value={loanTerm} onChange={setLoanTerm} min={10} max={30} step={5} suffix="yrs" /></div></Card><Card className="flex min-h-[560px] flex-col"><SectionTitle icon={BarChartIcon} title="Home value vs. market investment" subtitle={`${result.winner} is ahead by ${formatMoney(result.gap)} after ${yearsHeld} years.`} /><div className="min-h-[360px] flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatCompactMoney} tickLine={false} axisLine={false} width={72} /><Tooltip content={<ChartTooltip />} /><Legend /><Line type="monotone" dataKey="homeValueResult" name="Home Value Result" stroke="#059669" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="marketInvestmentResult" name="Market Investment Result" stroke="#0284c7" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></Card></div><div className="grid gap-5 lg:grid-cols-2"><Card><SectionTitle icon={DollarIcon} title="Transaction & Ownership Costs" subtitle="Closing costs, sale costs, maintenance, taxes, insurance, and improvements." /><div className="grid gap-4 md:grid-cols-2"><PercentInput label="Buying closing costs" value={closingCostPct} onChange={setClosingCostPct} min={0} max={8} helperText={formatMoney(result.buyingClosingCosts)} /><PercentInput label="Selling costs" value={sellingCostPct} onChange={setSellingCostPct} min={0} max={10} helperText={formatMoney(result.sellingCosts)} /><PercentInput label="Maintenance" value={maintenancePct} onChange={setMaintenancePct} min={0} max={4} helperText={`${formatMoney(result.monthlyMaintenance)} / month`} /><PercentInput label="Property taxes" value={propertyTaxPct} onChange={setPropertyTaxPct} min={0} max={3} helperText={`${formatMoney(result.monthlyPropertyTax)} / month`} /><MoneyInput label="Annual insurance" value={insuranceAnnual} onChange={setInsuranceAnnual} max={20000} step={100} helperText={`${formatMoney(result.monthlyInsurance)} / month`} /><MoneyInput label="Renovations / improvements" value={renovations} onChange={setRenovations} max={1000000} step={5000} /></div></Card><Card><SectionTitle icon={TrendingUpIcon} title="Rent & Market Investment Alternative" subtitle="Rent avoided by owning and alternate market return assumptions." /><div className="grid gap-4 md:grid-cols-2"><MoneyInput label="Monthly rent if you did not own" value={monthlyRent} onChange={setMonthlyRent} max={20000} step={100} /><PercentInput label="Annual rent inflation" value={rentInflation} onChange={setRentInflation} min={0} max={8} /><div className="md:col-span-2"><MarketReturnPicker value={marketReturn} onChange={setMarketReturn} /></div></div></Card></div><OwnershipCostSummary title="Ownership cost summary" subtitle="Today's monthly cash waterfall for the home value path." startingLabel="Monthly rent if you did not own" startingAmount={monthlyRent} items={[{ label: "Less monthly mortgage", amount: result.mortgage }, { label: "Less property taxes", amount: result.monthlyPropertyTax }, { label: "Less insurance", amount: result.monthlyInsurance }, { label: "Less maintenance", amount: result.monthlyMaintenance }]} totalLabel="Monthly ownership cost" totalAmount={result.monthlyOwnershipCost} remainingLabel="Buyer surplus vs. renting today" remainingAmount={Math.max(0, monthlyRent - result.monthlyOwnershipCost)} note="This is a current-month comparison." /><Card><SectionTitle icon={BarChartIcon} title="Year-by-Year Comparison" subtitle="This shows estimated equity after sale versus the rent-and-invest alternative each year." /><div className="mt-2 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200"><table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-tight"><thead className="sticky top-0 bg-white"><tr className="uppercase tracking-wide text-neutral-500">{HOME_VALUE_YEAR_TABLE_COLUMNS.map((column) => <th key={column} className="break-words border-b border-neutral-200 px-3 py-2">{column}</th>)}</tr></thead><tbody>{result.rows.map((row) => <tr key={row.year}><td className="border-b border-neutral-100 px-3 py-2 font-semibold">{row.year}</td><td>{formatCompactMoney(row.homeValue)}</td><td>{formatCompactMoney(row.mortgageBalance)}</td><td>{formatCompactMoney(row.equityAfterSale)}</td><td>{formatCompactMoney(row.annualRentAvoided)}</td><td>{formatCompactMoney(row.marketInvestmentResult)}</td><td>{formatCompactMoney(row.houseAdvantage)}</td></tr>)}</tbody></table></div></Card></div></CalculatorFrame>;
}

function makeCollegeChildren(count, currentChildren = []) {
  return Array.from({ length: count }, (_, index) => currentChildren[index] || { id: `child-${index + 1}`, currentGrade: index === 0 ? 0 : index === 1 ? 2 : Math.max(-1, 2 - index * 2) });
}
function calculateCollegeSavingsScenario({ children, startingAmount, monthlyContribution, annualTuition, annualBoard, marketReturn, inflation }) {
  const monthlyRate = marketReturn / 100 / 12;
  const annualCollegeCost = annualTuition + annualBoard;
  const childPlans = children.map((child, index) => {
    const firstJulyMonth = 2 + Math.max(0, 12 - child.currentGrade) * 12;
    return { ...child, id: child.id || `child-${index + 1}`, name: `Child ${index + 1}`, firstJulyMonth, finalMonth: firstJulyMonth + 36 };
  });
  const horizonMonths = Math.max(12, ...childPlans.map((child) => child.finalMonth));
  const accounts = childPlans.map((child) => ({ ...child, balance: startingAmount, contributions: startingAmount, interest: 0, withdrawn: 0, shortfall: 0 }));
  const rows = [{ year: 0, month: 0, combinedBalance: Math.round(startingAmount * accounts.length), combinedWithdrawn: 0, combinedContributions: Math.round(startingAmount * accounts.length), combinedInterest: 0, shortfall: 0, ...Object.fromEntries(accounts.map((account) => [account.name, Math.round(account.balance)])) }];

  for (let month = 1; month <= horizonMonths; month++) {
    accounts.forEach((account) => {
      if (month <= account.finalMonth) {
        account.balance += monthlyContribution;
        account.contributions += monthlyContribution;
      }
      const interest = account.balance * monthlyRate;
      account.balance = Math.max(0, account.balance + interest);
      account.interest += interest;
      const collegeYear = [0, 12, 24, 36].findIndex((offset) => month === account.firstJulyMonth + offset);
      if (collegeYear >= 0) {
        const inflatedCost = annualCollegeCost * safePow(1 + inflation / 100, month / 12);
        let remainingCost = inflatedCost;
        const ownWithdrawal = Math.min(account.balance, remainingCost);
        account.balance -= ownWithdrawal;
        account.withdrawn += ownWithdrawal;
        remainingCost -= ownWithdrawal;
        if (remainingCost > 0) {
          accounts.forEach((sourceAccount) => {
            if (sourceAccount.id === account.id || remainingCost <= 0) return;
            const sharedWithdrawal = Math.min(sourceAccount.balance, remainingCost);
            sourceAccount.balance -= sharedWithdrawal;
            sourceAccount.withdrawn += sharedWithdrawal;
            remainingCost -= sharedWithdrawal;
          });
        }
        account.shortfall += Math.max(0, remainingCost);
      }
    });
    const combinedBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const combinedWithdrawn = accounts.reduce((sum, account) => sum + account.withdrawn, 0);
    const combinedContributions = accounts.reduce((sum, account) => sum + account.contributions, 0);
    const combinedInterest = accounts.reduce((sum, account) => sum + account.interest, 0);
    const shortfall = accounts.reduce((sum, account) => sum + account.shortfall, 0);
    rows.push({ year: Number((month / 12).toFixed(1)), month, combinedBalance: Math.round(combinedBalance), combinedWithdrawn: Math.round(combinedWithdrawn), combinedContributions: Math.round(combinedContributions), combinedInterest: Math.round(combinedInterest), shortfall: Math.round(shortfall), ...Object.fromEntries(accounts.map((account) => [account.name, Math.round(account.balance)])) });
  }
  const last = rows[rows.length - 1];
  const peakBalance = Math.max(...rows.map((row) => row.combinedBalance));
  const rawEndingBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const rawShortfall = accounts.reduce((sum, account) => sum + account.shortfall, 0);
  return { rows, accounts: accounts.map((account) => ({ ...account, balance: Math.round(account.balance), contributions: Math.round(account.contributions), interest: Math.round(account.interest), withdrawn: Math.round(account.withdrawn), shortfall: Math.round(account.shortfall) })), endingBalance: last.combinedBalance, peakBalance: Math.round(peakBalance), totalWithdrawn: last.combinedWithdrawn, totalContributions: last.combinedContributions, totalInterest: last.combinedInterest, shortfall: last.shortfall, rawEndingBalance, rawShortfall, horizonYears: Number((horizonMonths / 12).toFixed(1)) };
}
function findCollegeZeroBalanceContribution({ children, startingAmount, annualTuition, annualBoard, marketReturn, inflation }) {
  const scenarioFor = (monthlyContribution) => calculateCollegeSavingsScenario({ children, startingAmount, monthlyContribution, annualTuition, annualBoard, marketReturn, inflation });
  const isFunded = (scenario) => scenario.rawShortfall <= 0.01;
  const zeroContributionScenario = scenarioFor(0);
  if (isFunded(zeroContributionScenario)) return 0;
  let low = 0;
  let high = 100;
  while (!isFunded(scenarioFor(high)) && high < 100000) high *= 2;
  for (let index = 0; index < 36; index++) {
    const mid = (low + high) / 2;
    if (isFunded(scenarioFor(mid))) high = mid;
    else low = mid;
  }
  return Math.ceil(high * 1000) / 1000;
}
function SchoolYearSelect({ label, value, onChange }) {
  return <div><label className="text-sm font-medium text-neutral-800">{label}</label><select value={value} onChange={(event) => onChange(parseNumber(event.target.value))} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-950">{SCHOOL_YEAR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
function CollegeSavingsCalculator() {
  const [childCount, setChildCount] = useState(2);
  const [children, setChildren] = useState(() => makeCollegeChildren(2));
  const [annualTuition, setAnnualTuition] = useState(35000);
  const [annualBoard, setAnnualBoard] = useState(18000);
  const [startingAmount, setStartingAmount] = useState(25000);
  const [monthlyContribution, setMonthlyContribution] = useState(750);
  const [marketReturn, setMarketReturn] = useState(10);
  const [inflation, setInflation] = useState(4);
  const [showTable, setShowTable] = useState(false);
  const setSafeChildCount = (nextCount) => { const count = clampNumber(parseNumber(nextCount), 1, 6); setChildCount(count); setChildren((current) => makeCollegeChildren(count, current)); };
  const updateChildGrade = (index, currentGrade) => setChildren((current) => current.map((child, childIndex) => childIndex === index ? { ...child, currentGrade } : child));
  const setZeroEndingContribution = () => setMonthlyContribution(findCollegeZeroBalanceContribution({ children, startingAmount, annualTuition, annualBoard, marketReturn, inflation }));
  const result = useMemo(() => calculateCollegeSavingsScenario({ children, startingAmount, monthlyContribution, annualTuition, annualBoard, marketReturn, inflation }), [children, startingAmount, monthlyContribution, annualTuition, annualBoard, marketReturn, inflation]);
  const exportColumns = useMemo(() => [...COLLEGE_SAVINGS_EXPORT_COLUMNS, ...result.accounts.map((account) => ({ header: `${account.name} Balance`, key: account.name }))], [result.accounts]);
  return <CalculatorFrame title="College Savings Calculator" description="Project education savings by child, with monthly contributions, index-return assumptions, tuition and board inflation, and lump-sum July withdrawals for each college year." exportData={{ columns: exportColumns, rows: result.rows }}><div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><SmallStat label="Ending combined balance" value={formatCompactMoney(result.endingBalance)} tone={result.shortfall > 0 ? "amber" : "green"} /><SmallStat label="College costs paid" value={formatCompactMoney(result.totalWithdrawn)} tone="blue" /><SmallStat label="Investment growth" value={formatCompactMoney(result.totalInterest)} tone="green" /><SmallStat label="Uncovered shortfall" value={formatCompactMoney(result.shortfall)} tone={result.shortfall > 0 ? "amber" : "neutral"} /></div><div className="grid items-stretch gap-5 xl:grid-cols-[430px_1fr]"><Card><SectionTitle icon={GraduationIcon} title="Family & school timing" subtitle="Each child gets a separate account, using the same starting amount and monthly contribution." /><div className="space-y-4"><RangeInput label="# of children" value={childCount} onChange={setSafeChildCount} min={1} max={6} suffix="" /><div className="grid gap-4 sm:grid-cols-2">{children.map((child, index) => <SchoolYearSelect key={child.id} label={`Child ${index + 1} current year`} value={child.currentGrade} onChange={(grade) => updateChildGrade(index, grade)} />)}</div><MoneyInput label="Starting amount per child" value={startingAmount} onChange={setStartingAmount} max={500000} step={1000} /><MoneyInput label="Monthly contribution per child" value={monthlyContribution} onChange={setMonthlyContribution} max={10000} step={50} displayValue={numberFormatter.format(Math.round(monthlyContribution))} /><button type="button" onClick={setZeroEndingContribution} className="w-full rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800">End account with $0</button></div></Card><Card className="flex min-h-[560px] flex-col"><SectionTitle icon={BarChartIcon} title="Combined account value" subtitle={`Combined balances across ${childCount} ${childCount === 1 ? "child" : "children"} over ${result.horizonYears} years.`} /><div className="h-[360px] flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatCompactMoney} tickLine={false} axisLine={false} width={72} /><Tooltip content={<ChartTooltip />} /><Legend /><Line type="monotone" dataKey="combinedBalance" name="Combined Balance" stroke="#059669" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="combinedWithdrawn" name="Cumulative Withdrawals" stroke="#0284c7" strokeWidth={2} dot={false} strokeDasharray="6 4" />{result.shortfall > 0 && <Line type="monotone" dataKey="shortfall" name="Shortfall" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="3 5" />}</LineChart></ResponsiveContainer></div></Card></div><div className="grid gap-5 lg:grid-cols-2"><Card><SectionTitle icon={DollarIcon} title="College cost assumptions" subtitle="Tuition and board are withdrawn together every July during each four-year college period." /><div className="grid gap-4 md:grid-cols-2"><MoneyInput label="Annual tuition" value={annualTuition} onChange={setAnnualTuition} max={150000} step={1000} /><MoneyInput label="Annual board" value={annualBoard} onChange={setAnnualBoard} max={75000} step={500} /><PercentInput label="Education inflation" value={inflation} onChange={setInflation} min={0} max={12} helperText="Applied to each future July withdrawal." /><div><div className="text-sm font-medium text-neutral-800">Current annual cost</div><div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-950">{formatMoney(annualTuition + annualBoard)}</div></div></div></Card><Card><SectionTitle icon={TrendingUpIcon} title="Investment assumptions" subtitle="Use the same index-fund return presets as the other calculators." /><MarketReturnPicker value={marketReturn} onChange={setMarketReturn} /></Card></div><Card><SectionTitle icon={BarChartIcon} title="Individual account values" subtitle="Separate balance lines show each child's savings rising with contributions and falling after July withdrawals." /><div className="h-[420px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatCompactMoney} tickLine={false} axisLine={false} width={72} /><Tooltip content={<ChartTooltip />} /><Legend />{result.accounts.map((account, index) => <Line key={account.name} type="monotone" dataKey={account.name} name={account.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={3} dot={false} />)}</LineChart></ResponsiveContainer></div></Card><Card><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><SectionTitle icon={CalculatorIcon} title="Child account summary" subtitle="Balances, contributions, earnings, withdrawals, and any uncovered college cost." /><button type="button" onClick={() => setShowTable((value) => !value)} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{showTable ? "Hide monthly table" : "Show monthly table"}</button></div><div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.accounts.map((account) => <div key={account.name} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-sm font-bold text-neutral-950">{account.name}</div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><span className="text-neutral-500">Ending balance</span><strong className="text-right">{formatMoney(account.balance)}</strong><span className="text-neutral-500">Contributed</span><strong className="text-right">{formatMoney(account.contributions)}</strong><span className="text-neutral-500">Interest earned</span><strong className="text-right">{formatMoney(account.interest)}</strong><span className="text-neutral-500">Withdrawn</span><strong className="text-right">{formatMoney(account.withdrawn)}</strong><span className="text-neutral-500">Shortfall</span><strong className="text-right">{formatMoney(account.shortfall)}</strong></div></div>)}</div>{showTable && <div className="mt-4 max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200"><table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-tight"><thead className="sticky top-0 bg-white"><tr className="uppercase tracking-wide text-neutral-500"><th className="border-b border-neutral-200 px-3 py-2">Year</th><th className="border-b border-neutral-200 px-3 py-2">Combined</th><th className="border-b border-neutral-200 px-3 py-2">Withdrawn</th><th className="border-b border-neutral-200 px-3 py-2">Interest</th><th className="border-b border-neutral-200 px-3 py-2">Shortfall</th></tr></thead><tbody>{result.rows.filter((row) => row.month % 12 === 0 || row.month === 0).map((row) => <tr key={row.month}><td className="border-b border-neutral-100 px-3 py-2 font-semibold">{row.year}</td><td className="border-b border-neutral-100 px-3 py-2">{formatCompactMoney(row.combinedBalance)}</td><td className="border-b border-neutral-100 px-3 py-2">{formatCompactMoney(row.combinedWithdrawn)}</td><td className="border-b border-neutral-100 px-3 py-2">{formatCompactMoney(row.combinedInterest)}</td><td className="border-b border-neutral-100 px-3 py-2">{formatCompactMoney(row.shortfall)}</td></tr>)}</tbody></table></div>}</Card></div></CalculatorFrame>;
}
function LandingPage({ onSelectCalculator }) {
  const renderCard = (calculator) => {
    const Icon = calculator.icon;
    return (
      <a
        key={calculator.id}
        href={calculatorRouteMap[calculator.id]}
        className="group flex min-h-[330px] w-full flex-col rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md"
      >
        <div className="mb-5 flex h-12 items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 leading-none transition group-hover:bg-neutral-950 group-hover:text-white">
            <Icon className="block h-5 w-5" />
          </div>
        </div>
        <div className="flex min-h-[96px] flex-col items-start">
          <h2 className="min-h-[44px] text-lg font-semibold leading-tight tracking-tight text-neutral-950">{calculator.name}</h2>
          <div className="my-3 h-px w-full bg-neutral-200" />
          <p className="text-sm font-semibold leading-5 text-neutral-700">{calculator.subtitle}</p>
        </div>
        <p className="mt-5 text-xs leading-5 text-neutral-600">{calculator.description}</p>
        <div className="min-h-8 flex-1" />
      </a>
    );
  };

  return (
    <motion.div key="landing-page" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <section>
        <div className="mx-auto grid max-w-[380px] gap-5 md:max-w-[780px] md:grid-cols-2 min-[1440px]:max-w-none min-[1440px]:grid-cols-5">
          {calculators.map(renderCard)}
        </div>
      </section>
    </motion.div>
  );
}
const calculators = [
  { id: "rent-vs-buy", name: "Rent vs. Buy Calculator", subtitle: "Should I rent or buy?", shortName: "Rent vs. Buy", description: "Use the calculator to help you decide whether renting or buying a property is a better decision. Inputs include real estate values, rental values, as well as inflation, maintenance, and 30 year index investment projections.", icon: HomeIcon, component: RentVsBuyCalculator },
  { id: "rental-property-2", name: "Rental Property vs. Market Investment Calculator", subtitle: "Should I buy a property or invest the money?", shortName: "Rental vs. Market", description: "Use this calculator to decide if a rental property will be more profitable vs. a simple market investment over time. Inputs include real estate values, rental income, inflation, maintenance, and 30 year index investment projections.", icon: BuildingIcon, component: RentalPropertyCalculator },
  { id: "home-value", name: "Home Value vs. Market Investment Calculator", subtitle: "Did I make money buying and selling my house?", shortName: "Home vs. Market", description: "Use this calculator to understand if you made or lost money buying a property vs. investing in the market.", icon: ScaleIcon, component: HomeValueCalculator },
  { id: "auto-cost", name: "New Car vs. Used Car vs. Leased Car Calculator", subtitle: "Should I buy new or used?", shortName: "New/Used/Lease", description: "Use this calculator to compare the estimated cost of buying a new car versus a used car over time.", icon: CarIcon, component: AutoCostCalculator },
  { id: "college-savings", name: "College Savings Calculator", subtitle: "Am I saving enough for college?", shortName: "College", description: "Project college savings for one or more children with monthly contributions, index return assumptions, education inflation, and July tuition plus board withdrawals.", icon: GraduationIcon, component: CollegeSavingsCalculator },

];

const calculatorRouteMap = {
  "rent-vs-buy": "/rent-vs-buy",
  "rental-property-2": "/rental-property-eval",
  "auto-cost": "/auto-cost",
  "home-value": "/home-value-vs-market",
  "college-savings": "/college-savings",
};

const pageCopy = {
  landing: {
    title: "Planning calculators for major money decisions",
    body: [
      "These calculators help compare common financial tradeoffs involving homes, rental properties, vehicles, and market investing. Each tool uses the assumptions you enter so you can test different prices, rates, costs, timelines, and investment return scenarios.",
      "Use the calculators as a planning starting point, then verify the numbers with current quotes, local tax rules, financing terms, and qualified professionals before making a real purchase or investment decision.",
    ],
    sections: [
      { title: "Real estate tools", body: "Compare renting versus buying, evaluate a rental property, or measure a home purchase against a market investment alternative." },
      { title: "Vehicle tools", body: "Estimate the cost of buying new, buying used, or leasing while comparing saved cash against a market investment alternative." },
    ],
  },
  "rent-vs-buy": {
    title: "About this rent vs. buy calculator",
    body: [
      "This rent vs. buy calculator estimates whether renting and investing may outperform buying a home over a selected time period. It compares home equity after sale against a renter portfolio that invests upfront cash and any monthly cash flow advantage.",
      "The model includes purchase price, down payment, mortgage rate, loan term, rent, rent inflation, property tax, insurance, maintenance, closing costs, selling costs, renovations, home appreciation, and market return assumptions.",
    ],
    sections: [
      { title: "How to interpret the result", body: "A buying advantage means the estimated home equity and buyer surplus investment are ahead of the rent-and-invest alternative. A renting advantage means the estimated renter portfolio is ahead after the comparison period." },
      { title: "What to verify", body: "Confirm local property taxes, insurance, HOA fees if applicable, closing costs, sale costs, loan terms, and realistic maintenance before relying on the estimate." },
    ],
  },
  "rental-property-2": {
    title: "About this rental property calculator",
    body: [
      "This rental property calculator compares the estimated profit from owning a rental property against investing the same starting cash in the market. It is designed for testing whether a potential rental purchase looks attractive after financing, expenses, and sale assumptions.",
      "The model includes purchase price, down payment, mortgage rate, monthly rent, vacancy, property tax, insurance, maintenance, management, closing costs, selling costs, appreciation, rent growth, and market return assumptions.",
    ],
    sections: [
      { title: "How to interpret the result", body: "The rental property result combines estimated equity after sale, cumulative cash flow, and reinvested positive cash flow. The market result estimates what the initial cash could become if invested instead." },
      { title: "What to verify", body: "Review rent comps, vacancy expectations, repairs, capital reserves, property management fees, financing terms, local taxes, insurance, and transaction costs before making an offer." },
    ],
  },
  "home-value": {
    title: "About this home value vs. market calculator",
    body: [
      "This home value vs. market investment calculator estimates whether a completed or planned home purchase may beat investing the same cash in the market. It compares estimated home equity after selling against a market investment alternative.",
      "The model includes home price, sale price, down payment, mortgage rate, years held, loan term, monthly rent alternative, market return, rent inflation, property taxes, insurance, maintenance, improvements, closing costs, and selling costs.",
    ],
    sections: [
      { title: "How to interpret the result", body: "A house advantage means estimated sale proceeds and buyer surplus are ahead. A market advantage means the alternative investment path is estimated to be worth more over the same holding period." },
      { title: "What to verify", body: "Check actual loan amortization, sale proceeds, broker fees, repairs, taxes, insurance, improvements, and the realistic rental alternative for the years being compared." },
    ],
  },
  "auto-cost": {
    title: "About this new vs. used car cost calculator",
    body: [
      "This auto cost calculator compares buying a used car, buying a new car, and leasing over a selected ownership period. It estimates net cost after payments, ownership expenses, depreciation, resale value, and invested savings.",
      "The model includes vehicle price, down payment, trade-in value, loan rate, loan term, depreciation, insurance, maintenance, registration, fuel or charging, lease payments, residual value, disposition fee, and market return assumptions.",
    ],
    sections: [
      { title: "How to interpret the result", body: "The winning option has the best estimated outcome after subtracting net vehicle cost and adding the value of any saved cash invested over the comparison period." },
      { title: "What to verify", body: "Confirm real loan or lease quotes, insurance premiums, maintenance expectations, taxes, registration, mileage limits, residual values, and resale assumptions for the specific vehicle." },
    ],
  },
  "college-savings": {
    title: "About this college savings calculator",
    body: [
      "This college savings calculator projects separate education accounts for one or more children. It models starting balances, monthly contributions, market return assumptions, education inflation, and four July withdrawals for tuition plus board.",
      "The model keeps each child's account separate while also showing a combined household view, including total contributions, estimated investment growth, cumulative withdrawals, ending balance, and uncovered shortfall if costs exceed available savings.",
    ],
    sections: [
      { title: "How to interpret the result", body: "A remaining balance means the modeled accounts covered the scheduled college withdrawals with money left over. A shortfall means at least one July bill exceeded that child's projected account value." },
      { title: "What to verify", body: "Confirm school-specific tuition, room and board, fees, financial aid, tax treatment, contribution limits, and the account type before relying on the estimate." },
    ],
  },
};

function SeoPageCopy({ pageId }) {
  const copy = pageCopy[pageId] || pageCopy.landing;
  return (
    <section className="mt-36 border-t border-neutral-200 pt-4" aria-labelledby="calculator-page-copy-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div>
          <h2 id="calculator-page-copy-title" className="text-base font-semibold tracking-tight text-neutral-950">{copy.title}</h2>
          <div className="mt-3 space-y-3 text-xs leading-5 text-neutral-600">
            {copy.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-xs font-semibold tracking-tight text-neutral-950">{section.title}</h3>
              <p className="mt-2 text-xs leading-5 text-neutral-600">{section.body}</p>
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
        <span className="font-semibold text-neutral-700">Disclaimer:</span> These calculators are for educational and planning purposes only. Results are estimates based on the assumptions you enter and may not reflect actual costs, taxes, financing terms, investment returns, property values, insurance, maintenance, transaction costs, or market conditions. This site does not provide financial, investment, tax, legal, real estate, lending, or insurance advice. Before making a purchase, sale, lease, investment, or financing decision, consult qualified professionals and verify all numbers independently.
      </p>
    </footer>
  );
}

export default function CombinedRealEstateCalculatorsPreview({ initialCalculator = "landing" }) {
  const [activeCalculator, setActiveCalculator] = useState(initialCalculator);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selected = calculators.find((calculator) => calculator.id === activeCalculator) || null;
  const ActiveComponent = selected?.component;
  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl flex-col">
        <header className="mb-14 flex flex-col gap-5 border-b border-neutral-200 pb-6 lg:flex-row lg:items-start lg:justify-between"><div><a href="/" className="block text-left"><h1 className="text-[2.025rem] font-semibold leading-none tracking-tight text-neutral-950 sm:text-[2.25rem]">Financial Calculators</h1></a></div><nav className="hidden self-start lg:flex" aria-label="Calculator selector">{calculators.map((calculator) => { const Icon = calculator.icon; const active = calculator.id === activeCalculator; return <a key={calculator.id} href={calculatorRouteMap[calculator.id]} className={active ? "flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition" : "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"}><Icon className="h-4 w-4" />{calculator.shortName}</a>; })}</nav><div className="relative lg:hidden"><button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm"><span><span className="block text-sm font-semibold">{selected?.name || "Financial Calculators"}</span><span className="mt-1 block text-xs text-neutral-500">Tap to switch calculators</span></span><ChevronDownIcon className="h-5 w-5 text-neutral-500" /></button>{mobileOpen && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">{calculators.map((calculator) => { const Icon = calculator.icon; return <button key={calculator.id} type="button" onClick={() => { setActiveCalculator(calculator.id); setMobileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-neutral-50"><Icon className="h-4 w-4 text-neutral-500" /><span><span className="block font-semibold text-neutral-950">{calculator.name}</span><span className="block text-xs text-neutral-500">{calculator.description}</span></span></button>; })}</div>}</div></header>
        <div className="pb-10">
          {ActiveComponent ? <ActiveComponent /> : <LandingPage onSelectCalculator={setActiveCalculator} />}
          <SeoPageCopy pageId={activeCalculator} />
        </div>
        <Disclaimer />
      </div>
    </main>
  );
}
