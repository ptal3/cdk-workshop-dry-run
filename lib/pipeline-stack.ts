import { Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";


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
                installCommands: ["npm i -g npm@latest"],
                commands: ["npm ci", "npm run build", "npx cdk synth"],
            }),
        });
    }
}