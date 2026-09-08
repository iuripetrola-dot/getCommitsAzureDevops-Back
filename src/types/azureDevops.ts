export interface RepositoryTarget {
  project: string;
  repo: string;
}

export interface ConfiguredAuthor {
  name: string;
  email: string;
}

export interface ShellConfig {
  orgUrl: string;
  daysAgo: number;
  insecureTls: boolean;
  caCertPath: string;
  authors: ConfiguredAuthor[];
  authorEmails: string[];
  repositories: RepositoryTarget[];
}

export interface RootConfigFile {
  server: {
    port: number;
    corsOrigin: string | boolean;
  };
  azureDevops: {
    base64AuthInfo: string;
    orgUrl: string;
    daysAgo: number;
    insecureTls: boolean;
    caCertPath: string;
    authors: ConfiguredAuthor[];
    authorEmails: string[];
    repositories: RepositoryTarget[];
  };
}

export interface AzureBranchRef {
  name: string;
}

export interface AzureGitCommit {
  commitId?: string;
  comment?: string;
  author?: {
    name?: string;
    email?: string;
    date?: string;
  };
}

export interface AzureIdentityRef {
  displayName?: string;
  uniqueName?: string;
}

export interface AzureGitPullRequest {
  pullRequestId?: number;
  title?: string;
  status?: string;
  creationDate?: string;
  sourceRefName?: string;
  targetRefName?: string;
  createdBy?: AzureIdentityRef;
  reviewers?: AzureIdentityRef[];
  _links?: {
    web?: {
      href?: string;
    };
  };
}

export interface AzureListResponse<T> {
  count?: number;
  value?: T[];
}

export interface CommitResult {
  id: string;
  author: string;
  email: string;
  repository: string;
  branch: string;
  rawDate: string;
  message: string;
  commitId: string;
  date: string | null;
}

export interface PullRequestResult {
  id: number;
  title: string;
  status: string;
  repository: string;
  project: string;
  author: string;
  email: string;
  sourceBranch: string;
  targetBranch: string;
  reviewers: string[];
  createdAt: string | null;
  url: string;
}
