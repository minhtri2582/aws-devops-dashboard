import { NextResponse } from "next/server";
import { stsClient, costExplorerClient } from "@/lib/aws";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

export async function GET() {
  try {
    // Check connection/identity
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));

    // Get billing data for the last 30 days
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const billing = await costExplorerClient.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatDate(start),
          End: formatDate(end),
        },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
      })
    );

    const currentMonthCost = billing.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || "0";
    const currency = billing.ResultsByTime?.[0]?.Total?.UnblendedCost?.Unit || "USD";

    return NextResponse.json({
      status: "online",
      identity: {
        account: identity.Account,
        arn: identity.Arn,
        userId: identity.UserId,
      },
      billing: {
        amount: parseFloat(currentMonthCost).toFixed(2),
        currency,
        period: {
          start: formatDate(start),
          end: formatDate(end),
        },
      },
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
