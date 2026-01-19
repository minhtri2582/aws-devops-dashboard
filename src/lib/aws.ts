import { STSClient } from "@aws-sdk/client-sts";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import { EC2Client } from "@aws-sdk/client-ec2";
import { RDSClient } from "@aws-sdk/client-rds";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { EKSClient } from "@aws-sdk/client-eks";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";

const region = process.env.AWS_REGION || "ap-southeast-1";

const config = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
};

// If credentials are not in env, the SDK will try to load from default providers
const clientConfig = process.env.AWS_ACCESS_KEY_ID ? config : { region };

export const stsClient = new STSClient(clientConfig);
export const costExplorerClient = new CostExplorerClient(clientConfig);
export const ec2Client = new EC2Client(clientConfig);
export const rdsClient = new RDSClient(clientConfig);
export const cwLogsClient = new CloudWatchLogsClient(clientConfig);
export const cwClient = new CloudWatchClient(clientConfig);
export const eksClient = new EKSClient(clientConfig);
export const cloudTrailClient = new CloudTrailClient(clientConfig);
