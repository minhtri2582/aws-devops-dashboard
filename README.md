# AWS Ops Console v2.0 (SRE/DevOps Focused)

A high-performance, real-time AWS monitoring dashboard designed specifically for SRE and DevOps roles. It prioritizes system health, incident response, and resource utilization.

## Core SRE Features
- **Global Error Ticker**: Instant visibility into critical events across all regions.
- **Incident Feed**: Aggregated view of CloudWatch errors, CloudTrail failures, and high-resource utilization alerts.
- **Health-Priority Sorting**: Resources (EC2/RDS) are automatically sorted by health score and utilization levels.
- **Failed Action Audit**: Enhanced CloudTrail integration highlighting `AccessDenied` and other API errors.
- **SRE Health Cards**: Real-time summary of System Health, Fleet status, Burn Rate, and Security posture.
- **Auto-Sync**: Background synchronization every 120 seconds.

## Getting Started

### Prerequisites
- AWS Credentials configured in your environment or `.env` file.
- Node.js installed.

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view your Ops Console.

## Environment Variables
The following environment variables are required:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (optional)
