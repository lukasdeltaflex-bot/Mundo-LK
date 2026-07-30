export const AIConfiguration = {
  pipelineVersion: 1,
  promptVersion: 1,
  providerVersion: 1,
  validatorVersion: 1,

  maxPromptTokens: 4096,
  maxResponseTokens: 8192,
  retryLimit: 2,
  timeoutMs: 15000,
  cacheTTLMs: 10 * 60 * 1000, // 10 minutos
  telemetryEnabled: true,
};
