export function getJobIdFromURL(): string | undefined {
  const jobId = new URLSearchParams(window.location.search).get("currentJobId");
  return jobId || undefined;
}
