"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}

export default function ROICalculator() {
  const [teamSize, setTeamSize] = useState(5);
  const [activeProjects, setActiveProjects] = useState(3);
  const [avgProjectValue, setAvgProjectValue] = useState(8);

  // Calculations
  const hoursPerMonth = teamSize * 12 + activeProjects * 8;
  const annualSavings = hoursPerMonth * 12 * 85;
  const procoreCost = activeProjects * teamSize * 420;
  const siteCommandPro = 199 * 12;
  const vsProcore = procoreCost - siteCommandPro;

  const animHours = useAnimatedValue(hoursPerMonth);
  const animSavings = useAnimatedValue(annualSavings);
  const animProcore = useAnimatedValue(procoreCost);
  const animVsProcore = useAnimatedValue(vsProcore);

  return (
    <section className="bg-gray-50 rounded-2xl border border-gray-100 p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-2">
            ROI Calculator
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            What could SiteCommand save your team?
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Adjust the sliders to match your operation and see your estimated impact.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Project Managers
              </label>
              <span className="text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-0.5 min-w-[2.5rem] text-center">
                {teamSize}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Active Projects
              </label>
              <span className="text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-0.5 min-w-[2.5rem] text-center">
                {activeProjects}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={activeProjects}
              onChange={(e) => setActiveProjects(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Avg Project Value
              </label>
              <span className="text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-0.5 min-w-[3rem] text-center">
                ${avgProjectValue}M
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={avgProjectValue}
              onChange={(e) => setAvgProjectValue(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$1M</span>
              <span>$100M</span>
            </div>
          </div>
        </div>

        {/* Output cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Hours saved / month</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {animHours.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">vs. manual coordination</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">RFI cycle time reduction</p>
            <p className="text-3xl font-bold text-gray-900">65%</p>
            <p className="text-xs text-gray-400 mt-1">based on customer data</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Est. annual savings</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(animSavings)}
            </p>
            <p className="text-xs text-gray-400 mt-1">at $85/hr blended rate</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 border-l-2 border-l-orange-400">
            <p className="text-xs font-medium text-gray-500 mb-1">vs. Procore cost savings</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(animVsProcore > 0 ? animVsProcore : 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Procore est. {formatCurrency(animProcore)}/yr vs. SC Pro ${(siteCommandPro / 1000).toFixed(1)}K/yr
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 max-w-sm">
            Estimates based on industry averages and SiteCommand customer data. Actual results vary by team and project type.
          </p>
          <Link
            href="/signup"
            className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            Get your personalized ROI report →
          </Link>
        </div>
      </div>
    </section>
  );
}
