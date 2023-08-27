declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

namespace NodeJS {
  interface ProcessEnv {
    // Vercel Specific

    /**
     * An indicator that the app is deployed and running on Vercel.
     *
     * Example: `1`
     */
    VERCEL: string;
    /**
     * The Environment that the app is deployed and running on.
     *
     * The value can be either `production`, `preview`, or `development`
     */
    VERCEL_ENV: "production" | "preview" | "development";
    /**
     * The domain name of the deployment URL.
     *
     * Example: *`.vercel.app`
     *
     * The value does not include the protocol scheme `https://`
     */
    VERCEL_URL: string;
    /**
     * The ID of the Region where the app is running.
     *
     * Example: `cdg1`
     *
     * **NOTE:** This Variable is only exposed during Runtime for Serverless Functions.
     */
    VERCEL_REGION: string;
    /**
     * The Git Provider the deployment is triggered from.
     *
     * Example: `github`
     */
    VERCEL_GIT_PROVIDER: string;
    /**
     * The origin repository the deployment is triggered from.
     *
     * Example: `my-site`
     */
    VERCEL_GIT_REPO_SLUG: string;
    /**
     * The account that owns the repository the deployment is triggered from.
     *
     * Example: `acme`
     */
    VERCEL_GIT_REPO_OWNER: string;
    /**
     * The ID of the repository the deployment is triggered from.
     *
     * Example: `117716146`
     */
    VERCEL_GIT_REPO_ID: string;
    /**
     * The git branch of the commit the deployment was triggered by.
     *
     * Example: `improve-about-page`
     */
    VERCEL_GIT_COMMIT_REF: string;
    /**
     * The git SHA of the commit the deployment was triggered by.
     *
     * Example: `fa1eade47b73733d6312d5abfad33ce9e4068081`
     */
    VERCEL_GIT_COMMIT_SHA: string;
    /**
     * The message attached to the commit the deployment was triggered by.
     *
     * Example: `Update about page`
     */
    VERCEL_GIT_COMMIT_MESSAGE: string;
    /**
     * The username attached to the author of the commit that the project was deployed by.
     *
     * Example: `johndoe`
     */
    VERCEL_GIT_COMMIT_AUTHOR_LOGIN: string;
    /**
     * The name attached to the author of the commit that the project was deployed by.
     *
     * Example: `John Doe`
     */
    VERCEL_GIT_COMMIT_AUTHOR_NAME: string;
    /**
     * The git [SHA](https://help.github.com/articles/github-glossary/#commit) of the last successful deployment for the project and branch.
     *
     * Example: `fa1eade47b73733d6312d5abfad33ce9e4068080`
     *
     * **NOTE:** This Variable is only exposed when an [Ignored Build Step](https://vercel.com/docs/concepts/projects/overview#ignored-build-step) is provided.
     */
    VERCEL_GIT_PREVIOUS_SHA: string;
    /**
     * The pull request id the deployment was triggered by.
     *
     * If a deployment is created on a branch before a pull request is made, this value will be an empty string.
     *
     * Example: `23`
     */
    VERCEL_GIT_PULL_REQUEST_ID: string;

    // NextJS Specific

    /**
     * The Environment that the app is deployed and running on.
     *
     * The value can be either `production`, `preview`, or `development`.
     */
    NEXT_PUBLIC_VERCEL_ENV: "production" | "preview" | "development";
    /**
     * The domain name of the deployment URL.
     *
     * Example: `*.vercel.app`
     *
     * The value does not include the protocol scheme `https://`
     */
    NEXT_PUBLIC_VERCEL_URL: string;
    /**
     * The Git Provider the deployment is triggered from.
     *
     * Example: `github`
     */
    NEXT_PUBLIC_VERCEL_GIT_PROVIDER: string;
    /**
     * The origin repository the deployment is triggered from.
     *
     * Example: `my-site`
     */
    NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG: string;
    /**
     * The account that owns the repository the deployment is triggered from.
     *
     * Example: `acme`
     */
    NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG: string;
    /**
     * The ID of the repository the deployment is triggered from.
     *
     * Example: `117716146`
     */
    NEXT_PUBLIC_VERCEL_GIT_REPO_ID: string;
    /**
     * The git branch of the commit the deployment was triggered by.
     *
     * Example: `improve-about-page`
     */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: string;
    /**
     * The git SHA of the commit the deployment was triggered by.
     *
     * Example: `fa1eade47b73733d6312d5abfad33ce9e4068081`
     */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: string;
    /**
     * The message attached to the commit the deployment was triggered by.
     *
     * Example: `Update about page`
     */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE: string;
    /**
     * The username attached to the author of the commit that the project was deployed by.
     *
     * Example: `johndoe`
     */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_LOGIN: string;
    /**
     * The name attached to the author of the commit that the project was deployed by.
     *
     * Example: `John Doe`
     */
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_NAME: string;
    /**
     * The pull request id the deployment was triggered by.
     *
     * If a deployment is created on a branch before a pull request is made, this value will be an empty string.
     *
     * Example: `23`
     */
    NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID: string;

    // Turborepo Specific

    TURBO_REMOTE_ONLY: string;
    NX_DAEMON: string;

    // Project Specific

    DISCORD_WEBHOOK_URL: string;
    REDIS_URL: string;
    UPSTASH_REDIS_REST_URL: `https://${string}.upstash.io`;
    UPSTASH_REDIS_REST_TOKEN: string;
    EDGE_CONFIG: `https://edge-config.vercel.com/${string}?token: ${string}`;
    EDGE_CONFIG_ID: string;
    VERCEL_ACCESS_TOKEN: string;
  }
}
