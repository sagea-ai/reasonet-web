import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import { db } from '@/lib/db'
import { GitHubPRPayload, PullRequest } from '@/types/pr'
import { analyzeCodeQuality, CodeQualityResult } from '@/analyses/code-quality'
import { performSecurityScan, SecurityIssue } from '@/analyses/security-scan'
import { generatePRGist, PRGistResult } from '@/analyses/pr-gist'

function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-hub-signature-256')
    const event = headersList.get('x-github-event')
    
    console.log(`[GitHub Webhook] Received event: ${event}, URL: ${request.url}`)

    if (!signature || !verifyGitHubWebhook(body, signature)) {
      console.error('[GitHub Webhook] Invalid signature - authentication failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log(`[GitHub Webhook] Signature verified, processing ${event} event`)
    const payload = JSON.parse(body)

    switch (event) {
      case 'installation':
        await handleInstallation(payload)
        break
      case 'installation_repositories':
        await handleInstallationRepositories(payload)
        break
      case 'pull_request':
        console.log(`[GitHub Webhook] Received pull_request event, action: ${payload.action}, PR: #${payload.pull_request?.number}`)
        await handlePullRequest(payload as GitHubPRPayload)
        break
      case 'check_suite':
        console.log(`[GitHub Webhook] Received check_suite event, action: ${payload.action}`)
        await handleCheckSuite(payload)
        break
      case 'push':
        // Handle push events if needed
        break
      case 'issues':
        // Handle issue events if needed
        break
      default:
        console.log(`Unhandled event: ${event}`)
    }

    return NextResponse.json({ message: 'Webhook processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleInstallation(payload: any) {
  const { action, installation, sender } = payload

  if (action === 'created') {
    // Store installation data
    const installationRecord = await db.gitHubInstallation.upsert({
      where: { installationId: installation.id.toString() },
      update: {
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.target_type,
        permissions: installation.permissions,
        events: installation.events,
        suspendedAt: installation.suspended_at ? new Date(installation.suspended_at) : null,
        updatedAt: new Date(),
      },
      create: {
        installationId: installation.id.toString(),
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.target_type,
        permissions: installation.permissions,
        events: installation.events,
        suspendedAt: installation.suspended_at ? new Date(installation.suspended_at) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Store repositories if included
    if (installation.repositories) {
      for (const repo of installation.repositories) {
        await storeRepository(repo, installation.id.toString(), null)
      }
    }
  } else if (action === 'deleted') {
    // Remove installation and associated repositories
    await db.repository.deleteMany({
      where: { githubInstallationId: installation.id.toString() }
    })
    await db.gitHubInstallation.delete({
      where: { installationId: installation.id.toString() },
    })
  }
}

async function handleInstallationRepositories(payload: any) {
  const { action, installation, repositories_added, repositories_removed } = payload

  if (action === 'added' && repositories_added) {
    for (const repo of repositories_added) {
      await storeRepository(repo, installation.id.toString(), null)
    }
  } else if (action === 'removed' && repositories_removed) {
    for (const repo of repositories_removed) {
      await db.repository.delete({
        where: { githubId: repo.id.toString() },
      })
    }
  }
}

async function storeRepository(repo: any, installationId: string, organizationId: string | null) {
  // If no organizationId provided, try to find one or skip
  if (!organizationId) {
    const installation = await db.gitHubInstallation.findUnique({
      where: { installationId },
      include: { organization: true }
    })
    
    if (!installation?.organization) {
      console.warn(`No organization linked to installation ${installationId}, skipping repository ${repo.full_name}`)
      return
    }
    organizationId = installation.organization.id
  }

  try {
    return await db.repository.upsert({
      where: { githubId: repo.id.toString() },
      update: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        isPrivate: repo.private,
        language: repo.language,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        defaultBranch: repo.default_branch || 'main',
        githubInstallationId: installationId,
        updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
      },
      create: {
        githubId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        isPrivate: repo.private,
        language: repo.language,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        defaultBranch: repo.default_branch || 'main',
        organizationId: organizationId,
        githubInstallationId: installationId,
        createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
        updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
      },
    })
  } catch (error) {
    console.error(`Failed to store repository ${repo.full_name}:`, error)
    throw error
  }
}

/**
 * Handles GitHub pull request webhook events
 * Stores PR metadata and triggers automated analysis and comment
 */
async function handlePullRequest(payload: GitHubPRPayload) {
  const { action, pull_request, repository } = payload

  // Only handle opened and synchronize events for now
  if (!['opened', 'synchronize'].includes(action)) {
    console.log(`Ignoring PR action: ${action}`)
    return
  }

  console.log(`Processing PR #${pull_request.number} in ${repository.full_name}: ${action}`)
  console.log(`Automatic analysis triggered for PR #${pull_request.number}`)

  try {      
    console.log(`Looking up repository: ${repository.full_name} (ID: ${repository.id})`)
    // Find the repository in our database
    const repo = await db.repository.findFirst({
      where: { githubId: repository.id.toString() },
      include: { organization: true }
    })

    if (!repo) {
      console.error(`Repository ${repository.full_name} not found in database. Make sure the GitHub App is installed and the repository is registered.`)
      return
    }
    
    console.log(`Found repository in database: ${repo.fullName} (ID: ${repo.id}), GitHub Installation ID: ${repo.githubInstallationId || 'none'}`)
    
    // Ensure repo is properly typed
    const typedRepo = repo as any

    // Create PR record in database
    const prData: Omit<PullRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      number: pull_request.number,
      title: pull_request.title,
      body: pull_request.body || '',
      branch: pull_request.head.ref,
      baseBranch: pull_request.base.ref,
      repoName: repository.name,
      repoFullName: repository.full_name,
      authorUsername: pull_request.user.login,
      authorId: pull_request.user.id.toString(),
      status: 'pending',
      githubUrl: pull_request.html_url
    }

    // Store PR in database (using Analysis model for now)
    const analysis = await db.analysis.create({
      data: {
        name: `PR #${pull_request.number}: ${pull_request.title}`,
        status: 'PENDING',
        type: 'PULL_REQUEST',
        repositoryId: repo.id,
        userId: repo.organization.creatorId, // TODO: Map to actual PR author
        prNumber: pull_request.number,
        branch: pull_request.head.ref,
        commit: pull_request.head.sha,
        options: {
          prData,
          githubPayload: payload as any
        }
      }
    })

    console.log(`Created analysis record ${analysis.id} for PR #${pull_request.number}`)

    // Run OpenAI analysis
    try {
      console.log(`Running OpenAI analysis for PR #${pull_request.number}`)
      
      // Update status to processing
      await db.analysis.update({
        where: { id: analysis.id },
        data: { status: 'PROCESSING' }
      })

      // Fetch the diff from GitHub using proper auth
      let octokit;
      
      if (typedRepo.githubInstallationId) {
        // Use GitHub App installation token if available
        const appId = process.env.GITHUB_APP_ID;
        const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        if (appId && privateKey) {
          console.log(`Using GitHub App auth with installation ID: ${typedRepo.githubInstallationId}, App ID: ${appId}`);
          try {
            octokit = new Octokit({
              authStrategy: createAppAuth,
              auth: {
                appId,
                privateKey,
                installationId: typedRepo.githubInstallationId,
              }
            });
            console.log('GitHub App authentication successful');
          } catch (authError) {
            console.error('Failed to authenticate with GitHub App:', authError);
          }
        } else {
          console.error('Missing GitHub App credentials despite having installation ID. GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY environment variables may be missing.');
        }
      } 
      
      if (!octokit) {
        // Fall back to personal access token
        const token = process.env.GITHUB_TOKEN;
        if (token) {
          console.log('Falling back to personal access token for GitHub API');
          octokit = new Octokit({
            auth: token
          });
        } else {
          console.error('No GitHub authentication method available. Both GitHub App and personal token auth failed.');
          throw new Error('GitHub authentication failed - check environment variables');
        }
      }
      
      const [owner, repo] = repository.full_name.split('/');
      
      console.log(`Fetching diff for PR #${pull_request.number} from ${owner}/${repo}`);
      
      try {
        const diffResponse = await octokit.pulls.get({
          owner,
          repo,
          pull_number: pull_request.number,
          mediaType: { format: 'diff' }
        });
        
        const diff = diffResponse.data as unknown as string;
        console.log(`Successfully fetched diff for PR #${pull_request.number} (${diff.length} bytes)`);
        
        // Run analyses in parallel with PR Gist generation included
        const [qualityResults, securityResults, prGist] = await Promise.all([
          analyzeCodeQuality(payload, diff),
          performSecurityScan(payload, diff),
          generatePRGist(payload, diff)
        ]);
        
        console.log(`Analysis complete: ${qualityResults.length} quality issues, ${securityResults.length} security issues`);
        
        // Store results in database
        const allResults = [
          ...qualityResults.map((issue: CodeQualityResult) => ({
            analysisId: analysis.id,
            type: 'CODE_QUALITY' as const,
            severity: issue.severity,
            title: issue.message,
            description: issue.suggestion || '',
            location: issue.file,
            lineStart: issue.lineNumber,
            lineEnd: issue.lineNumber,
            code: issue.code || '',
            status: 'OPEN' as const
          })),
          ...securityResults.map((issue: SecurityIssue) => ({
            analysisId: analysis.id,
            type: 'SECURITY' as const,
            severity: issue.severity,
            title: issue.message,
            description: issue.remediation || '',
            location: issue.file,
            lineStart: issue.lineNumber,
            lineEnd: issue.lineNumber,
            code: issue.code || '',
            status: 'OPEN' as const
          }))
        ];
        
        // Store all results in database
        if (allResults.length > 0) {
          await db.analysisResult.createMany({
            data: allResults
          });
          console.log(`Stored ${allResults.length} analysis results in database`);
        }

        // Load required modules explicitly
        console.log('Loading gist and comment creation modules');
        const { createAnalysisGist, postPRComment, updatePRDescription } = await import('@/lib/gist');
        
        // Get installation ID for GitHub App auth
        const installationId = typedRepo.githubInstallationId || undefined;
        console.log(`Using installation ID for GitHub operations: ${installationId || 'none (using PAT fallback)'}`);
        
        // Create GitHub Gist with analysis results (if possible)
        let gistUrl = '';
        try {
          // Try to create a Gist, but don't fail if it's not possible (returns empty string)
          gistUrl = await createAnalysisGist(
            repository.full_name,
            pull_request.number,
            pull_request.title,
            qualityResults,
            securityResults,
            prGist, // Include PR gist in webhook flow
            installationId
          );
          
          console.log(`Successfully created Gist for PR #${pull_request.number}: ${gistUrl || 'No URL returned'}`);
        } catch (gistError) {
          console.error(`Failed to create Gist for PR #${pull_request.number}:`, gistError);
          console.error(`Gist creation error details: ${gistError instanceof Error ? gistError.message : 'Unknown error'}`);
          // Continue with PR comment even if gist creation fails
        }
        
        // Post a comment on the PR - this is the critical part that needs to work
        try {
          console.log(`Attempting to post comment on PR #${pull_request.number} for repo ${repository.full_name}`);
          
          // Ensure we have permissions to post comments - extra validation
          if (typedRepo.githubInstallationId) {
            console.log(`Verifying GitHub App permissions for installation ${typedRepo.githubInstallationId}`);
            // App should have the 'pull_requests: write' permission
          }
          
          await postPRComment(
            repository.full_name,
            pull_request.number,
            gistUrl,
            prGist, // Include PR gist in the comment
            installationId,
            qualityResults,
            securityResults
          );
          
          console.log(`Successfully posted comment on PR #${pull_request.number}`);
        } catch (commentError) {
          console.error(`Failed to post comment on PR #${pull_request.number}:`, commentError);
          console.error(`Comment error details: ${commentError instanceof Error ? commentError.message : 'Unknown error'}`);
          throw commentError; // Re-throw to ensure we see the full error
        }

        // Update the PR description with Reasonet summary
        try {
          console.log(`Attempting to update PR description for PR #${pull_request.number}`);
          
          await updatePRDescription(
            repository.full_name,
            pull_request.number,
            pull_request.body || '',
            prGist,
            installationId
          );
          
          console.log(`Successfully updated PR description for PR #${pull_request.number}`);
        } catch (descriptionError) {
          console.error(`Failed to update PR description for PR #${pull_request.number}:`, descriptionError);
          // Don't throw - this is a nice-to-have feature that shouldn't break the main flow
        }

        // Update analysis status to completed
        await db.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            options: JSON.parse(JSON.stringify({
              ...prData,
              githubPayload: payload,
              diff,
              gistUrl,
              resultsCount: allResults.length,
              prGist: prGist ? JSON.parse(JSON.stringify(prGist)) : null // Store serialized PRGistResult in options
            }))
          }
        });
        
        console.log(`Analysis completed for PR #${pull_request.number} with ${allResults.length} results`);
      } catch (apiError) {
        console.error(`GitHub API error for PR #${pull_request.number}:`, apiError);
        throw apiError;
      }
    }
    catch (analysisError) {
      console.error(`Analysis failed for PR #${pull_request.number}:`, analysisError)
      
      await db.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          options: JSON.parse(JSON.stringify({
            ...prData,
            githubPayload: payload,
            error: analysisError instanceof Error ? analysisError.message : 'Unknown analysis error'
          }))
        }
      })
    }
  } catch (error) {
    console.error(`Error processing PR #${pull_request.number}:`, error)
    throw error
  }
}

