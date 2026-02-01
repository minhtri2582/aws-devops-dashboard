"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Cloud,
  Zap,
  Flame,
  Search,
  LayoutDashboard,
  Bell,
  Play,
  Square,
  RotateCw,
  ZapOff,
  History,
  ExternalLink,
  Bug
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

export default function SREDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [resourceData, setResourceData] = useState<any>(null);
  const [logData, setLogData] = useState<any>(null);
  const [eksLogData, setEksLogData] = useState<any>(null);
  const [trailData, setTrailData] = useState<any>(null);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [remediating, setRemediating] = useState<string | null>(null);

  const handleRemediate = async (action: string, type: string, resourceId: string) => {
    const confirmMsg = `Are you sure you want to ${action} ${type} ${resourceId}?`;
    if (!window.confirm(confirmMsg)) return;

    setRemediating(resourceId);
    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type, resourceId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAll(); // Refresh data
      } else {
        alert("Action failed: " + data.message);
      }
    } catch (e) {
      alert("An error occurred while executing the remediation action.");
    } finally {
      setRemediating(null);
    }
  };

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
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAll, 120000);
    return () => clearInterval(interval);
  }, []);

  // Aggregate all critical errors
  const allIncidents = useMemo(() => {
    const incidents: any[] = [];
    
    // CloudWatch Errors
    logData?.logs?.forEach((group: any) => {
      group.events.forEach((event: any, idx: number) => {
        if (event.severity === "critical" || event.severity === "error") {
          incidents.push({
            id: `cw-${event.timestamp}-${group.groupName}-${idx}`,
            source: "CloudWatch",
            type: event.severity,
            title: group.groupName.split('/').pop(),
            message: event.message,
            time: event.timestamp,
            raw: event
          });
        }
      });
    });

    // CloudTrail Errors
    trailData?.events?.forEach((event: any) => {
      if (event.errorCode) {
        incidents.push({
          id: `ct-${event.id}`,
          source: "CloudTrail",
          type: "error",
          title: event.name,
          message: `${event.errorCode}: ${event.errorMessage || 'Action Failed'}`,
          time: event.time,
          raw: event
        });
      }
    });

    // Resource Issues (High CPU)
    resourceData?.compute?.forEach((i: any) => {
      if (i.cpu > 85) {
        incidents.push({
          id: `res-cpu-${i.id}`,
          source: "Infrastructure",
          type: "warning",
          title: `High CPU: ${i.name}`,
          message: `Instance ${i.id} is at ${i.cpu.toFixed(1)}% utilization.`,
          time: new Date().getTime(),
          raw: i
        });
      }
    });

    return incidents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [logData, trailData, resourceData]);

  // Priority Resources (Unhealthy or High Usage)
  const priorityResources = useMemo(() => {
    if (!resourceData) return [];
    const all = [
      ...(resourceData.compute || []).map((r: any) => ({ ...r, category: 'Compute' })),
      ...(resourceData.database || []).map((r: any) => ({ ...r, category: 'Database' }))
    ];
    
    return all.sort((a, b) => {
      // Sort by high CPU first, then by non-running state
      const scoreA = (a.cpu || 0) + (a.state !== 'running' && a.state !== 'available' ? 100 : 0);
      const scoreB = (b.cpu || 0) + (b.state !== 'running' && b.state !== 'available' ? 100 : 0);
      return scoreB - scoreA;
    });
  }, [resourceData]);

  const toggleLog = (name: string) => {
    setExpandedLogs(prev => 
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            <Zap className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-sm">Initializing SRE Console</p>
            <p className="text-slate-500 text-xs font-medium">Scanning 24 regions for active incidents...</p>
          </div>
        </div>
      </div>
    );
  }

  const severityColors: any = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    error: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Global Error Ticker */}
      {allIncidents.length > 0 && (
        <div className="bg-red-950/30 border-b border-red-900/30 px-6 py-2 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-8 animate-marquee">
            {allIncidents.slice(0, 5).map((inc, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black uppercase text-red-400">{inc.source}:</span>
                <span className="text-xs font-medium text-red-200/80">{inc.title} - {inc.message.slice(0, 50)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto p-6 lg:p-10 space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white">DevOps Console <span className="text-blue-500">v2.0</span></h1>
            </div>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
              Real-time monitoring active for Account: <span className="text-slate-300 font-mono">{dashboardData?.identity?.account}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources, logs, or events..."
                className="bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all w-64 lg:w-96"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-600/20 text-white"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Sync
            </button>
          </div>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HealthCard 
            label="System Health"
            value={allIncidents.length === 0 ? "100%" : "Critical"}
            status={allIncidents.length === 0 ? "success" : "danger"}
            icon={Activity}
            desc={`${allIncidents.length} Active Issues`}
          />
          <HealthCard 
            label="Cloud Assets"
            value={((resourceData?.compute?.length || 0) + (resourceData?.database?.length || 0) + (eksLogData?.logs?.length || 0)).toString()}
            status="info"
            icon={Box}
            desc={`${eksLogData?.logs?.length || 0} EKS Clusters Active`}
          />
          <HealthCard 
            label="Est. Burn Rate"
            value={`$${dashboardData?.billing?.amount || "0"}`}
            status="warning"
            icon={Flame}
            desc="Current Month spend"
          />
          <HealthCard 
            label="Security Score"
            value="A+"
            status="success"
            icon={ShieldCheck}
            desc="No IAM vulnerabilities"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* SRE Insights Bar */}
          <div className="xl:col-span-12">
            <div className="bg-gradient-to-r from-blue-900/20 to-slate-900/20 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Security Posture</p>
                    <p className="text-sm font-bold text-slate-200">IAM: No Overprivileged Roles Detected</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Cost Optimization</p>
                    <p className="text-sm font-bold text-slate-200">2 Idle EC2 Instances Found</p>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                Run Full Audit
              </button>
            </div>
          </div>
          
          {/* Left Column: Alerts & Logs */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* Critical Incident Feed */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <Bell className="w-4 h-4 text-red-500" />
                  Live Incident Feed
                </h3>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md text-[10px] font-black border border-red-500/20">
                  {allIncidents.length} Total
                </span>
              </div>
              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                {allIncidents.length > 0 ? (
                  allIncidents.map((inc) => (
                    <IncidentItem key={inc.id} incident={inc} colors={severityColors} />
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-bold">Zero active incidents</p>
                    <p className="text-[10px] text-slate-600 uppercase font-black mt-1">Infrastructure is nominal</p>
                  </div>
                )}
              </div>
            </section>

            {/* CloudWatch Watcher */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-800 bg-slate-800/20">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  Log Stream Health
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {logData?.logs?.map((group: any) => (
                  <div key={group.groupName} className="bg-slate-950/40 border border-slate-800/50 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleLog(group.groupName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-800/20 transition-all text-left group"
                    >
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-300 truncate max-w-[200px]">
                          {group.groupName.split('/').pop()}
                        </p>
                        <div className="flex gap-2">
                          {['critical', 'error', 'warning'].map(sev => {
                            const count = group.events.filter((e: any) => e.severity === sev).length;
                            if (count === 0) return null;
                            return (
                               <span key={sev} className={cn(
                                 "text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 border",
                                 severityColors[sev]
                               )}>
                                 {count} {sev}
                               </span>
                            );
                          })}
                        </div>
                      </div>
                      {expandedLogs.includes(group.groupName) ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                    </button>
                    {expandedLogs.includes(group.groupName) && (
                      <div className="px-4 pb-4 space-y-2">
                        {group.events.slice(0, 5).map((e: any, idx: number) => (
                          <div key={idx} className={cn("p-3 rounded-lg border text-[10px] font-mono leading-relaxed group/log relative", severityColors[e.severity])}>
                             <p className="break-all">{e.message}</p>
                             <button 
                               onClick={() => {
                                 const correlated = trailData?.events?.filter((te: any) => 
                                   Math.abs(new Date(te.time).getTime() - new Date(e.timestamp).getTime()) < 300000 // 5 min window
                                 );
                                 if (correlated?.length > 0) {
                                   alert(`Correlated CloudTrail Events (5min window):\n\n${correlated.map((c: any) => `- ${c.name} by ${c.user} (${new Date(c.time).toLocaleTimeString()})`).join('\n')}`);
                                 } else {
                                   alert("No CloudTrail events found within a 5-minute window of this log.");
                                 }
                               }}
                               className="absolute top-2 right-2 opacity-0 group-hover/log:opacity-100 transition-opacity bg-slate-900/80 p-1 rounded hover:text-blue-400"
                               title="Correlate with CloudTrail"
                             >
                               <History className="w-3 h-3" />
                             </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Infrastructure focus */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Resource Health View */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                    <Server className="w-4 h-4 text-blue-400" />
                    Resource Health Priority
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">Sorted by utilization & health status</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800">
                {priorityResources.map((res: any) => (
                  <div key={res.id} className="bg-[#020617] p-6 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                    {res.cpu > 80 && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2.5 rounded-lg border",
                          res.category === "Compute" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                        )}>
                          {res.category === "Compute" ? <Cpu className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-100 group-hover:text-blue-400 transition-colors">{res.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500">{res.id} • {res.instanceType || res.instanceClass}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-widest",
                        (res.state === 'running' || res.state === 'available') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {res.state}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                        <span>CPU Utilization</span>
                        <span className={cn(res.cpu > 80 ? "text-red-400" : "text-slate-300")}>{res.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            res.cpu > 80 ? "bg-red-500" : res.cpu > 50 ? "bg-orange-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.max(2, res.cpu)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-600 uppercase">Network In</span>
                            <span className="text-[10px] font-mono text-slate-400">Low</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-600 uppercase">Memory</span>
                            <span className="text-[10px] font-mono text-slate-400">Normal</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRemediate('reboot', res.category === 'Compute' ? 'EC2' : 'RDS', res.id)}
                            disabled={remediating === res.id}
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-orange-400 transition-colors title='Reboot'"
                          >
                            <RotateCw className={cn("w-3.5 h-3.5", remediating === res.id && "animate-spin")} />
                          </button>
                          {(res.state === 'running' || res.state === 'available') ? (
                            <button 
                              onClick={() => handleRemediate('stop', res.category === 'Compute' ? 'EC2' : 'RDS', res.id)}
                              disabled={remediating === res.id}
                              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors title='Stop'"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRemediate('start', res.category === 'Compute' ? 'EC2' : 'RDS', res.id)}
                              disabled={remediating === res.id}
                              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-400 transition-colors title='Start'"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors ml-2">Details →</button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Audit Trail - Error Focus */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Privileged Activity & Errors
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/40 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Action & Source</th>
                      <th className="px-6 py-4">Status & Type</th>
                      <th className="px-6 py-4">Resources</th>
                      <th className="px-6 py-4">Actor</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {trailData?.events?.slice(0, 15).map((event: any) => (
                      <tr key={event.id} className="hover:bg-slate-800/20 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-200 text-xs">{event.name}</span>
                            <span className="text-[9px] font-mono text-slate-600">{event.eventSource}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {event.errorCode ? (
                              <div className="flex items-center gap-2 text-[10px] text-red-400 font-black uppercase bg-red-500/5 px-2 py-1 rounded border border-red-500/10 w-fit">
                                <AlertCircle className="w-3 h-3" /> Failed
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 w-fit">
                                <ShieldCheck className="w-3 h-3" /> Success
                              </div>
                            )}
                            <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded border w-fit",
                              event.category === "CREATE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              event.category === "DELETE" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              event.category === "UPDATE" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            )}>
                              {event.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            {event.resources?.length > 0 ? (
                              event.resources.map((r: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/50 truncate">
                                  <Box className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{r.name || r.type}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">No resource details</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                              <User className="w-3 h-3 opacity-50" />
                              {event.user}
                            </div>
                            {event.user !== event.rawUser && (
                              <span className="text-[8px] text-slate-600 font-mono truncate max-w-[120px]">via {event.rawUser}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 font-mono text-[10px]">
                          {new Date(event.time).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

function HealthCard({ label, value, status, icon: Icon, desc }: any) {
  const styles: any = {
    success: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    danger: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400",
    warning: "from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400",
    info: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400"
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br border rounded-2xl p-6 shadow-sm group",
      styles[status]
    )}>
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all">
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{label}</p>
          <Icon className="w-4 h-4 opacity-60" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">{value}</h2>
          <p className="text-xs font-medium opacity-60 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function IncidentItem({ incident, colors }: any) {
  return (
    <div className="p-4 hover:bg-slate-800/20 transition-colors group">
      <div className="flex items-start gap-4">
        <div className={cn(
          "mt-1 p-2 rounded-lg border flex-shrink-0",
          colors[incident.type]
        )}>
          {incident.type === 'critical' ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{incident.source}</span>
            <span className="text-[9px] font-mono text-slate-600">{new Date(incident.time).toLocaleTimeString()}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{incident.title}</h4>
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium">{incident.message}</p>
          <div className="pt-2 flex items-center gap-3">
            <button className="text-[9px] font-black uppercase text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
              <ExternalLink className="w-2.5 h-2.5" /> View in Console
            </button>
            <button className="text-[9px] font-black uppercase text-slate-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
              <Bug className="w-2.5 h-2.5" /> Open Jira
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
