"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, 
  CreditCard, 
  Shield, 
  Cpu, 
  Database, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Server,
  Terminal,
  ShieldCheck,
  User,
  Box,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Circle,
  Cloud
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { cn } from "@/lib/utils";

export default function UnifiedDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [resourceData, setResourceData] = useState<any>(null);
  const [logData, setLogData] = useState<any>(null);
  const [eksLogData, setEksLogData] = useState<any>(null);
  const [trailData, setTrailData] = useState<any>(null);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [db, res, logs, eks, trail] = await Promise.all([
        fetch("/api/dashboard").then(r => r.json()),
        fetch("/api/resources").then(r => r.json()),
        fetch("/api/logs?type=cloudwatch").then(r => r.json()),
        fetch("/api/logs?type=eks").then(r => r.json()),
        fetch("/api/cloudtrail").then(r => r.json()),
      ]);
      setDashboardData(db);
      setResourceData(res);
      setLogData(logs);
      setEksLogData(eks);
      setTrailData(trail);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleLog = (name: string) => {
    setExpandedLogs(prev => 
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Synchronizing with AWS...</p>
        </div>
      </div>
    );
  }

  const colors: any = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    error: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  };

  const icons: any = {
    critical: <AlertCircle className="w-4 h-4" />,
    error: <AlertTriangle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Activity className="w-4 h-4" />
  };

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/40 p-8 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
            <Cloud className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">AWS Central Dashboard</h1>
            <p className="text-slate-400 font-medium">Global infrastructure monitoring and incident management.</p>
          </div>
        </div>
        <button 
          onClick={fetchAll}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-base font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/20 text-white"
        >
          <RefreshCw className={loading ? "animate-spin w-6 h-6" : "w-6 h-6"} />
          Sync Infrastructure
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Security & Identity" 
          value="Protected" 
          subtitle={dashboardData?.identity?.account || "IAM Active"}
          icon={Shield}
          color="text-emerald-400"
          bg="bg-emerald-400/10"
        />
        <StatCard 
          title="Financial Ops" 
          value={`${dashboardData?.billing?.amount || "0.00"} ${dashboardData?.billing?.currency || "USD"}`}
          subtitle="Estimated Monthly Spend"
          icon={CreditCard}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard 
          title="Compute Footprint" 
          value={resourceData?.compute?.length || "0"} 
          subtitle="Running EC2 Instances"
          icon={Cpu}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <StatCard 
          title="Database Fleet" 
          value={resourceData?.database?.length || "0"} 
          subtitle="Active RDS Clusters"
          icon={Database}
          color="text-orange-400"
          bg="bg-orange-400/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Resources Section - Takes more space now */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* Resource List */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <Server className="w-8 h-8 text-blue-400" />
                Live Infrastructure
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20 uppercase tracking-tighter">Compute</span>
                <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-bold border border-orange-500/20 uppercase tracking-tighter">Databases</span>
              </div>
            </div>
            <div className="p-0 divide-y divide-slate-800">
              {resourceData?.compute?.map((i: any) => (
                <ResourceItem key={i.id} item={i} type="EC2" />
              ))}
              {resourceData?.database?.map((i: any) => (
                <ResourceItem key={i.id} item={i} type="RDS" />
              ))}
              {(!resourceData?.compute?.length && !resourceData?.database?.length) && (
                <div className="p-20 text-center">
                   <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Activity className="w-10 h-10 text-slate-600" />
                   </div>
                   <p className="text-slate-500 font-bold text-lg">No active resources detected.</p>
                </div>
              )}
            </div>
          </section>

          {/* CloudTrail Section */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-slate-800/20">
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                Audit Trail (Read/Write Events)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/40 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Activity</th>
                    <th className="px-8 py-5">Actor</th>
                    <th className="px-8 py-5">Resource Identifier</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {trailData?.events?.slice(0, 10).map((event: any) => (
                    <tr key={event.id} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-8 py-6">
                        <span className="font-bold text-slate-200 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all">{event.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                          <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-700">
                            {event.user?.[0]?.toUpperCase() || 'U'}
                          </div>
                          {event.user}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
                          <Box className="w-3 h-3" /> {event.resourceName || "Multiple"}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right text-slate-500 font-mono text-xs">
                        {new Date(event.time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Style Section - Now aligned with the 12-column grid */}
        <div className="xl:col-span-4 space-y-10">
          {/* EKS Health & Logs */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-black flex items-center gap-3 mb-8 text-white">
              <Activity className="w-6 h-6 text-blue-500" />
              EKS Cluster Status & Pod Health
            </h3>
            <div className="space-y-6">
              {eksLogData?.logs?.map((cluster: any) => (
                <div key={cluster.clusterName} className="p-0 bg-slate-800/20 rounded-2xl border border-slate-700/30 overflow-hidden transition-all">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/10">
                    <div className="flex flex-col">
                      <span className="font-black text-base text-slate-200 uppercase tracking-tight">{cluster.clusterName}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">{cluster.podStatus}</span>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                      cluster.error ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {cluster.error ? "Logging Disabled" : "Connected"}
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> Cluster System Events
                    </h4>
                    {cluster.events?.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {cluster.events.map((e: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-950/50 rounded-lg border border-red-500/10 text-[11px] font-mono leading-relaxed">
                            <div className="flex justify-between mb-1 opacity-50 text-[9px]">
                              <span>{new Date(e.timestamp).toLocaleString()}</span>
                              <span className="text-red-400 font-bold uppercase">{e.severity}</span>
                            </div>
                            <p className="text-slate-300 break-all">{e.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <ShieldCheck className="w-4 h-4" />
                        No critical cluster events detected
                      </div>
                    )}

                    {/* Placeholder for Pod Logs */}
                    <button className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-400 border border-slate-700/50 transition-all flex items-center justify-center gap-2 mt-4">
                      <Box className="w-4 h-4" /> Scan Container Logs (Pod Events)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CloudWatch Log Watcher */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-black flex items-center gap-3 mb-8 text-white">
              <Terminal className="w-6 h-6 text-orange-500" />
              CloudWatch Error Feed
            </h3>
            <div className="space-y-4">
              {logData?.logs?.length > 0 ? (
                logData.logs.map((group: any) => (
                  <div key={group.groupName} className="border border-slate-800 rounded-2xl overflow-hidden transition-all bg-slate-950/20">
                    <button 
                      onClick={() => toggleLog(group.groupName)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 transition-all text-left group"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-slate-200 uppercase tracking-tight truncate max-w-[200px] group-hover:text-blue-400 transition-colors">
                          {group.groupName.split('/').pop()}
                        </span>
                        <div className="flex gap-2">
                           {['critical', 'error', 'warning'].map(sev => {
                             const count = group.events.filter((e: any) => e.severity === sev).length;
                             if (count === 0) return null;
                             return (
                               <span key={sev} className={cn(
                                 "text-[9px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1",
                                 colors[sev]
                               )}>
                                 {icons[sev]} {count}
                               </span>
                             );
                           })}
                        </div>
                      </div>
                      {expandedLogs.includes(group.groupName) ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
                    </button>
                    {expandedLogs.includes(group.groupName) && (
                      <div className="p-5 bg-slate-950/80 border-t border-slate-800 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {group.events.map((e: any, idx: number) => (
                          <div key={idx} className={cn(
                            "p-4 rounded-xl border space-y-2 shadow-inner",
                            colors[e.severity]
                          )}>
                            <div className="flex justify-between items-center border-b border-current/10 pb-2 mb-2">
                               <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                 {icons[e.severity]} {e.severity}
                               </span>
                               <span className="text-[9px] font-mono opacity-60">
                                 {new Date(e.timestamp).toLocaleTimeString()}
                               </span>
                            </div>
                            <p className="text-[11px] font-mono leading-relaxed break-all bg-black/10 p-2 rounded border border-current/5">
                              {e.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                  <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-fit mx-auto mb-4 border border-emerald-500/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-bold">Infrastructure is clean.</p>
                  <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-1">No critical hits detected</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
          <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{value}</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {subtitle}
          </p>
        </div>
        <div className={`p-4 rounded-2xl ${bg} transition-transform group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function ResourceItem({ item, type }: any) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl",
          type === "EC2" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
        )}>
          {type === "EC2" ? <Cpu className="w-5 h-5" /> : <Database className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-slate-200">{item.name}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{item.id}</span>
            <span>•</span>
            <span>{type === "EC2" ? item.instanceType : item.instanceClass}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Utilization</p>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  item.cpu > 80 ? "bg-red-500" : item.cpu > 50 ? "bg-orange-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, item.cpu)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-300">{item.cpu.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-300">
          <Circle className={cn(
            "w-2 h-2 fill-current",
            (item.state === 'running' || item.state === 'available') ? "text-emerald-500" : "text-slate-500"
          )} />
          <span className="uppercase">{item.state}</span>
        </div>
      </div>
    </div>
  );
}
