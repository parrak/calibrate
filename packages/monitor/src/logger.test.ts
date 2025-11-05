import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Logger, LogLevel, createRequestLogger } from './logger'

describe('Logger', () => {
  let logger: Logger
  let consoleLogSpy: ReturnType<typeof vi.spyOn<typeof console, 'log'>>

  beforeEach(() => {
    logger = new Logger({ service: 'test-service', environment: 'test' })
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should log info messages', () => {
    logger.info('Test message')
    expect(consoleLogSpy).toHaveBeenCalled()
    const logged = consoleLogSpy.mock.calls[0][0] as string
    expect(logged).toContain('Test message')
    expect(logged).toContain('test-service')
  })

  it('should log error messages with error object', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', error)
    expect(consoleLogSpy).toHaveBeenCalled()
    const logged = consoleLogSpy.mock.calls[0][0] as string
    expect(logged).toContain('Error occurred')
    expect(logged).toContain('Test error')
  })

  it('should respect log level', () => {
    const errorLogger = new Logger({ service: 'test', logLevel: LogLevel.ERROR })
    errorLogger.debug('Debug message')
    errorLogger.info('Info message')
    expect(consoleLogSpy).not.toHaveBeenCalled()
    
    errorLogger.error('Error message')
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  it('should create request logger with context', () => {
    const mockRequest = {
      headers: new Headers({
        'x-request-id': 'test-request-id',
        'x-calibr-project': 'test-project',
        'user-agent': 'test-agent'
      }),
      method: 'GET',
      url: 'https://example.com/test'
    }

    const requestLogger = createRequestLogger(logger, mockRequest)
    requestLogger.info('Request message')
    
    expect(consoleLogSpy).toHaveBeenCalled()
    const logged = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
    expect(logged.requestId).toBe('test-request-id')
    expect(logged.projectId).toBe('test-project')
    expect(logged.metadata?.method).toBe('GET')
  })
})

