const { execSync } = require('child_process')

/**
 * Manages Git branch operations for the init script
 */
class GitOperations {
  /**
   * Checkout to existing branch or create new one
   * @param {string} branchName - Name of the branch to checkout/create
   * @param {boolean} isTest - Whether running in test mode
   * @throws {Error} If checkout fails
   */
  static checkoutOrCreateBranch(branchName, isTest = false) {
    try {
      // Check if branch exists
      const branchExists = execSync(
        `git show-ref --verify --quiet refs/heads/${branchName}`,
        { stdio: 'pipe' }
      )

      if (branchExists === 0) {
        // Branch exists, just checkout to it
        execSync(`git checkout ${branchName}`, { stdio: 'inherit' })
        console.log(`Checked out to existing branch '${branchName}'.`)
      } else {
        // Branch doesn't exist, create and checkout to it
        execSync(`git checkout -B ${branchName}`, { stdio: 'inherit' })
        console.log(`Created and checked out to new branch '${branchName}'.`)
      }
    } catch (err) {
      // If the above command fails, it means the branch doesn't exist, so create it
      try {
        execSync(`git checkout -B ${branchName}`, { stdio: 'inherit' })
        console.log(`Created and checked out to new branch '${branchName}'.`)
      } catch (checkoutErr) {
        const errorMessage = `Failed to checkout to branch '${branchName}': ${checkoutErr.message}`
        console.error(errorMessage)
        if (isTest) {
          throw new Error(errorMessage)
        }
        process.exit(1)
      }
    }
  }

  /**
   * Commit and push changes to Git
   * @param {string} branchName - Name of the branch
   * @param {string} commitMessage - Commit message
   * @param {boolean} isTest - Whether running in test mode
   * @throws {Error} If Git operations fail
   */
  static commitAndPush(branchName, commitMessage, isTest = false) {
    try {
      execSync(`git add .`, { stdio: 'inherit' })
      console.log(`Added changes to git.`)

      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
      console.log(`Committed changes to git.`)

      execSync(`git push origin ${branchName} --tags`, { stdio: 'inherit' })
      console.log(`Pushed tags to origin.`)

      execSync(`git push origin ${branchName}`, { stdio: 'inherit' })
      console.log(`Pushed changes to origin.`)
    } catch (err) {
      const errorMessage = `Failed to create or finish the release branch: ${err.message}`
      console.error(errorMessage)
      if (isTest) {
        throw new Error(errorMessage)
      }
      process.exit(1)
    }
  }
}

module.exports = { GitOperations }
