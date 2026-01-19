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

    const formattedEvents = (events.Events || []).map((e) => ({
      id: e.EventId,
      name: e.EventName,
      user: e.Username,
      time: e.EventTime,
      resourceType: e.Resources?.[0]?.ResourceType,
      resourceName: e.Resources?.[0]?.ResourceName,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error: any) {
    console.error("CloudTrail API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
