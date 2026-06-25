"use client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  Legend,
} from "recharts";
import type {
  RiskDistributionDatum, MonthlySpendDatum, CategorySpendDatum,
  DeptScatterDatum, ScoredExpense,
} from "@/types";
import { usd, usdf, riskColor } from "@/lib/utils";

const GRID   = "#0E1E33";
const DIMTXT = "#6A8BAD";
const NAVY   = "#030B18";
const COBALT = "#1659F5";

const TIP: React.CSSProperties = {
  backgroundColor: "#080F1E",
  border: "1px solid #0E1E33",
  borderRadius: "8px",
  color: "#E6EFF8",
  fontSize: "12px",
  fontFamily: "Inter, sans-serif",
};

const tick = { fill: DIMTXT, fontSize: 11, fontFamily: "Inter, sans-serif" } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmt = (fn: (v: number) => string) => (v: any) => fn(Number(v));

export function RiskDistributionChart({ data }: { data: RiskDistributionDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
               dataKey="value" paddingAngle={3}>
            {data.map((e, i) => <Cell key={i} fill={e.color} stroke={NAVY} strokeWidth={2}/>)}
          </Pie>
          <Tooltip contentStyle={TIP}
            formatter={(v, name) => [`${v} reports (${total ? ((Number(v)/total)*100).toFixed(0) : 0}%)`, name]}/>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", paddingBottom:30 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#E6EFF8" }}>{total}</div>
          <div style={{ fontSize:10, color:DIMTXT, marginTop:2 }}>Total</div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:8 }}>
        {data.map(d => (
          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:d.color }}/>
            <span style={{ fontSize:11, color:DIMTXT }}>{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopRiskEmployeesChart({ expenses }: { expenses: ScoredExpense[] }) {
  const byEmp = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.employeeId]) acc[e.employeeId] = { name: e.employeeName, total: 0, count: 0 };
      acc[e.employeeId].total += e.risk_score;
      acc[e.employeeId].count++;
      return acc;
    }, {} as Record<string, { name: string; total: number; count: number }>)
  )
    .map(d => ({ name: d.name, avg: Math.round(d.total / d.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8);

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={byEmp} layout="vertical" margin={{ top:4, right:44, bottom:4, left:8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false}/>
          <XAxis type="number" domain={[0,100]} tick={tick} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="name" width={100} tick={{ ...tick, fontSize:11 }} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={TIP} formatter={(v) => [`${v}`, "Avg Risk Score"]}/>
          <Bar dataKey="avg" radius={[0,3,3,0]}>
            {byEmp.map((e, i) => <Cell key={i} fill={riskColor(e.avg)}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentRiskChart({ expenses }: { expenses: ScoredExpense[] }) {
  const byDept: Record<string, { High:number; Medium:number; Low:number }> = {};
  expenses.forEach(e => {
    if (!byDept[e.department]) byDept[e.department] = { High:0, Medium:0, Low:0 };
    byDept[e.department][e.risk_level]++;
  });
  const data = Object.entries(byDept).map(([dept, v]) => ({ dept, ...v }));
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top:4, right:16, bottom:4, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false}/>
          <XAxis dataKey="dept" tick={tick} axisLine={false} tickLine={false}/>
          <YAxis tick={tick} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={TIP}/>
          <Legend wrapperStyle={{ fontSize:11, color:DIMTXT }}/>
          <Bar dataKey="High"   fill="#C93636" radius={[3,3,0,0]}/>
          <Bar dataKey="Medium" fill="#C97D10" radius={[3,3,0,0]}/>
          <Bar dataKey="Low"    fill="#0C8A5C" radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlySpendChart({ data }: { data: MonthlySpendDatum[] }) {
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top:4, right:16, bottom:4, left:16 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COBALT} stopOpacity={0.18}/>
              <stop offset="95%" stopColor={COBALT} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false}/>
          <XAxis dataKey="month" tick={{ ...tick, fontSize:10 }} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmt(usd)} tick={tick} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={TIP} formatter={fmt(usdf)}/>
          <Area type="monotone" dataKey="amount" stroke={COBALT} strokeWidth={2}
                fill="url(#spendGrad)" dot={{ fill:COBALT, r:3, strokeWidth:0 }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategorySpendChart({ data }: { data: CategorySpendDatum[] }) {
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top:4, right:16, bottom:28, left:16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false}/>
          <XAxis dataKey="category" tick={{ ...tick, fontSize:10 }} angle={-15} textAnchor="end" axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmt(usd)} tick={tick} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={TIP} formatter={fmt(usdf)}/>
          <Bar dataKey="amount" fill={COBALT} opacity={0.85} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeptScatterChart({ data }: { data: DeptScatterDatum[] }) {
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top:16, right:16, bottom:16, left:16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID}/>
          <XAxis dataKey="spend" name="Spend" tickFormatter={fmt(usd)} tick={tick} axisLine={false} tickLine={false}/>
          <YAxis dataKey="risk" name="Avg Risk" domain={[0,100]} tick={tick} axisLine={false} tickLine={false}/>
          <ZAxis dataKey="count" range={[60,280]}/>
          <Tooltip contentStyle={TIP} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as DeptScatterDatum;
            return (
              <div style={{ ...TIP, padding:"8px 12px" }}>
                <div style={{ fontWeight:700, color:"#E6EFF8" }}>{d.department}</div>
                <div style={{ color:DIMTXT }}>Spend: {usdf(d.spend)}</div>
                <div style={{ color:DIMTXT }}>Avg Risk: {d.risk.toFixed(1)}</div>
              </div>
            );
          }}/>
          <Scatter data={data}>
            {data.map((e, i) => <Cell key={i} fill={riskColor(e.risk)} fillOpacity={0.85}/>)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmployeeTimelineChart({ expenses }: { expenses: ScoredExpense[] }) {
  const data = [...expenses]
    .sort((a,b) => a.expenseDate.localeCompare(b.expenseDate))
    .map(e => ({ date: e.expenseDate.slice(5), amount: e.amount, risk: e.risk_score, color: riskColor(e.risk_score) }));
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top:8, right:16, bottom:8, left:16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID}/>
          <XAxis dataKey="date" tick={{ ...tick, fontSize:10 }} axisLine={false} tickLine={false}/>
          <YAxis dataKey="amount" tickFormatter={fmt(usd)} tick={tick} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={TIP} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { date:string; amount:number; risk:number; color:string };
            return (
              <div style={{ ...TIP, padding:"8px 12px" }}>
                <div style={{ fontWeight:700, color:"#E6EFF8" }}>{d.date}</div>
                <div style={{ color:DIMTXT }}>{usdf(d.amount)}</div>
                <div style={{ color:d.color }}>Risk: {d.risk}</div>
              </div>
            );
          }}/>
          <Scatter data={data}>
            {data.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85}/>)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
