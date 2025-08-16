const { execSync } = require('child_process')
const { GitOperations } = require('./git-operations')

// Mock child_process
jest.mock('child_process')

describe('GitOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset process.exit mock
    process.exit = jest.fn()
  })

  describe('checkoutOrCreateBranch', () => {
    it('should checkout existing branch when it exists', () => {
      // Mock successful branch check
      execSync.mockReturnValueOnce(0)
      execSync.mockReturnValueOnce(undefined) // checkout successful

      GitOperations.checkoutOrCreateBranch('test-branch', false)

      expect(execSync).toHaveBeenCalledWith(
        'git show-ref --verify --quiet refs/heads/test-branch',
        { stdio: 'pipe' }
      )
      expect(execSync).toHaveBeenCalledWith('git checkout test-branch', {
        stdio: 'inherit',
      })
    })

    it('should create and checkout new branch when it does not exist', () => {
      // Mock branch does not exist
      execSync.mockReturnValueOnce(1)
      execSync.mockReturnValueOnce(undefined) // checkout -B successful

      GitOperations.checkoutOrCreateBranch('new-branch', false)

      expect(execSync).toHaveBeenCalledWith('git checkout -B new-branch', {
        stdio: 'inherit',
      })
    })

    it('should handle git show-ref failure and create new branch', () => {
      // Mock git show-ref failure
      execSync.mockImplementationOnce(() => {
        throw new Error('git command failed')
      })
      execSync.mockReturnValueOnce(undefined) // checkout -B successful

      GitOperations.checkoutOrCreateBranch('fallback-branch', false)

      expect(execSync).toHaveBeenCalledWith('git checkout -B fallback-branch', {
        stdio: 'inherit',
      })
    })

    it('should throw error in test mode when checkout fails', () => {
      // Mock git show-ref failure
      execSync.mockImplementationOnce(() => {
        throw new Error('git command failed')
      })
      // Mock checkout -B failure
      execSync.mockImplementationOnce(() => {
        throw new Error('checkout failed')
      })

      expect(() => {
        GitOperations.checkoutOrCreateBranch('test-branch', true)
      }).toThrow("Failed to checkout to branch 'test-branch': checkout failed")
    })

    it('should exit process when checkout fails in non-test mode', () => {
      // Mock git show-ref failure
      execSync.mockImplementationOnce(() => {
        throw new Error('git command failed')
      })
      // Mock checkout -B failure
      execSync.mockImplementationOnce(() => {
        throw new Error('checkout failed')
      })

      GitOperations.checkoutOrCreateBranch('test-branch', false)

      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('commitAndPush', () => {
    it('should execute all git commands successfully', () => {
      execSync.mockReturnValue(undefined) // All commands successful

      GitOperations.commitAndPush('test-branch', 'feat: test', false)

      expect(execSync).toHaveBeenCalledWith('git add .', { stdio: 'inherit' })
      expect(execSync).toHaveBeenCalledWith('git commit -m "feat: test"', {
        stdio: 'inherit',
      })
      expect(execSync).toHaveBeenCalledWith(
        'git push origin test-branch --tags',
        { stdio: 'inherit' }
      )
      expect(execSync).toHaveBeenCalledWith('git push origin test-branch', {
        stdio: 'inherit',
      })
    })

    it('should throw error in test mode when git operations fail', () => {
      execSync.mockImplementation(() => {
        throw new Error('git command failed')
      })

      expect(() => {
        GitOperations.commitAndPush('test-branch', 'feat: test', true)
      }).toThrow(
        'Failed to create or finish the release branch: git command failed'
      )
    })

    it('should exit process when git operations fail in non-test mode', () => {
      execSync.mockImplementation(() => {
        throw new Error('git command failed')
      })

      GitOperations.commitAndPush('test-branch', 'feat: test', false)

      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})
