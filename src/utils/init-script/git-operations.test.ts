import { GitOperations } from './git-operations'
import { execSync } from 'child_process'

// Mock child_process module
jest.mock('child_process')
const MockExecSync = execSync as jest.MockedFunction<typeof execSync>

describe('GitOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkoutOrCreateBranch', () => {
    it('should checkout existing branch when it exists', () => {
      // Mock branchExists to return true
      MockExecSync
        .mockImplementationOnce(() => 'refs/heads/test-branch' as any) // branchExists check
        .mockImplementationOnce(() => undefined as any) // git checkout
        .mockImplementationOnce(() => undefined as any) // git reset

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      GitOperations.checkoutOrCreateBranch('test-branch', false)

      expect(consoleSpy).toHaveBeenCalledWith("Switched to and reset branch 'test-branch'")
      expect(MockExecSync).toHaveBeenCalledWith('git checkout test-branch', { stdio: 'pipe' })
      expect(MockExecSync).toHaveBeenCalledWith('git reset --hard HEAD', { stdio: 'pipe' })

      consoleSpy.mockRestore()
    })

    it('should create and checkout new branch when it does not exist', () => {
      // Mock branchExists to return false (throw error)
      MockExecSync
        .mockImplementationOnce(() => { throw new Error('Branch not found') }) // branchExists check
        .mockImplementationOnce(() => undefined as any) // git checkout -b

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      GitOperations.checkoutOrCreateBranch('new-branch', false)

      expect(consoleSpy).toHaveBeenCalledWith("Created and checked out to new branch 'new-branch'.")
      expect(MockExecSync).toHaveBeenCalledWith('git checkout -b new-branch', { stdio: 'pipe' })

      consoleSpy.mockRestore()
    })

    it('should throw error in test mode when git operation fails', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      expect(() => {
        GitOperations.checkoutOrCreateBranch('test-branch', true)
      }).toThrow('Git operation failed: Git command failed')
    })

    it('should exit process when git operation fails in non-test mode', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called') })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      expect(() => {
        GitOperations.checkoutOrCreateBranch('test-branch', false)
      }).toThrow('process.exit called')

      expect(consoleSpy).toHaveBeenCalledWith('Git operation failed:', 'Git command failed')
      expect(exitSpy).toHaveBeenCalledWith(1)

      exitSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('commitAndPush', () => {
    it('should commit and push changes successfully', () => {
      MockExecSync
        .mockImplementationOnce(() => undefined as any) // git add
        .mockImplementationOnce(() => undefined as any) // git commit
        .mockImplementationOnce(() => undefined as any) // git push

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      GitOperations.commitAndPush('test-branch', 'Test commit message', false)

      expect(MockExecSync).toHaveBeenCalledWith('git add .', { stdio: 'pipe' })
      expect(MockExecSync).toHaveBeenCalledWith('git commit -m "Test commit message"', { stdio: 'pipe' })
      expect(MockExecSync).toHaveBeenCalledWith('git push origin test-branch', { stdio: 'pipe' })
      expect(consoleSpy).toHaveBeenCalledWith("✅ Changes committed and pushed to branch 'test-branch'")

      consoleSpy.mockRestore()
    })

    it('should throw error in test mode when commit/push fails', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      expect(() => {
        GitOperations.commitAndPush('test-branch', 'Test commit message', true)
      }).toThrow('Git commit/push failed: Git command failed')
    })

    it('should exit process when commit/push fails in non-test mode', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called') })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      expect(() => {
        GitOperations.commitAndPush('test-branch', 'Test commit message', false)
      }).toThrow('process.exit called')

      expect(consoleSpy).toHaveBeenCalledWith('Git commit/push failed:', 'Git command failed')
      expect(exitSpy).toHaveBeenCalledWith(1)

      exitSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      MockExecSync.mockReturnValue('main' as any)

      const result = GitOperations.getCurrentBranch()

      expect(result).toBe('main')
      expect(MockExecSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' })
    })

    it('should return unknown when git command fails', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      const result = GitOperations.getCurrentBranch()

      expect(result).toBe('unknown')
    })
  })

  describe('isWorkingDirectoryClean', () => {
    it('should return true when working directory is clean', () => {
      MockExecSync.mockReturnValue('' as any)

      const result = GitOperations.isWorkingDirectoryClean()

      expect(result).toBe(true)
      expect(MockExecSync).toHaveBeenCalledWith('git status --porcelain', { encoding: 'utf8' })
    })

    it('should return false when working directory has changes', () => {
      MockExecSync.mockReturnValue('M  modified-file.txt' as any)

      const result = GitOperations.isWorkingDirectoryClean()

      expect(result).toBe(false)
    })

    it('should return false when git command fails', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Git command failed') })

      const result = GitOperations.isWorkingDirectoryClean()

      expect(result).toBe(false)
    })
  })

  describe('branchExists (private method)', () => {
    it('should return true when branch exists', () => {
      MockExecSync.mockReturnValue('refs/heads/test-branch' as any)

      // Access private method through reflection
      const result = (GitOperations as any).branchExists('test-branch')

      expect(result).toBe(true)
      expect(MockExecSync).toHaveBeenCalledWith('git show-ref --verify --quiet refs/heads/test-branch', { stdio: 'pipe' })
    })

    it('should return false when branch does not exist', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Branch not found') })

      // Access private method through reflection
      const result = (GitOperations as any).branchExists('nonexistent-branch')

      expect(result).toBe(false)
    })
  })
})
