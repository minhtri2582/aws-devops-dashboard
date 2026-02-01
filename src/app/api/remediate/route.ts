import { NextResponse } from "next/server";
import { ec2Client, rdsClient } from "@/lib/aws";
import { 
  RebootInstancesCommand, 
  StartInstancesCommand, 
  StopInstancesCommand 
} from "@aws-sdk/client-ec2";
import { 
  RebootDBInstanceCommand, 
  StartDBInstanceCommand, 
  StopDBInstanceCommand 
} from "@aws-sdk/client-rds";

export async function POST(request: Request) {
  try {
    const { action, type, resourceId } = await request.json();

    if (!action || !type || !resourceId) {
      return NextResponse.json(
        { message: "Missing required parameters: action, type, resourceId" },
        { status: 400 }
      );
    }

    let result;

    if (type === "EC2") {
      switch (action) {
        case "reboot":
          result = await ec2Client.send(new RebootInstancesCommand({ InstanceIds: [resourceId] }));
          break;
        case "start":
          result = await ec2Client.send(new StartInstancesCommand({ InstanceIds: [resourceId] }));
          break;
        case "stop":
          result = await ec2Client.send(new StopInstancesCommand({ InstanceIds: [resourceId] }));
          break;
        default:
          return NextResponse.json({ message: "Invalid EC2 action" }, { status: 400 });
      }
    } else if (type === "RDS") {
      switch (action) {
        case "reboot":
          result = await rdsClient.send(new RebootDBInstanceCommand({ DBInstanceIdentifier: resourceId }));
          break;
        case "start":
          result = await rdsClient.send(new StartDBInstanceCommand({ DBInstanceIdentifier: resourceId }));
          break;
        case "stop":
          result = await rdsClient.send(new StopDBInstanceCommand({ DBInstanceIdentifier: resourceId }));
          break;
        default:
          return NextResponse.json({ message: "Invalid RDS action" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: "Invalid resource type" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${action} initiated for ${type} ${resourceId}`,
      result 
    });
  } catch (error: any) {
    console.error("Remediation API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
