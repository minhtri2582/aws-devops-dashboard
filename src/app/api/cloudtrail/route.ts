import { NextResponse } from "next/server";
import { cloudTrailClient } from "@/lib/aws";
import { LookupEventsCommand } from "@aws-sdk/client-cloudtrail";

export async function GET() {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const events = await cloudTrailClient.send(
      new LookupEventsCommand({
        StartTime: start,
        EndTime: end,
        LookupAttributes: [
          {
            AttributeKey: "ReadOnly",
            AttributeValue: "false", // Only write/edit events
          },
        ],
        MaxResults: 20,
      })
    );

    const formattedEvents = (events.Events || []).map((e) => {
      const name = e.EventName || "";
      let category = "OTHER";
      
      if (name.startsWith("Create") || name.startsWith("Run") || name.startsWith("Put") || name.startsWith("Post") || name.startsWith("Allocate")) {
        category = "CREATE";
      } else if (name.startsWith("Delete") || name.startsWith("Terminate") || name.startsWith("Remove") || name.startsWith("Release")) {
        category = "DELETE";
      } else if (name.startsWith("Update") || name.startsWith("Modify") || name.startsWith("Set") || name.startsWith("Change")) {
        category = "UPDATE";
      }

      // Try to get more detailed actor and error info from the raw event JSON
      let actorDetail = e.Username;
      let errorCode = undefined;
      let errorMessage = undefined;
      try {
        const rawEvent = JSON.parse(e.CloudTrailEvent || "{}");
        errorCode = rawEvent.errorCode;
        errorMessage = rawEvent.errorMessage;
        
        if (rawEvent.userIdentity) {
          const ui = rawEvent.userIdentity;
          if (ui.type === "AssumedRole" && ui.arn) {
            actorDetail = ui.arn.split("/").pop(); // Get role name
          } else if (ui.userName) {
            actorDetail = ui.userName;
          }
        }
      } catch (err) {
        // Fallback
      }

      return {
        id: e.EventId,
        name: e.EventName,
        user: actorDetail,
        rawUser: e.Username,
        time: e.EventTime,
        category,
        eventSource: e.EventSource,
        resources: (e.Resources || []).map(r => ({
          type: r.ResourceType,
          name: r.ResourceName
        })),
        errorCode: errorCode,
        errorMessage: errorMessage,
      };
    });

    return NextResponse.json({ events: formattedEvents });
  } catch (error: any) {
    console.error("CloudTrail API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
