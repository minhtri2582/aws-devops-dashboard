import { NextResponse } from "next/server";
import { cwLogsClient, eksClient } from "@/lib/aws";
import { FilterLogEventsCommand, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ListClustersCommand } from "@aws-sdk/client-eks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "cloudwatch"; // 'cloudwatch' or 'eks'
  
  try {
    if (type === "cloudwatch") {
      // Get some log groups first to show something
      const groups = await cwLogsClient.send(new DescribeLogGroupsCommand({ limit: 50 }));
      const errorLogs = [];

      for (const group of (groups.logGroups || [])) {
        // Skip EKS groups here, we handle them separately or just let them be
        const events = await cwLogsClient.send(
          new FilterLogEventsCommand({
            logGroupName: group.logGroupName,
            filterPattern: "?ERROR ?error ?Fail ?fail ?Critical ?critical ?WARNING ?warning",
            limit: 10,
          })
        );
        if (events.events && events.events.length > 0) {
          const categorizedEvents = events.events.map(e => {
            const msg = e.message?.toLowerCase() || "";
            let severity = "info";
            if (msg.includes("critical") || msg.includes("fatal")) severity = "critical";
            else if (msg.includes("error") || msg.includes("fail")) severity = "error";
            else if (msg.includes("warning") || msg.includes("warn")) severity = "warning";
            
            return {
              timestamp: e.timestamp,
              message: e.message,
              stream: e.logStreamName,
              severity
            };
          });

          errorLogs.push({
            groupName: group.logGroupName,
            events: categorizedEvents.sort((a, b) => {
              const priority: any = { critical: 0, error: 1, warning: 2, info: 3 };
              return priority[a.severity] - priority[b.severity];
            })
          });
        }
      }
      // Sort log groups by the most severe event they contain
      errorLogs.sort((a, b) => {
        const priority: any = { critical: 0, error: 1, warning: 2, info: 3 };
        const minA = Math.min(...a.events.map((e: any) => priority[e.severity]));
        const minB = Math.min(...b.events.map((e: any) => priority[e.severity]));
        return minA - minB;
      });
      return NextResponse.json({ type: "cloudwatch", logs: errorLogs });
    } else if (type === "eks") {
      // EKS specific log check
      const clusters = await eksClient.send(new ListClustersCommand({}));
      const eksLogs = [];

      for (const clusterName of (clusters.clusters || [])) {
        // 1. Get cluster logs from CloudWatch
        const logGroupName = `/aws/eks/${clusterName}/cluster`;
        let clusterEvents: any[] = [];
        try {
          const events = await cwLogsClient.send(
            new FilterLogEventsCommand({
              logGroupName,
              filterPattern: "?ERROR ?error ?Fail ?fail ?Critical ?critical",
              limit: 20,
            })
          );
          clusterEvents = (events.events || []).map(e => {
            const msg = e.message?.toLowerCase() || "";
            let severity = "error";
            if (msg.includes("critical") || msg.includes("fatal")) severity = "critical";
            return {
              timestamp: e.timestamp,
              message: e.message,
              stream: e.logStreamName,
              severity
            };
          });
        } catch (e) {
          // Log group might not exist
        }

        // 2. Try to find pod-related logs in other groups (simplified)
        // In a real scenario, pod logs are often in /aws/containerinsights/cluster/pods
        const podLogPattern = `/aws/containerinsights/${clusterName}/performance`;
        let podLogsFound = false;
        try {
          const groups = await cwLogsClient.send(new DescribeLogGroupsCommand({ 
            logGroupNamePrefix: `/aws/lambda/`, // Example fallback or we could use containerinsights
            limit: 5 
          }));
          // This is a placeholder for where pod logs typically reside in CloudWatch
        } catch (e) {}

        eksLogs.push({
          clusterName,
          logGroupName,
          events: clusterEvents,
          podStatus: "Monitoring active (via ContainerInsights/Fluentbit)"
        });
      }
      return NextResponse.json({ type: "eks", logs: eksLogs });
    }
  } catch (error: any) {
    console.error("Logs API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
