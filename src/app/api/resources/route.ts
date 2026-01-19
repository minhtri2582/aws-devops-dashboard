import { NextResponse } from "next/server";
import { ec2Client, rdsClient, cwClient } from "@/lib/aws";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";

async function getCpuMetric(instanceId: string, namespace: string, dimensionName: string) {
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // Last hour

  try {
    const result = await cwClient.send(
      new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: "CPUUtilization",
        Dimensions: [{ Name: dimensionName, Value: instanceId }],
        StartTime: start,
        EndTime: end,
        Period: 300,
        Statistics: ["Average"],
      })
    );
    return result.Datapoints?.sort((a, b) => (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0))[0]?.Average || 0;
  } catch (e) {
    return 0;
  }
}

export async function GET() {
  try {
    // EC2 Instances
    const ec2Data = await ec2Client.send(new DescribeInstancesCommand({}));
    const ec2Instances = await Promise.all(
      (ec2Data.Reservations?.flatMap((r) => r.Instances || []) || []).map(async (i) => ({
        id: i.InstanceId,
        type: "EC2",
        name: i.Tags?.find((t) => t.Key === "Name")?.Value || i.InstanceId,
        instanceType: i.InstanceType,
        state: i.State?.Name,
        publicIp: i.PublicIpAddress,
        privateIp: i.PrivateIpAddress,
        cpu: await getCpuMetric(i.InstanceId!, "AWS/EC2", "InstanceId"),
      }))
    );

    // RDS Instances
    const rdsData = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const rdsInstances = await Promise.all(
      (rdsData.DBInstances || []).map(async (i) => ({
        id: i.DBInstanceIdentifier,
        type: "RDS",
        name: i.DBInstanceIdentifier,
        instanceClass: i.DBInstanceClass,
        engine: i.Engine,
        state: i.DBInstanceStatus,
        endpoint: i.Endpoint?.Address,
        cpu: await getCpuMetric(i.DBInstanceIdentifier!, "AWS/RDS", "DBInstanceIdentifier"),
      }))
    );

    return NextResponse.json({
      compute: ec2Instances,
      database: rdsInstances,
    });
  } catch (error: any) {
    console.error("Resources API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
