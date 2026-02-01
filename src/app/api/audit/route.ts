import { NextResponse } from "next/server";
import { ec2Client, stsClient } from "@/lib/aws";
import { DescribeVolumesCommand, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export async function POST() {
  try {
    const auditResults: any = {
      timestamp: new Date().toISOString(),
      findings: [],
      summary: {
        critical: 0,
        warning: 0,
        info: 0
      }
    };

    // 1. Check Identity
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    auditResults.account = identity.Account;

    // 2. Audit EC2 Volumes (Zombie Resources)
    const volumes = await ec2Client.send(new DescribeVolumesCommand({}));
    const unattachedVolumes = volumes.Volumes?.filter(v => !v.Attachments || v.Attachments.length === 0) || [];
    
    if (unattachedVolumes.length > 0) {
      auditResults.findings.push({
        category: "Cost",
        severity: "warning",
        title: "Unattached EBS Volumes",
        message: `Found ${unattachedVolumes.length} EBS volumes not attached to any instance.`,
        resources: unattachedVolumes.map(v => v.VolumeId)
      });
      auditResults.summary.warning++;
    }

    // 3. Audit Old Snapshots
    const snapshots = await ec2Client.send(new DescribeSnapshotsCommand({ OwnerIds: ["self"] }));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldSnapshots = snapshots.Snapshots?.filter(s => s.StartTime && new Date(s.StartTime) < thirtyDaysAgo) || [];
    if (oldSnapshots.length > 5) {
      auditResults.findings.push({
        category: "Cost",
        severity: "info",
        title: "Stale Snapshots",
        message: `Found ${oldSnapshots.length} snapshots older than 30 days.`,
        resources: oldSnapshots.slice(0, 5).map(s => s.SnapshotId)
      });
      auditResults.summary.info++;
    }

    // 4. Placeholder for IAM / S3 Audits (requires more permissions)
    // In a real scenario, you'd add:
    // - IAM: ListUsers -> GetUserLoginProfile (check MFA)
    // - S3: ListBuckets -> GetBucketPublicAccessBlock

    return NextResponse.json(auditResults);
  } catch (error: any) {
    console.error("Audit API Error:", error);
    return NextResponse.json(
      { message: "Audit failed: " + error.message },
      { status: 500 }
    );
  }
}