/**
 * Handles GitHub check_suite webhook events
 * Finds related PRs and triggers analysis for them
 */
async function handleCheckSuite(payload: any) {
  const { action, check_suite, repository } = payload

  // Only process requested or rerequested check suites
  if (!['requested', 'rerequested'].includes(action)) {
    console.log(`Ignoring check_suite action: ${action}`);
    return;
  }

  console.log(`Processing check_suite ${action} for repo ${repository.full_name}, head branch: ${check_suite.head_branch}`);

  try {
    // Find the repository in our database
    const repo = await db.repository.findFirst({
      where: { githubId: repository.id.toString() },
      include: { organization: true }
    });

    if (!repo) {
      console.error(`Repository ${repository.full_name} not found in database. Cannot trigger analysis.`);
      return;
    }

    // Set up GitHub API client
    let octokit;
    const typedRepo = repo as any;
    
    if (typedRepo.githubInstallationId) {
      // Use GitHub App installation token
      const appId = process.env.GITHUB_APP_ID;
      const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (appId && privateKey) {
        console.log(`Using GitHub App auth with installation ID: ${typedRepo.githubInstallationId}`);
        try {
          octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
              appId,
              privateKey,
              installationId: typedRepo.githubInstallationId,
            }
          });
        } catch (authError) {
          console.error('Failed to authenticate with GitHub App:', authError);
        }
      }
    } 
    
    if (!octokit) {
      // Fall back to personal access token
      const token = process.env.GITHUB_TOKEN;
      if (token) {
        octokit = new Octokit({ auth: token });
      } else {
        console.error('No GitHub authentication method available');
        return;
      }
    }

    // Get pull requests associated with this check suite
    const [owner, repoName] = repository.full_name.split('/');
    
    console.log(`Finding PRs associated with branch ${check_suite.head_branch} in ${owner}/${repoName}`);
    
    // Find PRs associated with the check suite's head branch
    const pullRequests = await octokit.pulls.list({
      owner,
      repo: repoName,
      state: 'open',
      head: `${owner}:${check_suite.head_branch}`
    });

    if (pullRequests.data.length === 0) {
      console.log(`No open PRs found for check suite on branch ${check_suite.head_branch}`);
      return;
    }

    // For each PR, trigger our analysis
    for (const pr of pullRequests.data) {
      console.log(`Found related PR #${pr.number} for check suite, triggering analysis`);
      
      // Create a PR payload format that matches what our handler expects
      const prPayload: GitHubPRPayload = {
        action: 'opened', // Simulate opened action
        number: pr.number,
        pull_request: pr as any,
        repository: repository
      };
      
      // Process the PR using our existing handler
      await handlePullRequest(prPayload);
    }
    
  } catch (error) {
    console.error(`Error processing check_suite for analysis:`, error);
  }
}
