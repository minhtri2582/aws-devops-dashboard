# AWS Ops Console v2.0 (SRE/DevOps Focused)

A high-performance, real-time AWS monitoring dashboard designed specifically for SRE and DevOps roles. It prioritizes system health, incident response, and resource utilization.

## Core SRE Features
- **Global Error Ticker**: Instant visibility into critical events across all regions.
- **Incident Feed**: Aggregated view of CloudWatch errors, CloudTrail failures, and high-resource utilization alerts.
- **Health-Priority Sorting**: Resources (EC2/RDS) are automatically sorted by health score and utilization levels.
- **Failed Action Audit**: Enhanced CloudTrail integration highlighting `AccessDenied` and other API errors.
- **SRE Health Cards**: Real-time summary of System Health, Fleet status, Burn Rate, and Security posture.
- **Auto-Sync**: Background synchronization every 120 seconds.
- **Secure Access**: Integrated password protection via environment variables.

## Getting Started

### Prerequisites
- AWS Credentials configured in your environment or `.env` file.
- Node.js installed.
- Docker (optional, for containerization).

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PASSWORD_LOGIN=your_secure_password
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_SESSION_TOKEN=...
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view your Ops Console.

## Containerization & Deployment

### Docker
The application is optimized for Next.js standalone mode. To build and run the container:

```bash
docker build -t minhtri2582/aws-devops:latest .
docker run -p 3000:3000 --env-file .env minhtri2582/aws-devops:latest
```

### Kubernetes (K3s)
Manifests are provided in the `k8s/` directory for deployment on Elisoft K3s or similar clusters.

1. Update `k8s/secret.yaml` with your base64 encoded credentials.
2. Apply the manifests:
   ```bash
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```
The dashboard will be available at `aws-dashboard.k.elidev.info`.

## Environment Variables
The following environment variables are required:
- `PASSWORD_LOGIN`: The password required to access the dashboard.
- `AWS_REGION`: Target AWS region.
- `AWS_ACCESS_KEY_ID`: AWS Access Key.
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Key.
- `AWS_SESSION_TOKEN`: AWS Session Token (required for temporary credentials).
