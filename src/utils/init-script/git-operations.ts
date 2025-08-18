import { execSync } from 'child_process'

/**
 * Manages Git operations for the init script
 */
class GitOperations {
  /**
   * Checkout existing branch or create new one
   * @param branchName - Name of the branch to checkout/create
   * @param isTest - Whether running in test mode
   */
  static checkoutOrCreateBranch(branchName: string, isTest: boolean = false): void {
    try {
      // Check if branch exists
      const branchExists = this.branchExists(branchName)
      
      if (branchExists) {
        // Checkout existing branch
        console.log(`Switched to and reset branch '${branchName}'`)
        execSync(`git checkout ${branchName}`, { stdio: 'pipe' })
        execSync('git reset --hard HEAD', { stdio: 'pipe' })
      } else {
        // Create and checkout new branch
        console.log(`Created and checked out to new branch '${branchName}'.`)
        execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' })
      }
    } catch (error) {
      if (isTest) {
        throw new Error(`Git operation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      console.error('Git operation failed:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  }

  /**
   * Commit and push changes
   * @param branchName - Name of the branch
   * @param commitMessage - Commit message
   * @param isTest - Whether running in test mode
   */
  static commitAndPush(branchName: string, commitMessage: string, isTest: boolean = false): void {
    try {
      // Add all changes
      execSync('git add .', { stdio: 'pipe' })
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' })
      
      // Push to remote
      execSync(`git push origin ${branchName}`, { stdio: 'pipe' })
      
      console.log(`✅ Changes committed and pushed to branch '${branchName}'`)
    } catch (error) {
      if (isTest) {
        throw new Error(`Git commit/push failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      console.error('Git commit/push failed:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  }

  /**
   * Check if a branch exists
   * @param branchName - Name of the branch to check
   * @returns True if branch exists
   */
  private static branchExists(branchName: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current branch name
   * @returns Current branch name
   */
  static getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }

  /**
   * Check if working directory is clean
   * @returns True if working directory is clean
   */
  static isWorkingDirectoryClean(): boolean {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
      return status === ''
    } catch {
      return false
    }
  }
}

export { GitOperations }
