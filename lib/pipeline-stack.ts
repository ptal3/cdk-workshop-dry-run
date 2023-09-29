import { Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { WorkshopPipelineStage } from "./pipeline-stage";


export class WorkshopPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Creates a CodeCommit repository called 'WorkshopRepo'
        const repo = new Repository(this, 'WorkshopRepo', {
            repositoryName: "WorkshopRepo"
        });

        // Basic pipeline declaration. This sets the initial strucuture of our pipeline.
        const pipeline = new CodePipeline(this, "Pipeline", {
            pipelineName: "WorkshopPipeline",
            synth: new CodeBuildStep("SynthStep", {
                input: CodePipelineSource.codeCommit(repo, "main"),
                installCommands: ["npm i -g npm@9.5.1"],
                commands: ["npm ci", "npm run build", "npx cdk synth"],
            }),
        });

        const deploy = new WorkshopPipelineStage(this, "Deploy");
        const deployStage = pipeline.addStage(deploy);

        // Add a test step
        deployStage.addPost(
            new CodeBuildStep("TestViewerEndpoint", {
                projectName: "TestViewerEndpoint",
                envFromCfnOutputs: {
                    ENDPOINT_URL: deploy.hcViewerUrl,
                },
                commands: ["curl -Ssf $ENDPOINT_URL"],
            }),

            new CodeBuildStep("TestAPIGatewayEndpoint", {
                projectName: "TestAPIGatewayEndpoint",
                envFromCfnOutputs: {
                    ENDPOINT_URL: deploy.hcEndpoint,                    
                },
                commands: ["curl -Ssf $ENDPOINT_URL", "curl -Ssf $ENDPOINT_URL/hello", "curl -Ssf $ENDPOINT_URL/test"]
            })
        );
    }
}